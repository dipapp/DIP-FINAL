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

interface Provider {
  id: string;
  providerId?: string;
  email?: string;
  businessName?: string;
  status?: string;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const providerId = searchParams.get('providerId');

    // Get all providers
    const providersSnapshot = await db.collection('providers').get();
    const allProviders: Provider[] = providersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    let filteredProviders = allProviders;

    // Filter by email if provided
    if (email) {
      filteredProviders = allProviders.filter(p => 
        p.email?.toLowerCase().includes(email.toLowerCase())
      );
    }

    // Filter by providerId if provided
    if (providerId) {
      filteredProviders = filteredProviders.filter(p => 
        p.providerId?.includes(providerId)
      );
    }

    return NextResponse.json({
      success: true,
      total: allProviders.length,
      filtered: filteredProviders.length,
      providers: filteredProviders.map(p => ({
        id: p.id,
        providerId: p.providerId || 'Not assigned',
        email: p.email,
        businessName: p.businessName,
        status: p.status,
        hasProviderId: !!p.providerId,
        rawData: {
          providerId: p.providerId,
          email: p.email,
          status: p.status
        }
      }))
    });

  } catch (error: any) {
    console.error('Debug providers error:', error);
    return NextResponse.json(
      { error: 'Error fetching providers data.' },
      { status: 500 }
    );
  }
}
