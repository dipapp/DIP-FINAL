import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Create per-vehicle subscription checkout session (webhook-first flow)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!secretKey) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });
  }
  if (!priceId) {
    return res.status(500).json({ error: 'Missing STRIPE_PRICE_ID' });
  }
  if (!priceId.startsWith('price_')) {
    return res.status(400).json({ error: 'STRIPE_PRICE_ID must be a Price ID starting with "price_"' });
  }

  const { vehicleId, userId, customerEmail, customerId } = req.body || {};
  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'vehicleId is required' });
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });

    // Guard: if customer already has an active/incomplete subscription, add an item instead of creating a new subscription
    let effectiveCustomerId = typeof customerId === 'string' && customerId.startsWith('cus_') ? customerId : undefined;
    // If we don't have customerId in the request, attempt to infer via Checkout email usage (best-effort) - skip if unknown
    if (effectiveCustomerId) {
      const existing = await stripe.subscriptions.list({ customer: effectiveCustomerId, status: 'all', limit: 5 });
      const current = existing.data.find((s) => s.status !== 'canceled' && s.status !== 'unpaid' && s.status !== 'incomplete_expired');
      if (current) {
        // Add a new subscription item for this vehicle
        const item = await stripe.subscriptionItems.create({
          subscription: current.id,
          price: priceId,
          quantity: 1,
          metadata: { vehicleId },
        });
        // Invoice immediately so user sees the charge now
        const invoice = await stripe.invoices.create({ customer: current.customer as string, subscription: current.id, collection_method: 'charge_automatically', pending_invoice_items_behavior: 'include' });
        const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
        await stripe.invoices.pay(finalized.id);
        return res.status(200).json({ addedItemId: item.id, subscriptionId: current.id });
      }
    }

    const origin = (req.headers.origin as string) || `https://${req.headers.host}` || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Webhook will confirm and flip isActive. Success page only shows pending UI.
      success_url: `${origin}/dashboard/vehicles?vehicleId=${encodeURIComponent(vehicleId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/vehicles?cancelled=1`,
      metadata: {
        vehicleId,
        userId: typeof userId === 'string' ? userId : '',
      },
      subscription_data: {
        metadata: {
          vehicleId,
          userId: typeof userId === 'string' ? userId : '',
        },
      },
      customer: typeof customerId === 'string' && customerId.startsWith('cus_') ? customerId : undefined,
      customer_email: !customerId && typeof customerEmail === 'string' && customerEmail.includes('@') ? customerEmail : undefined,
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('[stripe] create-checkout-session error', error);
    return res.status(500).json({ error: error.message || 'Failed to create session' });
  }
}



