import Stripe from 'stripe';

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('[stripe] Missing STRIPE_SECRET_KEY. Set it in your environment.');
  }
  return new Stripe(secretKey);
}

export function getPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error('[stripe] Missing STRIPE_PRICE_ID. Set it to the $20/month Price ID.');
  }
  if (!priceId.startsWith('price_')) {
    throw new Error('[stripe] STRIPE_PRICE_ID must be a valid Stripe Price ID starting with "price_".');
  }
  return priceId;
}







