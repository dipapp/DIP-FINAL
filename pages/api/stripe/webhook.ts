import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !signingSecret) {
    return res.status(500).send('Stripe env vars missing');
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, signingSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = initFirebase();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const vehicleId = (session.metadata?.vehicleId as string) || undefined;
        const userId = (session.metadata?.userId as string) || undefined;
        const subscriptionId = session.subscription as string | undefined;
        const customerId = (session.customer as string) || undefined;
        if (vehicleId) {
          await updateDoc(doc(db, 'vehicles', vehicleId), {
            isActive: true,
            stripe: {
              customerId: customerId || null,
              subscriptionId: subscriptionId || null,
              checkoutSessionId: session.id,
            },
            lastUpdated: serverTimestamp(),
          });
        }
        if (userId && (customerId || subscriptionId)) {
          const userRef = doc(db, 'users', userId);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            await updateDoc(userRef, {
              stripe: {
                ...(snap.data().stripe || {}),
                customerId: customerId || (snap.data().stripe?.customerId ?? null),
                subscriptionId: subscriptionId || (snap.data().stripe?.subscriptionId ?? null),
              },
              updatedAt: new Date(),
            });
          } else {
            await setDoc(userRef, {
              stripe: { customerId, subscriptionId },
              createdAt: new Date(),
              updatedAt: new Date(),
            }, { merge: true });
          }
        }
        break;
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const vehicleId = (sub.metadata?.vehicleId as string) || undefined;
        // Multi-item model: iterate items and update vehicles based on metadata.vehicleId
        const items = sub.items?.data || [];
        for (const it of items) {
          const vId = (it.metadata?.vehicleId as string) || undefined;
          if (!vId) continue;
          await updateDoc(doc(db, 'vehicles', vId), {
            isActive: sub.status === 'active' || sub.status === 'trialing',
            stripe: {
              customerId: sub.customer as string,
              subscriptionId: sub.id,
              subscriptionItemId: it.id,
              status: sub.status,
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            },
            lastUpdated: serverTimestamp(),
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error('Error handling webhook', e);
    return res.status(500).send('Webhook handler failed');
  }

  res.status(200).json({ received: true });
}


