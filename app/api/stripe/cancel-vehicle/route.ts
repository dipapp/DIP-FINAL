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

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
  }

  const body = await req.json();
  const { vehicleId } = body || {};
  if (!vehicleId || typeof vehicleId !== 'string') {
    return NextResponse.json({ error: 'vehicleId is required' }, { status: 400 });
  }

  try {
    const stripe = new Stripe(secretKey);
    const db = initAdmin();

    // Get vehicle data to find subscription
    const vehicleRef = db.collection('vehicles').doc(vehicleId);
    const vehicleSnap = await vehicleRef.get();
    if (!vehicleSnap.exists) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const vehicleData = vehicleSnap.data() as any;
    const subscriptionId = vehicleData?.stripe?.subscriptionId;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'No active subscription found for this vehicle' }, { status: 400 });
    }

    // Cancel the subscription
    await stripe.subscriptions.cancel(subscriptionId);

    // Update vehicle status
    await vehicleRef.update({
      isActive: false,
      stripe: {
        ...vehicleData.stripe,
        status: 'canceled',
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, cancelled: true });
  } catch (error: any) {
    console.error('[stripe] cancel-vehicle error', error);
    return NextResponse.json({ error: error?.message || 'Failed to cancel membership' }, { status: 500 });
  }
}
