import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
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
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n'),
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
    console.error('Stripe env vars missing');
    return res.status(500).send('Stripe env vars missing');
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
  const raw = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, signingSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = initAdmin();
  
  try {
    console.log('WEBHOOK_RECEIVED', { type: event.type, eventId: event.id });
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const vehicleId = (session.metadata?.vehicleId as string) || undefined;
        const uid = (session.metadata?.uid as string) || (session.metadata?.userId as string) || undefined;
        const subscriptionId = session.subscription as string | undefined;
        const customerId = (session.customer as string) || undefined;

        if (vehicleId && uid) {
          let targetVehicleId = vehicleId;
          if (subscriptionId) {
            // Reverse index write (create only; do not overwrite conflicts)
            const idxRef = db.collection('users').doc(uid).collection('subscriptions').doc(subscriptionId);
            const idxSnap = await idxRef.get();
            if (idxSnap.exists) {
              const existingVehicleId = (idxSnap.data() as any)?.vehicleId;
              if (existingVehicleId && existingVehicleId !== vehicleId) {
                console.warn('WEBHOOK_INDEX_CONFLICT', { subId: subscriptionId, existingVehicleId, newVehicleId: vehicleId });
                targetVehicleId = existingVehicleId;
              }
            } else {
              await idxRef.set({ vehicleId, createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            }
          }

          // Initialize pending subscription state (mirror to user subcollection and root)
          const subObj: any = {
            subscriptionId: subscriptionId || '',
            status: 'incomplete',
            priceId: undefined,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            currentPeriodStart: null,
            currentPeriodEnd: null,
          };

          await db.collection('users').doc(uid).collection('vehicles').doc(targetVehicleId).set(
            { subscription: subObj },
            { merge: true }
          );
          await db.collection('vehicles').doc(targetVehicleId).set(
            { subscription: subObj, lastUpdated: admin.firestore.FieldValue.serverTimestamp() },
            { merge: true }
          );

          console.log('WEBHOOK_WRITE_SUB', { uid, vehicleId: targetVehicleId, subId: subscriptionId, status: 'incomplete' });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const uid = (sub.metadata?.uid as string) || (sub.metadata?.userId as string) || undefined;
        let vehicleId = (sub.metadata?.vehicleId as string) || undefined;

        if (!vehicleId && uid) {
          const idxSnap = await db.collection('users').doc(uid).collection('subscriptions').doc(sub.id).get();
          vehicleId = (idxSnap.exists ? (idxSnap.data() as any)?.vehicleId : undefined) || undefined;
        }

        if (uid && sub.id) {
          // Reverse index guard
          const idxRef = db.collection('users').doc(uid).collection('subscriptions').doc(sub.id);
          const idxSnap = await idxRef.get();
          if (idxSnap.exists) {
            const existingVehicleId = (idxSnap.data() as any)?.vehicleId;
            if (vehicleId && existingVehicleId && existingVehicleId !== vehicleId) {
              console.warn('WEBHOOK_INDEX_CONFLICT', { subId: sub.id, existingVehicleId, newVehicleId: vehicleId });
              vehicleId = existingVehicleId; // honor existing mapping
            }
          } else if (vehicleId) {
            await idxRef.set({ vehicleId, createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
          }
        }

        if (uid && vehicleId) {
          const subObj: any = {
            subscriptionId: sub.id,
            status: sub.status,
            priceId: sub.items?.data?.[0]?.price?.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : null,
            currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
          };

          await db.collection('users').doc(uid).collection('vehicles').doc(vehicleId).set(
            { subscription: subObj },
            { merge: true }
          );
          await db.collection('vehicles').doc(vehicleId).set(
            { subscription: subObj, lastUpdated: admin.firestore.FieldValue.serverTimestamp() },
            { merge: true }
          );

          console.log('WEBHOOK_WRITE_SUB', { uid, vehicleId, subId: sub.id, status: sub.status });
        } else {
          console.warn('[stripe] subscription event without resolvable vehicleId/uid', { subId: sub.id, uid, vehicleId });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string | undefined;
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            const uid = (sub.metadata?.uid as string) || (sub.metadata?.userId as string) || undefined;
            let vehicleId = (sub.metadata?.vehicleId as string) || undefined;
            if (!vehicleId && uid) {
              const idxSnap = await db.collection('users').doc(uid).collection('subscriptions').doc(sub.id).get();
              vehicleId = (idxSnap.exists ? (idxSnap.data() as any)?.vehicleId : undefined) || undefined;
            }
            if (uid && vehicleId) {
              const subObj: any = {
                subscriptionId: sub.id,
                status: sub.status,
                priceId: sub.items?.data?.[0]?.price?.id,
                currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : null,
                currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
              };
              await db.collection('users').doc(uid).collection('vehicles').doc(vehicleId).set(
                { subscription: subObj },
                { merge: true }
              );
              await db.collection('vehicles').doc(vehicleId).set(
                { subscription: subObj, lastUpdated: admin.firestore.FieldValue.serverTimestamp() },
                { merge: true }
              );
              console.log('WEBHOOK_WRITE_SUB', { uid, vehicleId, subId: sub.id, status: sub.status });
            }
          } catch (e) {
            console.error('[stripe] invoice.payment_succeeded fetch sub failed', e);
          }
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

  return res.status(200).json({ received: true });
}


