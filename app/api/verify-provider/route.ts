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

    console.log('Searching for provider with:', { 
      providerId: trimmedProviderId, 
      email: normalizedEmail,
      originalEmail: email.trim()
    });

    // Find provider by Provider ID and email using Admin SDK
    const providersRef = db.collection('providers');
    let providersSnapshot = await providersRef
      .where('providerId', '==', trimmedProviderId)
      .where('email', '==', normalizedEmail)
      .get();

    console.log('First query results:', providersSnapshot.size);

    // If no results, try with original email case (fallback)
    if (providersSnapshot.empty) {
      providersSnapshot = await providersRef
        .where('providerId', '==', trimmedProviderId)
        .where('email', '==', email.trim())
        .get();
      console.log('Second query results:', providersSnapshot.size);
    }

    // Debug: Let's also try to find any provider with this email (case insensitive)
    if (providersSnapshot.empty) {
      const emailOnlySnapshot = await providersRef
        .where('email', '==', normalizedEmail)
        .get();
      console.log('Email-only query results:', emailOnlySnapshot.size);
      
      if (!emailOnlySnapshot.empty) {
        const foundProvider = emailOnlySnapshot.docs[0].data();
        console.log('Found provider with email but different providerId:', {
          foundProviderId: foundProvider.providerId,
          searchedProviderId: trimmedProviderId,
          email: foundProvider.email,
          status: foundProvider.status
        });
      }
    }

    // Debug: Let's also try to find any provider with this providerId
    if (providersSnapshot.empty) {
      const providerIdOnlySnapshot = await providersRef
        .where('providerId', '==', trimmedProviderId)
        .get();
      console.log('ProviderId-only query results:', providerIdOnlySnapshot.size);
      
      if (!providerIdOnlySnapshot.empty) {
        const foundProvider = providerIdOnlySnapshot.docs[0].data();
        console.log('Found provider with providerId but different email:', {
          providerId: foundProvider.providerId,
          foundEmail: foundProvider.email,
          searchedEmail: normalizedEmail,
          status: foundProvider.status
        });
      }
    }

    if (providersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid Provider ID or email. Please check your credentials.' },
        { status: 404 }
      );
    }

    const providerDoc = providersSnapshot.docs[0];
    const providerData = providerDoc.data();

    console.log('Found provider data:', {
      id: providerDoc.id,
      providerId: providerData.providerId,
      email: providerData.email,
      status: providerData.status,
      businessName: providerData.businessName
    });

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
