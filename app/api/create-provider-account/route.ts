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
    const { providerId, email, password } = await request.json();

    if (!providerId || !email || !password) {
      return NextResponse.json(
        { error: 'Provider ID, email, and password are required' },
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

    // Check if Firebase Auth user already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      return NextResponse.json({
        success: true,
        message: 'Account already exists. You can sign in at /provider/login',
        user: {
          uid: existingUser.uid,
          email: existingUser.email,
          displayName: existingUser.displayName
        }
      });
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create Firebase Auth account
    const firebaseUser = await auth.createUser({
      email: email,
      password: password,
      displayName: `${providerData.contactPerson} (${providerData.businessName})`
    });

    // Create user document
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

    // Create provider profile
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
      message: 'Account created successfully! You can now sign in.',
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      }
    });

  } catch (error: any) {
    console.error('Create provider account error:', error);
    return NextResponse.json(
      { error: 'Error creating provider account.' },
      { status: 500 }
    );
  }
}

