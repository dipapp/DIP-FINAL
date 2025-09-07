import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { initializeApp as initClientApp, getApps as getClientApps } from 'firebase/app';
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

export const config = {
  api: {
    bodyParser: false,
  },
};

function initAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } as any),
    });
  }
  return getAdminFirestore();
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

  const db = initAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const vehicleId = (session.metadata?.vehicleId as string) || undefined;
        const userId = (session.metadata?.userId as string) || undefined;
        const vin = (session.metadata?.vin as string) || undefined;
        const licensePlate = (session.metadata?.licensePlate as string) || undefined;
        const subscriptionId = session.subscription as string | undefined;
        const customerId = (session.customer as string) || undefined;
        if (vehicleId) {
          await db.collection('vehicles').doc(vehicleId).update({
            // Do not mark active here; wait for subscription.created/updated after payment
            stripe: {
              customerId: customerId || null,
              subscriptionId: subscriptionId || null,
              checkoutSessionId: session.id,
            },
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        // Ensure the initial subscription item created by Checkout is tagged with vehicleId
        // so future subscription.updated/deleted events can map back to the vehicle.
        try {
          if (subscriptionId && vehicleId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items'] });
            const firstItem = sub.items?.data?.[0];
            if (firstItem) {
              const currentMeta = firstItem.metadata || {} as any;
              await stripe.subscriptionItems.update(firstItem.id, {
                metadata: {
                  ...currentMeta,
                  vehicleId: vehicleId as string,
                  vin: typeof vin === 'string' ? vin : (currentMeta.vin || ''),
                  licensePlate: typeof licensePlate === 'string' ? licensePlate : (currentMeta.licensePlate || ''),
                },
              });
            }
          }
        } catch (e) {
          console.error('Failed to attach vehicleId metadata to subscription item', e);
        }
        // Only store customerId on the user. Do not store a single subscriptionId at user level.
        if (userId && customerId) {
          const userRef = db.collection('users').doc(userId);
          const snap = await userRef.get();
          if (snap.exists) {
            const existing = snap.data() || {};
            await userRef.set({
              stripe: {
                ...(existing.stripe || {}),
                customerId: customerId || existing.stripe?.customerId || null,
              },
              updatedAt: new Date(),
            }, { merge: true });
          } else {
            await userRef.set({
              stripe: { customerId: customerId || null },
              createdAt: new Date(),
              updatedAt: new Date(),
            }, { merge: true });
          }
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const vehicleId = (sub.metadata?.vehicleId as string) || undefined;
        // Multi-item model: iterate items and update vehicles based on metadata.vehicleId
        const items = sub.items?.data || [];
        let matchedAny = false;
        for (const it of items) {
          const vId = (it.metadata?.vehicleId as string) || undefined;
          if (!vId) continue;
          matchedAny = true;
          await db.collection('vehicles').doc(vId).update({
            isActive: sub.status === 'active' || sub.status === 'trialing',
            stripe: {
              customerId: sub.customer as string,
              subscriptionId: sub.id,
              subscriptionItemId: it.id,
              status: sub.status,
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            },
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        // Fallback: if no items carried vehicle metadata (e.g., initial Checkout-created item),
        // use the subscription-level metadata to update that single vehicle.
        if (!matchedAny && vehicleId) {
          await db.collection('vehicles').doc(vehicleId).update({
            isActive: sub.status === 'active' || sub.status === 'trialing',
            stripe: {
              customerId: sub.customer as string,
              subscriptionId: sub.id,
              status: sub.status,
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            },
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
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


