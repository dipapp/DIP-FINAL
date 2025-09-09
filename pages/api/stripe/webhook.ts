import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !signingSecret) {
    console.error('[webhook] Missing Stripe env vars');
    return res.status(500).send('Stripe env vars missing');
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });

  let event: Stripe.Event;
  try {
    const rawBody = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;
    event = stripe.webhooks.constructEvent(rawBody, sig, signingSecret);
  } catch (err: any) {
    console.error('[webhook] signature error:', err?.message);
    return res.status(400).send(`Webhook Error: ${err?.message ?? 'bad signature'}`);
  }

  try {
    // Minimal confirmation + logging; core billing logic does not depend on webhooks
    console.log('[webhook] received', { type: event.type, id: event.id });
    return res.status(200).json({ received: true });
  } catch (e) {
    console.error('[webhook] handler error', e);
    return res.status(500).send('Webhook handler failed');
  }
}


