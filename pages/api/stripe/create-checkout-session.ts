import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import admin from 'firebase-admin';

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

  const { vehicleId, userId, uid: rawUid, customerEmail, vin, licensePlate } = req.body || {};
  const uid = typeof rawUid === 'string' && rawUid ? rawUid : (typeof userId === 'string' ? userId : undefined);
  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'vehicleId is required' });
  }
  if (!uid) {
    return res.status(400).json({ error: 'uid is required' });
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });

    // Initialize Admin if needed
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n'),
        } as any),
      });
    }
    const db = admin.firestore();

    // Reuse or create Stripe customer for this uid
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? (userSnap.data() as any) : {};
    let stripeCustomerId: string | undefined = userData?.stripeCustomerId || userData?.stripe?.customerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ metadata: { firebaseUid: uid } });
      stripeCustomerId = customer.id;
      await userRef.set({ stripeCustomerId, stripe: { ...(userData?.stripe || {}), customerId: stripeCustomerId } }, { merge: true });
    }

    console.log('CHECKOUT_START', {
      uid,
      vehicleId,
      priceId,
      customer: stripeCustomerId,
    });

    // Always create a new subscription via Checkout Session for this specific vehicle

    const origin = (req.headers.origin as string) || `https://${req.headers.host}` || 'http://localhost:3000';

    // Ensure idempotency is unique per vehicle attempt
    const idemKey = `checkout_${uid}_${vehicleId}_${Date.now()}`;

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
        uid,
        userId: typeof userId === 'string' ? userId : '',
        vin: typeof vin === 'string' ? vin : '',
        licensePlate: typeof licensePlate === 'string' ? licensePlate : '',
      },
      subscription_data: {
        metadata: {
          vehicleId,
          uid,
          userId: typeof userId === 'string' ? userId : '',
          priceId,
          vin: typeof vin === 'string' ? vin : '',
          licensePlate: typeof licensePlate === 'string' ? licensePlate : '',
        },
      },
      customer: stripeCustomerId,
      customer_email: !stripeCustomerId && typeof customerEmail === 'string' && customerEmail.includes('@') ? customerEmail : undefined,
      allow_promotion_codes: true,
    }, { idempotencyKey: idemKey });

    console.log('CHECKOUT_CREATED', { sessionId: session.id, idempotencyKey: idemKey });
    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('[stripe] create-checkout-session error', error);
    return res.status(500).json({ error: error.message || 'Failed to create session' });
  }
}



