import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY_B64) {
      console.error('Missing Firebase Admin environment variables:', {
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY_B64: !!process.env.FIREBASE_PRIVATE_KEY_B64
      });
    } else {
      const privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf-8');
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log('Firebase Admin initialized successfully in webhook');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    console.log('✅ Webhook received:', event.type);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('💰 Payment succeeded:', paymentIntent.id);
      
      const metadata = paymentIntent.metadata;
      
      // NEW FLOW: PaymentIntent was created for subscription first payment
      if (metadata.type === 'subscription_first_payment') {
        console.log('🔗 Payment is for subscription first payment');
        
        const priceId = metadata.priceId || process.env.STRIPE_PRICE_ID;
        console.log('🔍 Using Price ID:', priceId);
        
        if (!priceId) {
          console.error('❌ No Price ID found in metadata or environment');
          return NextResponse.json({ error: 'No Price ID configured' }, { status: 500 });
        }
        
        try {
          // Step 1: Cancel any incomplete subscription if one was created
          if (metadata.subscription_id) {
            try {
              await stripe.subscriptions.cancel(metadata.subscription_id);
              console.log('✅ Cancelled incomplete subscription:', metadata.subscription_id);
            } catch (cancelErr: any) {
              console.log('⚠️ Could not cancel subscription (may already be cancelled):', cancelErr.message);
            }
          }
          
          // Step 2: Attach the payment method to the customer
          if (paymentIntent.payment_method) {
            try {
              await stripe.paymentMethods.attach(paymentIntent.payment_method, {
                customer: paymentIntent.customer,
              });
              console.log('✅ Payment method attached to customer');
            } catch (attachErr: any) {
              // Payment method might already be attached
              console.log('⚠️ Payment method attach:', attachErr.message);
            }
            
            // Set as default payment method for customer
            await stripe.customers.update(paymentIntent.customer, {
              invoice_settings: {
                default_payment_method: paymentIntent.payment_method,
              },
            });
            console.log('✅ Payment method set as default for customer');
          }
          
          // Step 3: Create a NEW active subscription with a trial period
          // The trial ends in ~30 days, so the first real charge happens next month
          // (we already collected the first month's payment via the PaymentIntent)
          const trialEnd = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
          
          const newSubscription = await stripe.subscriptions.create({
            customer: paymentIntent.customer,
            items: [{ price: priceId }],
            default_payment_method: paymentIntent.payment_method,
            trial_end: trialEnd,
            metadata: {
              userId: metadata.userId,
              vehicleId: metadata.vehicleId,
              platform: metadata.platform,
              original_payment_intent: paymentIntent.id,
            },
          });
          
          console.log('✅ Created active subscription:', newSubscription.id);
          console.log('✅ Subscription status:', newSubscription.status);
          console.log('✅ Trial ends:', new Date(trialEnd * 1000).toISOString());
          
          // Step 4: Update the vehicle document in Firestore with the subscriptionId
          if (metadata.vehicleId && getApps().length > 0) {
            try {
              const db = getFirestore();
              await db.collection('vehicles').doc(metadata.vehicleId).update({
                subscriptionId: newSubscription.id,
                subscriptionStatus: newSubscription.status,
                subscriptionCreatedAt: new Date().toISOString(),
              });
              console.log('✅ Updated vehicle in Firestore:', metadata.vehicleId);
              console.log('✅ Set subscriptionId:', newSubscription.id);
            } catch (firestoreErr: any) {
              console.error('❌ Error updating Firestore:', firestoreErr.message);
              // Don't fail the webhook if Firestore update fails
              // The subscription was still created successfully
            }
          } else {
            console.log('⚠️ No vehicleId in metadata or Firebase not initialized, skipping Firestore update');
          }
          
          console.log('✅ Subscription created successfully!');
          
        } catch (err: any) {
          console.error('❌ Error in subscription flow:', err.message);
        }
      }
      // LEGACY FLOW: Old PaymentIntent that needs a subscription created (for backward compatibility)
      else if (metadata.subscriptionPrice && !metadata.subscription_id) {
        console.log('⚠️ Legacy flow: Creating subscription from payment');
        
        const subscription = await stripe.subscriptions.create({
          customer: paymentIntent.customer,
          items: [{ price: metadata.subscriptionPrice }],
          default_payment_method: paymentIntent.payment_method,
          metadata: {
            userId: metadata.userId,
            vehicleId: metadata.vehicleId,
            platform: metadata.platform,
            paymentIntentId: paymentIntent.id,
          },
        });
        
        console.log('✅ Subscription created:', subscription.id);
        
        // Also update Firestore for legacy flow
        if (metadata.vehicleId && getApps().length > 0) {
          try {
            const db = getFirestore();
            await db.collection('vehicles').doc(metadata.vehicleId).update({
              subscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              subscriptionCreatedAt: new Date().toISOString(),
            });
            console.log('✅ Updated vehicle in Firestore (legacy):', metadata.vehicleId);
          } catch (firestoreErr: any) {
            console.error('❌ Error updating Firestore (legacy):', firestoreErr.message);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
