import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();
const db = getFirestore();

export async function DELETE(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Deleting user:', uid);

    // Delete from Firebase Authentication
    try {
      await auth.deleteUser(uid);
      console.log('User deleted from Firebase Auth:', uid);
    } catch (authError) {
      console.error('Error deleting user from Firebase Auth:', authError);
      // Continue with Firestore deletion even if Auth deletion fails
    }

    // Delete from Firestore
    try {
      await db.collection('users').doc(uid).delete();
      console.log('User document deleted from Firestore:', uid);
    } catch (firestoreError) {
      console.error('Error deleting user document from Firestore:', firestoreError);
      return NextResponse.json({ error: 'Failed to delete user document' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error in delete-user API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
