export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import admin from 'firebase-admin';

function initAdmin() {
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
  return admin.firestore();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
    }
    if (!uid) {
      return NextResponse.json({ invoices: [] }, { status: 200 });
    }

    const db = initAdmin();
    const userSnap = await db.collection('users').doc(uid).get();
    const user = userSnap.exists ? (userSnap.data() as any) : {};
    let stripeCustomerId: string | undefined = user?.stripeCustomerId || user?.stripe?.customerId;

    const stripe = new Stripe(secretKey);

    // Fallback: resolve customer id by email if missing
    if (!stripeCustomerId) {
      const email: string | undefined = user?.email || user?.userEmail || user?.profile?.email;
      if (email) {
        try {
          const list = await stripe.customers.list({ email, limit: 1 });
          stripeCustomerId = list.data?.[0]?.id;
        } catch (e) {
          // ignore and continue
        }
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json({ invoices: [] }, { status: 200 });
    }

    const list = await stripe.invoices.list({ customer: stripeCustomerId, limit: 20, expand: ['data.charge'] });

    const invoices = list.data.map((inv) => ({
      id: inv.id,
      created: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      status: inv.status,
      amount_due: inv.amount_due,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      chargeId: typeof inv.charge === 'string' ? inv.charge : inv.charge?.id || null,
      subscription: typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id || null,
    }));

    return NextResponse.json({ invoices }, { status: 200 });
  } catch (e: any) {
    console.error('[billing.history] error', e);
    return NextResponse.json({ error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}


