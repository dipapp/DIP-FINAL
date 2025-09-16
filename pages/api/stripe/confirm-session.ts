import type { NextApiRequest, NextApiResponse } from 'next';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });
  }

  const { session_id } = req.query;
  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'session_id is required' });
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const subscriptionId = session.subscription as string | undefined;
    let status: string | undefined;
    let currentPeriodEnd: number | undefined;
    let customerId: string | undefined = (session.customer as string) || undefined;
    if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      status = sub.status;
      currentPeriodEnd = (sub as any)?.current_period_end as number | undefined;
      if (!customerId && typeof sub.customer === 'string') {
        customerId = sub.customer;
      }
    }

    // Attempt to link the vehicle and flip active state immediately (webhook may lag)
    try {
      const db = initAdmin();
      const vehicleId = (session.metadata?.vehicleId as string) || undefined;
      const userId = (session.metadata?.userId as string) || undefined;
      if (vehicleId) {
        await db.collection('vehicles').doc(vehicleId).set(
          {
            isActive: status === 'active' || status === 'trialing' ? true : undefined,
            stripe: {
              customerId: customerId || null,
              subscriptionId: subscriptionId || null,
              status: status || null,
              currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
              checkoutSessionId: session.id,
            },
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
      if (userId && customerId) {
        await db.collection('users').doc(userId).set(
          {
            stripe: {
              customerId,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (e) {
      console.error('[stripe] confirm-session vehicle/user update failed (non-fatal)', e);
    }

    return res.status(200).json({
      customerId: customerId || null,
      subscriptionId: subscriptionId || null,
      status: status || null,
      currentPeriodEnd: currentPeriodEnd || null,
    });
  } catch (error: any) {
    console.error('[stripe] confirm-session error', error);
    return res.status(500).json({ error: error.message || 'Failed to confirm session' });
  }
}








