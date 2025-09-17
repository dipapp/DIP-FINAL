import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

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
  apiVersion: '2025-08-27.basil',
});

export async function GET(request: NextRequest) {
  try {
    console.log('Stripe invoices request received');
    
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    
    console.log('Request data:', { vehicleId });

    if (!vehicleId) {
      console.log('Missing vehicleId');
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
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
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Get vehicle data to find Stripe customer ID
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

    const stripeCustomerId = vehicleData.stripeCustomerId;
    if (!stripeCustomerId) {
      console.log('No Stripe customer ID found for vehicle:', vehicleId);
      return NextResponse.json(
        { error: 'No Stripe customer found for this vehicle' },
        { status: 404 }
      );
    }

    console.log('Fetching Stripe invoices...');
    
    try {
      // Fetch invoices from Stripe
      const invoices = await stripe.invoices.list({
        customer: stripeCustomerId,
        limit: 20, // Get last 20 invoices
        expand: ['data.subscription', 'data.payment_intent']
      });

      // Format the invoices for the frontend
      const formattedInvoices = invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount_paid: invoice.amount_paid,
        amount_due: invoice.amount_due,
        total: invoice.total,
        currency: invoice.currency,
        created: invoice.created,
        due_date: invoice.due_date,
        paid_at: invoice.status_transitions?.paid_at,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
        description: invoice.description || 'DIP Membership',
        period_start: invoice.period_start,
        period_end: invoice.period_end,
        subscription: invoice.subscription ? {
          id: typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription as any)?.id || null,
          status: typeof invoice.subscription === 'string' ? null : (invoice.subscription as any)?.status || null
        } : null
      }));

      console.log(`Found ${formattedInvoices.length} invoices for customer ${stripeCustomerId}`);
      return NextResponse.json({ invoices: formattedInvoices });
      
    } catch (stripeError: any) {
      console.error('Stripe invoices fetch failed:', stripeError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch invoices', 
          details: stripeError.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Stripe invoices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
