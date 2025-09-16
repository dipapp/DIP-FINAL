import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    const priceId = process.env.STRIPE_PRICE_ID || '';

    if (!secretKey) {
      return res.status(500).json({ ok: false, error: 'Missing STRIPE_SECRET_KEY' });
    }
    if (!priceId) {
      return res.status(500).json({ ok: false, error: 'Missing STRIPE_PRICE_ID' });
    }

    const stripe = new Stripe(secretKey);

    let priceOk = false;
    let priceAmount: number | null = null;
    let priceRecurring: string | null = null;
    try {
      const price = await stripe.prices.retrieve(priceId);
      priceOk = !!price && !price.deleted;
      priceAmount = typeof price.unit_amount === 'number' ? price.unit_amount : null;
      priceRecurring = (price.recurring?.interval as string) || null;
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: `Price lookup failed: ${e?.message || 'unknown'}` });
    }

    return res.status(200).json({
      ok: true,
      hasSecret: !!secretKey,
      hasPriceId: !!priceId,
      priceOk,
      priceIdMasked: priceId.replace(/^(price_[^_]{4})[^:]{0,}/, '$1•••'),
      priceAmount,
      priceRecurring,
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error?.message || 'Internal error' });
  }
}



