import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  // Handle base64 encoded private key
  let privateKey = process.env.FIREBASE_PRIVATE_KEY_B64;
  if (privateKey) {
    // Decode base64 private key
    privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
  } else {
    // Fallback to regular private key
    privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: privateKey?.replace(/\\n/g, '\n'),
  };

  // Check if we have the required credentials
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error('Missing Firebase Admin credentials:', {
      projectId: !!serviceAccount.projectId,
      clientEmail: !!serviceAccount.clientEmail,
      privateKey: !!serviceAccount.privateKey,
    });
    throw new Error('Firebase Admin credentials not properly configured');
  }

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();
const db = getFirestore();

function getUidFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return Promise.resolve(null);
  const idToken = authHeader.split('Bearer ')[1];
  return auth
    .verifyIdToken(idToken)
    .then((decoded) => decoded.uid)
    .catch(() => null);
}

export async function POST(request: NextRequest) {
  try {
    const uid = await getUidFromRequest(request);
    if (!uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('Deleting user (self-service):', uid);

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

export async function DELETE(request: NextRequest) {
  try {
    const uid = await getUidFromRequest(request);
    if (!uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('Deleting user (self-service):', uid);

    try {
      await auth.deleteUser(uid);
      console.log('User deleted from Firebase Auth:', uid);
    } catch (authError) {
      console.error('Error deleting user from Firebase Auth:', authError);
    }

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
