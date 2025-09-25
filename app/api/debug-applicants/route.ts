import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export async function GET(request: NextRequest) {
  try {
    // Get all applicants
    const applicantsSnapshot = await db.collection('applicants').get();
    const applicants = applicantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      total: applicants.length,
      applicants: applicants
    });

  } catch (error: any) {
    console.error('Debug applicants error:', error);
    return NextResponse.json(
      { error: 'Error fetching applicants data.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { providerId, requestId, customerName, customerPhone, customerEmail, vehicleInfo, issueDescription, location } = await request.json();

    if (!providerId || !requestId) {
      return NextResponse.json(
        { error: 'Provider ID and Request ID are required' },
        { status: 400 }
      );
    }

    // Create a test applicant record
    const applicantData = {
      requestId: requestId,
      providerId: providerId,
      providerName: 'Test Provider',
      customerName: customerName || 'Test Customer',
      customerPhone: customerPhone || '555-1234',
      customerEmail: customerEmail || 'test@example.com',
      vehicleInfo: vehicleInfo || '2024 Test Vehicle',
      issueDescription: issueDescription || 'Test issue description',
      location: location || 'Test Location',
      priority: 'medium',
      status: 'assigned',
      assignedAt: new Date(),
      notes: '',
      adminNotes: '',
    };

    const applicantRef = await db.collection('applicants').add(applicantData);

    return NextResponse.json({
      success: true,
      message: 'Test applicant created successfully',
      applicantId: applicantRef.id,
      applicantData: applicantData
    });

  } catch (error: any) {
    console.error('Create test applicant error:', error);
    return NextResponse.json(
      { error: 'Error creating test applicant.' },
      { status: 500 }
    );
  }
}
