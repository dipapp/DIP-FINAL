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
  try {
    const body = await request.json();
    const { vehicleId } = body;

    if (!vehicleId || typeof vehicleId !== 'string') {
      return NextResponse.json({ error: 'vehicleId is required' }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
    }

    const db = initAdmin();
    const stripe = new Stripe(secretKey);

    const vehicleRef = db.collection('vehicles').doc(vehicleId);
    const vehicleSnap = await vehicleRef.get();
    if (!vehicleSnap.exists) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const v = vehicleSnap.data() as any;
    let subscriptionId: string | undefined = v?.stripe?.subscriptionId;
    if (!subscriptionId) {
      const customerId: string | undefined = v?.stripe?.customerId;
      if (customerId) {
        try {
          const list = await stripe.subscriptions.list({ customer: customerId, limit: 10, expand: ['data.items'] });
          const byVehicle = list.data.find((s) => {
            const items = (s.items?.data || []) as any[];
            return items.some((it) => (it.metadata?.vehicleId as string | undefined) === vehicleId);
          });
          subscriptionId = byVehicle?.id || list.data.find((s) => s.status !== 'canceled')?.id;
        } catch {}
      }
    }
    if (!subscriptionId) {
      // Nothing to cancel; mark inactive just in case
      await vehicleRef.set({ isActive: false, lastUpdated: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return NextResponse.json({ ok: true, cancelled: false });
    }

    // Try to load the current subscription; if not found, attempt fallback lookup by customer/metadata
    let existingSub: Stripe.Subscription | null = null;
    try {
      existingSub = await stripe.subscriptions.retrieve(subscriptionId);
    } catch (e) {
      existingSub = null;
    }
    if (!existingSub) {
      const customerId: string | undefined = v?.stripe?.customerId;
      if (customerId) {
        try {
          const list = await stripe.subscriptions.list({ customer: customerId, limit: 10, expand: ['data.items'] });
          const byVehicle = list.data.find((s) => {
            const items = (s.items?.data || []) as any[];
            return items.some((it) => (it.metadata?.vehicleId as string | undefined) === vehicleId);
          });
          existingSub = byVehicle || list.data.find((s) => s.status !== 'canceled') || null;
          subscriptionId = existingSub?.id || subscriptionId;
        } catch {}
      }
    }
    if (existingSub && existingSub.status === 'canceled') {
      await vehicleRef.set({
        isActive: false,
        stripe: { ...(v?.stripe || {}), subscriptionId, status: 'canceled' },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      return NextResponse.json({ ok: true, cancelled: true });
    }

    // Cancel immediately; if that fails, fall back to cancel_at_period_end=true
    let cancelled: Stripe.Subscription | null = null;
    try {
      cancelled = await stripe.subscriptions.cancel(subscriptionId, { invoice_now: false, prorate: false });
    } catch (e: any) {
      // Try a softer cancel
      try {
        const updated = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
        cancelled = updated as any;
      } catch (e2) {
        // Final fallback: cancel any active subs for the customer
        try {
          const customerId: string | undefined = v?.stripe?.customerId;
          if (customerId) {
            const list = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
            for (const s of list.data) {
              if (s.status !== 'canceled') {
                try {
                  await stripe.subscriptions.cancel(s.id, { invoice_now: false, prorate: false });
                } catch {
                  try { await stripe.subscriptions.update(s.id, { cancel_at_period_end: true }); } catch {}
                }
              }
            }
          }
        } catch {}
        throw e; // surface original error for response/logging
      }
    }

    const periodEndUnix = (cancelled as any)?.current_period_end as number | undefined;
    await vehicleRef.set({
      isActive: false,
      stripe: {
        ...(v?.stripe || {}),
        subscriptionId,
        status: cancelled?.status || 'canceled',
        currentPeriodEnd: periodEndUnix ? new Date(periodEndUnix * 1000) : null,
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ ok: true, cancelled: true });
  } catch (error: any) {
    console.error('[stripe] cancel-vehicle error', error);
    return NextResponse.json({ error: error?.message || 'Failed to cancel membership' }, { status: 500 });
  }
}