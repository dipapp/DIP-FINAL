import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

function initAdmin() {
  if (!admin.apps.length) {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
    const privateKey = process.env.FIREBASE_PRIVATE_KEY_B64
      ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf8')
      : rawKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      } as any),
    });
  }
  return getAdminFirestore();
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!secretKey) {
    return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
  }
  if (!priceId) {
    return NextResponse.json({ error: 'Missing STRIPE_PRICE_ID' }, { status: 500 });
  }
  if (!priceId.startsWith('price_')) {
    return NextResponse.json({ error: 'STRIPE_PRICE_ID must be a Price ID starting with "price_"' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { vehicleId, userId, customerEmail, customerId, vin, licensePlate } = body;

    if (!vehicleId || typeof vehicleId !== 'string') {
      return NextResponse.json({ error: 'vehicleId is required' }, { status: 400 });
    }

    const stripe = new Stripe(secretKey);
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
    const origin = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3000';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Webhook will confirm and flip isActive. Success page only shows pending UI.
      success_url: `${baseUrl}/dashboard/vehicles?vehicleId=${encodeURIComponent(vehicleId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/vehicles?cancelled=1`,
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
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[stripe] create-checkout-session error', error);
    return NextResponse.json({ error: error.message || 'Failed to create session' }, { status: 500 });
  }
}