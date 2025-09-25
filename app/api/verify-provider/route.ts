import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs } from 'firebase/firestore';

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

    // Find provider by Provider ID and email
    const providersQuery = query(
      collection(db, 'providers'),
      where('providerId', '==', trimmedProviderId),
      where('email', '==', normalizedEmail)
    );
    
    let providersSnapshot = await getDocs(providersQuery);

    // If no results, try with original email case (fallback)
    if (providersSnapshot.empty) {
      const fallbackQuery = query(
        collection(db, 'providers'),
        where('providerId', '==', trimmedProviderId),
        where('email', '==', email.trim())
      );
      providersSnapshot = await getDocs(fallbackQuery);
    }

    if (providersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid Provider ID or email. Please check your credentials.' },
        { status: 404 }
      );
    }

    const providerDoc = providersSnapshot.docs[0];
    const providerData = providerDoc.data();

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
