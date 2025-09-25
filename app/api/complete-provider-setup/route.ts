import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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
const auth = getAuth();

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

    // Find provider by Provider ID and email
    const providersSnapshot = await db.collection('providers')
      .where('providerId', '==', providerId)
      .where('email', '==', email)
      .get();

    if (providersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    const providerDoc = providersSnapshot.docs[0];
    const providerData = providerDoc.data();

    if (providerData.status !== 'approved') {
      return NextResponse.json(
        { error: 'Provider is not approved' },
        { status: 403 }
      );
    }

    // Check if Firebase Auth user exists
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'Firebase Auth account not found. Please complete the signup process first.' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Check if user document already exists
    const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
    if (userDoc.exists) {
      return NextResponse.json({
        success: true,
        message: 'Account setup already completed',
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        }
      });
    }

    // Complete the setup by creating missing documents
    await db.collection('users').doc(firebaseUser.uid).set({
      uid: firebaseUser.uid,
      email: providerData.email,
      firstName: providerData.contactPerson.split(' ')[0] || providerData.contactPerson,
      lastName: providerData.contactPerson.split(' ').slice(1).join(' ') || '',
      phoneNumber: providerData.phone,
      isProvider: true,
      providerId: providerData.providerId,
      businessName: providerData.businessName,
      isActive: true,
      createdAt: new Date(),
    });

    await db.collection('provider_profiles').doc(firebaseUser.uid).set({
      providerId: providerData.providerId,
      businessName: providerData.businessName,
      contactPerson: providerData.contactPerson,
      email: providerData.email,
      phone: providerData.phone,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Provider account setup completed successfully',
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      }
    });

  } catch (error: any) {
    console.error('Complete provider setup error:', error);
    return NextResponse.json(
      { error: 'Error completing provider setup.' },
      { status: 500 }
    );
  }
}

