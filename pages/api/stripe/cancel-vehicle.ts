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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vehicleId } = req.body || {};
  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'vehicleId is required' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });
  }

  try {
    const db = initAdmin();
    const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });

    const vehicleRef = db.collection('vehicles').doc(vehicleId);
    const vehicleSnap = await vehicleRef.get();
    if (!vehicleSnap.exists) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const v = vehicleSnap.data() as any;
    const subscriptionId: string | undefined = v?.stripe?.subscriptionId;
    if (!subscriptionId) {
      // Nothing to cancel; mark inactive just in case
      await vehicleRef.set({ isActive: false, lastUpdated: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return res.status(200).json({ ok: true, cancelled: false });
    }

    // Cancel immediately
    await stripe.subscriptions.cancel(subscriptionId);
    await vehicleRef.set({ isActive: false, lastUpdated: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    return res.status(200).json({ ok: true, cancelled: true });
  } catch (error: any) {
    console.error('[stripe] cancel-vehicle error', error);
    return res.status(500).json({ error: error?.message || 'Failed to cancel membership' });
  }
}


