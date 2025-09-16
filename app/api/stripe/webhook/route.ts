import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY_B64) {
    throw new Error('Missing Firebase Admin environment variables');
  }

  const privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf-8');

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing Stripe environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const db = getFirestore();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { vehicleId, userId } = session.metadata || {};

        if (vehicleId && userId) {
          // Activate the vehicle
          await db.collection('vehicles').doc(vehicleId).update({
            isActive: true,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
            activatedAt: new Date(),
            lastUpdated: new Date(),
          });

          console.log(`Vehicle ${vehicleId} activated for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const session = await stripe.checkout.sessions.list({
          subscription: subscription.id,
          limit: 1,
        });

        if (session.data.length > 0) {
          const { vehicleId } = session.data[0].metadata || {};
          if (vehicleId) {
            await db.collection('vehicles').doc(vehicleId).update({
              isActive: subscription.status === 'active',
              lastUpdated: new Date(),
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const session = await stripe.checkout.sessions.list({
          subscription: subscription.id,
          limit: 1,
        });

        if (session.data.length > 0) {
          const { vehicleId } = session.data[0].metadata || {};
          if (vehicleId) {
            await db.collection('vehicles').doc(vehicleId).update({
              isActive: false,
              lastUpdated: new Date(),
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
