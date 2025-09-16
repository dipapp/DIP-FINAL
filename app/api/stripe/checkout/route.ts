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

if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID || !process.env.NEXT_PUBLIC_APP_URL) {
  console.error('Missing Stripe environment variables:', {
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_PRICE_ID: !!process.env.STRIPE_PRICE_ID,
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL
  });
  throw new Error('Missing Stripe environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
  try {
    console.log('Stripe checkout request received');
    
    const { vehicleId, userId } = await request.json();
    console.log('Request data:', { vehicleId, userId });

    if (!vehicleId || !userId) {
      console.log('Missing vehicleId or userId');
      return NextResponse.json(
        { error: 'Vehicle ID and User ID are required' },
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

    console.log('Creating Stripe checkout session...');
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/vehicles?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/vehicles?canceled=true`,
      metadata: {
        vehicleId: vehicleId,
        userId: userId,
      },
      customer_email: decodedToken.email || undefined,
    });

    console.log('Stripe session created:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}