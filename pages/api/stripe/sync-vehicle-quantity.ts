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

// Sync subscription item quantity to match active vehicle count
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!secretKey || !priceId) {
    return res.status(500).json({ error: 'Missing Stripe env vars' });
  }

  const { userId } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const db = initAdmin();
    const userRef = db.collection('users').doc(String(userId));
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userSnap.data() || {};
    const stripeInfo = userData.stripe || {};
    const subscriptionId: string | undefined = stripeInfo.subscriptionId;
    const customerId: string | undefined = stripeInfo.customerId;
    if (!subscriptionId || !customerId) {
      return res.status(409).json({ error: 'No existing subscription. Run initial Checkout first.' });
    }

    // Count active vehicles
    const vehiclesSnap = await db
      .collection('vehicles')
      .where('ownerId', '==', String(userId))
      .where('isActive', '==', true)
      .get();
    const activeCount = vehiclesSnap.size;

    const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] });

    // Find the item for our price, or create if missing
    let item = subscription.items.data.find((it) => it.price.id === priceId);
    if (!item) {
      item = await stripe.subscriptionItems.create({
        subscription: subscriptionId,
        price: priceId,
        quantity: activeCount,
      });
    } else {
      await stripe.subscriptionItems.update(item.id, { quantity: activeCount, proration_behavior: 'always_invoice' });
    }

    // Optionally create and pay invoice immediately when proration occurs
    const invoice = await stripe.invoices.create({ customer: customerId, subscription: subscriptionId });
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    const paid = await stripe.invoices.pay(finalized.id);

    return res.status(200).json({ activeCount, itemId: item.id, invoiceId: paid.id, status: paid.status });
  } catch (error: any) {
    console.error('[stripe] sync-vehicle-quantity error', error);
    return res.status(500).json({ error: error.message || 'Failed to sync quantity' });
  }
}



