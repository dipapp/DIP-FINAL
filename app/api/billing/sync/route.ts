export const runtime = 'nodejs';

import { PRICE_ID, stripe } from '@/app/lib/stripe';
import admin from 'firebase-admin';

function initAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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

    // Deprecated legacy route in per-vehicle model; no-op for safety
    return new Response(JSON.stringify({ ok: true, note: 'billing sync disabled in per-vehicle model' }), { status: 200 });
  } catch (error: any) {
    console.error('[billing-sync] error', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal Server Error' }), { status: 500 });
  }
}


