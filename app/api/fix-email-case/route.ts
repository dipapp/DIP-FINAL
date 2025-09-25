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

    // Find provider by providerId
    const providersSnapshot = await db.collection('providers')
      .where('providerId', '==', providerId)
      .get();

    if (providersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    const providerDoc = providersSnapshot.docs[0];
    const providerData = providerDoc.data();

    // Update email to lowercase for consistency
    await providerDoc.ref.update({
      email: email.toLowerCase(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Email case updated successfully',
      provider: {
        id: providerDoc.id,
        providerId: providerData.providerId,
        email: email.toLowerCase(),
        businessName: providerData.businessName,
        status: providerData.status
      }
    });

  } catch (error: any) {
    console.error('Fix email case error:', error);
    return NextResponse.json(
      { error: 'Error fixing email case.' },
      { status: 500 }
    );
  }
}

