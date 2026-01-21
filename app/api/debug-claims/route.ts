import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY_B64) {
      console.error('Missing Firebase Admin environment variables');
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

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    
    // Get all claims
    const claimsSnapshot = await db.collection('claims').get();
    const allClaims = claimsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
    }));

    // Also check for serviceRequests collection
    let serviceRequests: any[] = [];
    try {
      const srSnapshot = await db.collection('serviceRequests').get();
      serviceRequests = srSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      }));
    } catch (e) {
      // Collection might not exist
    }

    // Filter by email if provided
    let filteredClaims = allClaims;
    let filteredSR = serviceRequests;
    if (email) {
      filteredClaims = allClaims.filter((c: any) => 
        c.userEmail === email || 
        c.email === email ||
        c.memberEmail === email
      );
      filteredSR = serviceRequests.filter((c: any) => 
        c.userEmail === email || 
        c.email === email ||
        c.memberEmail === email
      );
    }

    // Get unique field names from all claims
    const fieldNames = new Set<string>();
    allClaims.forEach((claim: any) => {
      Object.keys(claim).forEach(key => fieldNames.add(key));
    });

    return NextResponse.json({
      success: true,
      email: email || 'all',
      claimsCollection: {
        total: allClaims.length,
        filtered: filteredClaims.length,
        claims: filteredClaims,
      },
      serviceRequestsCollection: {
        total: serviceRequests.length,
        filtered: filteredSR.length,
        requests: filteredSR,
      },
      allFieldsInClaims: Array.from(fieldNames),
    });

  } catch (error: any) {
    console.error('Debug claims error:', error);
    return NextResponse.json(
      { error: 'Error fetching claims data: ' + error.message },
      { status: 500 }
    );
  }
}
