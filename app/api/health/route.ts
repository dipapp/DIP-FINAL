export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import admin from 'firebase-admin';

function getStripeSafe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    return new Stripe(key);
  } catch {
    return null;
  }
}

function initAdminSafe(): admin.app.App | null {
  try {
    if (!admin.apps.length) {
      const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
      const privateKey = process.env.FIREBASE_PRIVATE_KEY_B64
        ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf8')
        : rawKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        } as any),
      });
    }
    return admin.app();
  } catch {
    return null;
  }
}

export async function GET() {
  const stripe = getStripeSafe();
  let stripeOk = false;
  let priceOk = false;
  let priceAmount: number | null = null;
  let priceRecurring: string | null = null;

  try {
    if (stripe) {
      const priceId = process.env.STRIPE_PRICE_ID;
      if (priceId && priceId.startsWith('price_')) {
        const price = await stripe.prices.retrieve(priceId);
        priceOk = !!price && !!price.active;
        priceAmount = price.unit_amount ?? null;
        priceRecurring = price.recurring?.interval ?? null;
      }
      stripeOk = true;
    }
  } catch {
    // leave stripeOk/priceOk as computed
  }

  const app = initAdminSafe();
  let firebaseOk = false;
  let firebaseError: string | null = null;
  try {
    if (app) {
      await admin.firestore().listCollections();
      firebaseOk = true;
    }
  } catch (e: any) {
    firebaseOk = false;
    firebaseError = e?.message || String(e);
  }

  const ok = stripeOk && firebaseOk && priceOk;
  return NextResponse.json(
    {
      ok,
      stripeOk,
      firebaseOk,
      firebaseError,
      priceOk,
      priceIdMasked: process.env.STRIPE_PRICE_ID ? process.env.STRIPE_PRICE_ID.replace(/^(price_.{3}).+$/, '$1•••') : null,
      priceAmount,
      priceRecurring,
    },
    { status: ok ? 200 : 500 }
  );
}

