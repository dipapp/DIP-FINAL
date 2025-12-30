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

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing Stripe environment variables:', {
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY
  });
  throw new Error('Missing Stripe environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Canceling Stripe subscription request received');
    
    const { subscriptionId, userId } = await request.json();
    console.log('Request data:', { subscriptionId, userId });

    if (!subscriptionId || !userId) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'subscriptionId and userId are required' },
        { status: 400 }
      );
    }

    // Verify the user is authenticated
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header');
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
        console.log('❌ Token UID mismatch');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('❌ Token verification error:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Verify subscription exists and belongs to user
    console.log('Fetching subscription from Stripe...');
    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error: any) {
      console.error('❌ Subscription retrieval error:', error);
      if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
        return NextResponse.json(
          { error: 'Subscription not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Verify subscription metadata matches userId
    if (subscription.metadata?.userId !== userId) {
      console.log('❌ Subscription ownership mismatch');
      return NextResponse.json(
        { error: 'Unauthorized - subscription does not belong to user' },
        { status: 403 }
      );
    }

    // Check if already canceled
    if (subscription.cancel_at_period_end) {
      console.log('Subscription already scheduled for cancellation');
      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end,
        message: 'Subscription is already scheduled for cancellation at period end',
      });
    }

    console.log('Updating subscription to cancel at period end...');
    
    // Cancel subscription at period end
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    console.log('✅ Subscription scheduled for cancellation:', updatedSubscription.id);

    return NextResponse.json({
      success: true,
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status,
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      currentPeriodEnd: updatedSubscription.current_period_end,
      message: 'Subscription will be canceled at the end of the current billing period',
    });
  } catch (error) {
    console.error('❌ Stripe subscription cancellation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

