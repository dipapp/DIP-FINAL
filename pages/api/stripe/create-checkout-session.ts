import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

function initAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n'),
      } as any),
    });
  }
  return getAdminFirestore();
}

// Create per-vehicle subscription checkout session (webhook-first flow)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!secretKey) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });
  }
  if (!priceId) {
    return res.status(500).json({ error: 'Missing STRIPE_PRICE_ID' });
  }
  if (!priceId.startsWith('price_')) {
    return res.status(400).json({ error: 'STRIPE_PRICE_ID must be a Price ID starting with "price_"' });
  }

  const { vehicleId, userId, customerEmail, customerId, vin, licensePlate } = req.body || {};
  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'vehicleId is required' });
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });
    const db = initAdmin();
    console.log('[stripe] create-checkout-session start', {
      vehicleId,
      userId,
      hasCustomerId: Boolean(customerId),
      vin: typeof vin === 'string' && vin ? vin.slice(-6) : undefined,
      licensePlate,
    });

    // Resolve a single Stripe customer per user (server-side authority)
    let resolvedCustomerId: string | undefined = undefined;
    if (typeof customerId === 'string' && customerId.startsWith('cus_')) {
      resolvedCustomerId = customerId;
    } else if (typeof userId === 'string' && userId) {
      try {
        const userRef = db.collection('users').doc(userId);
        const snap = await userRef.get();
        const data = snap.exists ? (snap.data() as any) : {};
        const existing = data?.stripe?.customerId as string | undefined;
        if (existing && existing.startsWith('cus_')) {
          resolvedCustomerId = existing;
        } else {
          const created = await stripe.customers.create({
            email: typeof customerEmail === 'string' ? customerEmail : undefined,
            metadata: { firebaseUid: userId },
          });
          resolvedCustomerId = created.id;
          await userRef.set(
            {
              stripe: { ...(data?.stripe || {}), customerId: created.id },
              updatedAt: new Date(),
            },
            { merge: true }
          );
        }
      } catch (e) {
        console.error('[stripe] failed to resolve/create customer', e);
      }
    }

    // Always create a new subscription via Checkout Session for this specific vehicle

    const origin = (req.headers.origin as string) || `https://${req.headers.host}` || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Webhook will confirm and flip isActive. Success page only shows pending UI.
      success_url: `${origin}/dashboard/vehicles?vehicleId=${encodeURIComponent(vehicleId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/vehicles?cancelled=1`,
      metadata: {
        vehicleId,
        userId: typeof userId === 'string' ? userId : '',
        vin: typeof vin === 'string' ? vin : '',
        licensePlate: typeof licensePlate === 'string' ? licensePlate : '',
      },
      subscription_data: {
        metadata: {
          vehicleId,
          userId: typeof userId === 'string' ? userId : '',
          vin: typeof vin === 'string' ? vin : '',
          licensePlate: typeof licensePlate === 'string' ? licensePlate : '',
        },
      },
      customer: typeof resolvedCustomerId === 'string' && resolvedCustomerId.startsWith('cus_') ? resolvedCustomerId : undefined,
      customer_email: !resolvedCustomerId && typeof customerEmail === 'string' && customerEmail.includes('@') ? customerEmail : undefined,
      allow_promotion_codes: true,
    });

    console.log('[stripe] create-checkout-session created', { sessionId: session.id, url: session.url });
    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('[stripe] create-checkout-session error', error);
    return res.status(500).json({ error: error.message || 'Failed to create session' });
  }
}



