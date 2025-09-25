import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY_B64) {
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
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

const db = getFirestore();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const providerId = searchParams.get('providerId');

    console.log('Debug request:', { email, providerId });

    // Get all providers
    const providersSnapshot = await db.collection('providers').get();
    const allProviders = providersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Total providers in database:', allProviders.length);

    // If specific email/providerId requested, filter results
    let filteredProviders = allProviders;
    if (email) {
      filteredProviders = allProviders.filter(p => 
        p.email?.toLowerCase().includes(email.toLowerCase())
      );
    }
    if (providerId) {
      filteredProviders = filteredProviders.filter(p => 
        p.providerId === providerId
      );
    }

    // Return debug info
    return NextResponse.json({
      totalProviders: allProviders.length,
      filteredProviders: filteredProviders.length,
      providers: filteredProviders.map(p => ({
        id: p.id,
        providerId: p.providerId,
        email: p.email,
        status: p.status,
        businessName: p.businessName,
        createdAt: p.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: `Debug error: ${error.message}` },
      { status: 500 }
    );
  }
}
