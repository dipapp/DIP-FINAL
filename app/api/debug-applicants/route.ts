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

interface Applicant {
  id: string;
  requestId?: string;
  providerId?: string;
  providerName?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  vehicleInfo?: string;
  issueDescription?: string;
  location?: string;
  priority?: string;
  status?: string;
  assignedAt?: Date;
  dueDate?: Date;
  notes?: string;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const providerId = searchParams.get('providerId');

    // Get all applicants
    const applicantsSnapshot = await db.collection('applicants').get();
    const allApplicants: Applicant[] = applicantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      assignedAt: doc.data().assignedAt?.toDate(),
      dueDate: doc.data().dueDate?.toDate(),
    }));

    let filteredApplicants = allApplicants;

    // Filter by status if provided
    if (status) {
      filteredApplicants = allApplicants.filter(a => 
        a.status?.toLowerCase().includes(status.toLowerCase())
      );
    }

    // Filter by providerId if provided
    if (providerId) {
      filteredApplicants = filteredApplicants.filter(a => 
        a.providerId?.includes(providerId)
      );
    }

    return NextResponse.json({
      success: true,
      total: allApplicants.length,
      filtered: filteredApplicants.length,
      applicants: filteredApplicants.map(a => ({
        id: a.id,
        requestId: a.requestId,
        providerId: a.providerId || 'Not assigned',
        providerName: a.providerName,
        customerName: a.customerName,
        customerPhone: a.customerPhone,
        customerEmail: a.customerEmail,
        vehicleInfo: a.vehicleInfo,
        issueDescription: a.issueDescription,
        location: a.location,
        priority: a.priority,
        status: a.status,
        assignedAt: a.assignedAt,
        dueDate: a.dueDate,
        notes: a.notes,
        hasProviderId: !!a.providerId,
        rawData: {
          providerId: a.providerId,
          status: a.status,
          priority: a.priority
        }
      }))
    });

  } catch (error: any) {
    console.error('Debug applicants error:', error);
    return NextResponse.json(
      { error: 'Error fetching applicants data.' },
      { status: 500 }
    );
  }
}
