import { NextRequest, NextResponse } from 'next/server';
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

const db = getFirestore();

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { providerId, email } = await request.json();

    if (!providerId || !email) {
      return NextResponse.json(
        { error: 'Provider ID and email are required' },
        { status: 400 }
      );
    }

    // Normalize email to lowercase for comparison
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedProviderId = providerId.trim();

    // Find provider by Provider ID and email using Admin SDK
    const providersRef = db.collection('providers');
    let providersSnapshot = await providersRef
      .where('providerId', '==', trimmedProviderId)
      .where('email', '==', normalizedEmail)
      .get();

    // If no results, try with original email case (fallback)
    if (providersSnapshot.empty) {
      providersSnapshot = await providersRef
        .where('providerId', '==', trimmedProviderId)
        .where('email', '==', email.trim())
        .get();
    }

    if (providersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid Provider ID or email. Please check your credentials.' },
        { status: 404 }
      );
    }

    const providerDoc = providersSnapshot.docs[0];
    const providerData = providerDoc.data();

    if (providerData.status !== 'approved') {
      return NextResponse.json(
        { error: 'Your application is not yet approved. Please contact support.' },
        { status: 403 }
      );
    }

    // Return provider data (excluding sensitive information)
    return NextResponse.json({
      success: true,
      provider: {
        id: providerDoc.id,
        providerId: providerData.providerId,
        businessName: providerData.businessName,
        contactPerson: providerData.contactPerson,
        email: providerData.email,
        phone: providerData.phone,
        status: providerData.status
      }
    });

  } catch (error: any) {
    console.error('Provider verification error:', error);
    return NextResponse.json(
      { error: 'Error verifying credentials. Please try again.' },
      { status: 500 }
    );
  }
}
