import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

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
  return getAdminFirestore();
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !signingSecret) {
    console.error('Stripe env vars missing');
    return NextResponse.json({ error: 'Stripe env vars missing' }, { status: 500 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
  const raw = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, signingSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const db = initAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[stripe] checkout.session.completed', {
          sessionId: session.id,
          vehicleId: session.metadata?.vehicleId,
          userId: session.metadata?.userId,
          subscriptionId: session.subscription,
          customer: session.customer,
        });

        const vehicleId = (session.metadata?.vehicleId as string) || undefined;
        const userId = (session.metadata?.userId as string) || undefined;
        const vin = (session.metadata?.vin as string) || undefined;
        const licensePlate = (session.metadata?.licensePlate as string) || undefined;
        const subscriptionId = session.subscription as string | undefined;
        const customerId = (session.customer as string) || undefined;

        if (vehicleId) {
          await db.collection('vehicles').doc(vehicleId).update({
            stripe: {
              customerId: customerId || null,
              subscriptionId: subscriptionId || null,
              checkoutSessionId: session.id,
            },
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Attach vehicle metadata to the first item if possible
        if (subscriptionId && vehicleId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const items = subscription.items.data;
            if (items.length > 0) {
              await stripe.subscriptionItems.update(items[0].id, {
                metadata: {
                  vehicleId,
                  userId: userId || '',
                  vin: vin || '',
                  licensePlate: licensePlate || '',
                },
              });
            }
          } catch (e) {
            console.error('Failed to attach vehicleId metadata to subscription item', e);
          }
        }

        // Update user with customer ID if we have both
        if (userId && customerId) {
          await db.collection('users').doc(userId).set(
            {
              stripe: {
                customerId,
              },
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }

        // Mark vehicle as active
        if (vehicleId) {
          await db.collection('vehicles').doc(vehicleId).update({
            isActive: true,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const vehicleId = (sub.metadata?.vehicleId as string) || undefined;
        const items = sub.items?.data || [];
        let matchedAny = false;
        for (const it of items) {
          const vId = (it.metadata?.vehicleId as string) || undefined;
          if (!vId) continue;
          matchedAny = true;
          console.log('[stripe] update vehicle from item', { vId, itemId: it.id, status: sub.status });
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
        if (!matchedAny && vehicleId) {
          console.log('[stripe] update vehicle from subscription-level metadata', { vehicleId, status: sub.status });
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
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
