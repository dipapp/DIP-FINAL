import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

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
    const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const subscriptionId = session.subscription as string | undefined;
    let status: string | undefined;
    let currentPeriodEnd: number | undefined;
    if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      status = sub.status;
      currentPeriodEnd = sub.current_period_end;
    }

    return res.status(200).json({
      customerId: (session.customer as string) || null,
      subscriptionId: subscriptionId || null,
      status: status || null,
      currentPeriodEnd: currentPeriodEnd || null,
    });
  } catch (error: any) {
    console.error('[stripe] confirm-session error', error);
    return res.status(500).json({ error: error.message || 'Failed to confirm session' });
  }
}








