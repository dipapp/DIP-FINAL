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
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } as any),
    });
  }
  return getAdminFirestore();
}

// Deprecated: Single-quantity subscription model removed. This endpoint is disabled.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({ error: 'Deprecated endpoint. Per-vehicle subscriptions do not use quantity sync.' });
}



