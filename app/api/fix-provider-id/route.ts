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

const generateProviderId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(request: NextRequest) {
  try {
    const { providerId, email } = await request.json();

    if (!providerId && !email) {
      return NextResponse.json(
        { error: 'Provider ID or email is required' },
        { status: 400 }
      );
    }

    let providersSnapshot;
    
    if (providerId) {
      providersSnapshot = await db.collection('providers')
        .where('providerId', '==', providerId)
        .get();
    } else if (email) {
      providersSnapshot = await db.collection('providers')
        .where('email', '==', email)
        .get();
    } else {
      return NextResponse.json(
        { error: 'Provider ID or email is required' },
        { status: 400 }
      );
    }

    if (providersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    const providerDoc = providersSnapshot.docs[0];
    const providerData = providerDoc.data();

    // Check if provider already has a providerId
    if (providerData.providerId) {
      return NextResponse.json({
        success: true,
        message: 'Provider already has a Provider ID',
        provider: {
          id: providerDoc.id,
          providerId: providerData.providerId,
          email: providerData.email,
          businessName: providerData.businessName,
          status: providerData.status
        }
      });
    }

    // Generate new provider ID
    const newProviderId = generateProviderId();

    // Update the provider with the new ID
    await providerDoc.ref.update({
      providerId: newProviderId,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Provider ID assigned successfully',
      provider: {
        id: providerDoc.id,
        providerId: newProviderId,
        email: providerData.email,
        businessName: providerData.businessName,
        status: providerData.status
      }
    });

  } catch (error: any) {
    console.error('Fix provider ID error:', error);
    return NextResponse.json(
      { error: 'Error fixing provider ID.' },
      { status: 500 }
    );
  }
}
