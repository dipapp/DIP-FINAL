export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getStripe } from '@/app/lib/stripe';
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const uid = searchParams.get('uid');

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'session_id is required' }), { status: 400 });
    }
    if (!uid) {
      return new Response(JSON.stringify({ error: 'uid is required' }), { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const subscriptionId = (session.subscription as string) || null;
    const customerId = (session.customer as string) || null;

    console.log('[checkout-result] retrieved', { sessionId, uid, subscriptionId, customerId });

    const db = initAdmin();
    await db.collection('users').doc(uid).set(
      {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return new Response(
      JSON.stringify({ ok: true, subscriptionId, customerId }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[checkout-result] error', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal Server Error' }), { status: 500 });
  }
}





