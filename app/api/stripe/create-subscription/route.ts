import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY_B64) {
      console.error('Missing Firebase Admin environment variables:', {
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY_B64: !!process.env.FIREBASE_PRIVATE_KEY_B64
      });
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
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
  console.error('Missing Stripe environment variables:', {
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_PRICE_ID: !!process.env.STRIPE_PRICE_ID
  });
  throw new Error('Missing Stripe environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Stripe create subscription request received');
    
    const { vehicleId, userId, email, name } = await request.json();
    console.log('Request data:', { vehicleId, userId, email, name });

    if (!vehicleId || !userId || !email || !name) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Vehicle ID, User ID, email, and name are required' },
        { status: 400 }
      );
    }

    // Verify the user is authenticated
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('Verifying ID token...');
    
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
      console.log('Token verified for user:', decodedToken.uid);
      if (decodedToken.uid !== userId) {
        console.log('Token UID mismatch');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get vehicle details from Firestore
    console.log('Fetching vehicle from Firestore...');
    const db = getFirestore();
    const vehicleDoc = await db.collection('vehicles').doc(vehicleId).get();
    
    if (!vehicleDoc.exists) {
      console.log('Vehicle not found:', vehicleId);
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const vehicleData = vehicleDoc.data();
    if (!vehicleData || vehicleData.ownerId !== userId) {
      console.log('Vehicle ownership mismatch');
      return NextResponse.json(
        { error: 'Unauthorized - vehicle does not belong to user' },
        { status: 403 }
      );
    }

    console.log('Creating or finding Stripe customer...');
    
    // Find existing customer by email or create new one
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('Found existing Stripe customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          userId: userId,
          platform: 'iOS',
        },
      });
      console.log('Created new Stripe customer:', customer.id);
    }

    // Step 2: Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID! }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      metadata: { userId, vehicleId: vehicleId || '', platform: 'iOS' },
    });

    console.log('✅ Created subscription:', subscription.id);

    // Step 3: Retrieve with expand
    const expandedSub = await stripe.subscriptions.retrieve(subscription.id, {
      expand: ['latest_invoice.payment_intent'],
    });

    console.log('📦 Expanded sub type:', typeof expandedSub.latest_invoice);

    // Step 4: Careful extraction
    const latestInvoice = expandedSub.latest_invoice;

    if (typeof latestInvoice === 'string') {
      throw new Error('Invoice was not expanded, got string ID: ' + latestInvoice);
    }

    if (!latestInvoice) {
      throw new Error('No latest_invoice on subscription');
    }

    console.log('📦 Invoice type:', typeof (latestInvoice as any).payment_intent);

    const paymentIntent = (latestInvoice as any).payment_intent;

    if (typeof paymentIntent === 'string') {
      throw new Error('PaymentIntent was not expanded, got string ID: ' + paymentIntent);
    }

    if (!paymentIntent) {
      throw new Error('No payment_intent on invoice');
    }

    const clientSecret = paymentIntent.client_secret;

    if (!clientSecret) {
      throw new Error('No client_secret on payment intent');
    }

    console.log('✅ Got client secret');
    
    return NextResponse.json({
      clientSecret: clientSecret,
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
    });
  } catch (error) {
    console.error('Stripe subscription creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}