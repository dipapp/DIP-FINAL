export const runtime = 'nodejs';

import { getPriceId, getStripe } from '@/app/lib/stripe';
import admin from 'firebase-admin';

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
  return admin.firestore();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const uid = body?.uid as string | undefined;
    if (!uid) {
      return new Response(JSON.stringify({ error: 'uid is required' }), { status: 400 });
    }

    const db = initAdmin();
    console.log('[billing-sync] start', { uid });

    // Count active vehicles for user
    // Primary: subcollection users/{uid}/vehicles
    let quantity = 0;
    try {
      const subcolSnap = await db
        .collection('users')
        .doc(uid)
        .collection('vehicles')
        .where('isActive', '==', true)
        .get();
      if (subcolSnap.size > 0) {
        quantity = subcolSnap.size;
      }
    } catch (e) {
      // ignore
    }
    // Fallback: top-level vehicles owned by user
    if (quantity === 0) {
      const fallbackSnap = await db
        .collection('vehicles')
        .where('ownerId', '==', uid)
        .where('isActive', '==', true)
        .get();
      quantity = fallbackSnap.size;
    }
    console.log('[billing-sync] quantity', { uid, quantity });

    // Read user document for Stripe IDs
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? (userSnap.data() as any) : {};
    const stripeCustomerId: string | undefined = userData?.stripeCustomerId || userData?.stripe?.customerId;
    const stripeSubscriptionId: string | undefined = userData?.stripeSubscriptionId || undefined;
    console.log('[billing-sync] ids', { uid, stripeCustomerId, stripeSubscriptionId });

    const stripe = getStripe();
    const PRICE_ID = getPriceId();

    if (quantity === 0) {
      if (stripeSubscriptionId) {
        try {
          await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true });
          console.log('[billing-sync] set cancel_at_period_end', { uid, stripeSubscriptionId });
        } catch (e) {
          console.error('[billing-sync] failed to set cancel_at_period_end', e);
        }
      }
      await userRef.set({ subscriptionStatus: 'cancel_at_period_end' }, { merge: true });
      return new Response(JSON.stringify({ ok: true, quantity: 0 }), { status: 200 });
    }

    // Ensure customer exists
    // ensure stripe and PRICE_ID already declared above
    let customerId = stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { firebaseUid: uid } });
      customerId = customer.id;
      await userRef.set({ stripeCustomerId: customerId }, { merge: true });
      console.log('[billing-sync] created customer', { uid, customerId });
    }

    // If no subscription, create Checkout Session to start one
    if (!stripeSubscriptionId) {
      const origin = process.env.NEXT_PUBLIC_APP_URL;
      if (!origin) {
        console.error('[billing-sync] missing NEXT_PUBLIC_APP_URL');
        return new Response(JSON.stringify({ error: 'Server misconfigured: NEXT_PUBLIC_APP_URL missing' }), { status: 500 });
      }
      const successUrl = `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}&uid=${encodeURIComponent(uid)}`;
      const cancelUrl = `${origin}/billing/cancel`;
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [
          { price: PRICE_ID, quantity },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          metadata: { firebaseUid: uid },
        },
      });
      console.log('[billing-sync] create checkout', { uid, sessionId: session.id, customerId, quantity });
      return new Response(JSON.stringify({ checkoutUrl: session.url }), { status: 200 });
    }

    // Otherwise, update subscription item quantity with proration
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId, { expand: ['items.data.price'] });
    const items = sub.items?.data || [];
    let targetItem = items.find((it) => (typeof it.price === 'object' ? it.price.id === PRICE_ID : false));
    if (!targetItem) {
      targetItem = items.length === 1 ? items[0] : undefined as any;
    }
    if (!targetItem) {
      console.error('[billing-sync] no subscription item found to update', { uid, stripeSubscriptionId });
      return new Response(JSON.stringify({ error: 'No subscription item found to update' }), { status: 500 });
    }

    const updated = await stripe.subscriptionItems.update(targetItem.id, {
      quantity,
      proration_behavior: 'create_prorations',
    });
    console.log('[billing-sync] updated item', { uid, stripeSubscriptionId, itemId: targetItem.id, quantity });
    return new Response(JSON.stringify({ ok: true, quantity }), { status: 200 });
  } catch (error: any) {
    console.error('[billing-sync] error', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal Server Error' }), { status: 500 });
  }
}


