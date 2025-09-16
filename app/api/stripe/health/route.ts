import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    const priceId = process.env.STRIPE_PRICE_ID || '';

    if (!secretKey) {
      return NextResponse.json({ ok: false, error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
    }
    if (!priceId) {
      return NextResponse.json({ ok: false, error: 'Missing STRIPE_PRICE_ID' }, { status: 500 });
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
      return NextResponse.json({ ok: false, error: `Price lookup failed: ${e?.message || 'unknown'}` }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      hasSecret: !!secretKey,
      hasPriceId: !!priceId,
      priceOk,
      priceIdMasked: priceId.replace(/^(price_[^_]{4})[^:]{0,}/, '$1•••'),
      priceAmount,
      priceRecurring,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Internal error' }, { status: 500 });
  }
}
