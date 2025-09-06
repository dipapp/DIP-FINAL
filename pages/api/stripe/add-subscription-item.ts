import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

function initFirebase() {
  if (!getApps().length) {
    initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    });
  }
  return getFirestore();
}

// Adds a subscription item (one vehicle) to an existing subscription and invoices immediately
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!secretKey || !priceId) {
    return res.status(500).json({ error: 'Missing Stripe env vars' });
  }
  if (!priceId.startsWith('price_')) {
    return res.status(400).json({ error: 'STRIPE_PRICE_ID must start with "price_"' });
  }

  const { userId, vehicleId } = req.body || {};
  if (!userId || !vehicleId) {
    return res.status(400).json({ error: 'userId and vehicleId are required' });
  }

  try {
    const db = initFirebase();
    const userSnap = await getDoc(doc(db, 'users', String(userId)));
    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }
    const stripeInfo = (userSnap.data() as any).stripe || {};
    const customerId = stripeInfo.customerId as string | undefined;
    const subscriptionId = stripeInfo.subscriptionId as string | undefined;

    if (!customerId || !subscriptionId) {
      return res.status(409).json({ error: 'No existing subscription. Start Checkout to create the first one.' });
    }

    const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });

    // 1) Add a new item to the subscription for this vehicle
    const item = await stripe.subscriptionItems.create({
      subscription: subscriptionId,
      price: priceId,
      quantity: 1,
      metadata: { vehicleId: String(vehicleId) },
    });

    // 2) Create and pay an off-cycle invoice to charge immediately
    const invoice = await stripe.invoices.create({
      customer: customerId,
      subscription: subscriptionId,
      collection_method: 'charge_automatically',
      pending_invoice_items_behavior: 'include',
    });
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    if (finalized.status !== 'open' && finalized.status !== 'paid') {
      return res.status(500).json({ error: 'Failed to finalize invoice' });
    }
    const paid = await stripe.invoices.pay(finalized.id);

    return res.status(200).json({
      itemId: item.id,
      invoiceId: paid.id,
      paidStatus: paid.status,
    });
  } catch (error: any) {
    console.error('[stripe] add-subscription-item error', error);
    return res.status(500).json({ error: error.message || 'Failed to add subscription item' });
  }
}


