'use client';
import { auth, db, storage } from '@/lib/firebase/client';
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export function subscribeMyProfile(callback: (profile: any | null) => void) {
  return auth.onAuthStateChanged((u) => {
    if (!u) return callback(null);
    const unsub = onSnapshot(doc(db, 'users', u.uid), (snap) => callback(snap.exists() ? { uid: snap.id, ...snap.data() } : null));
    return () => unsub();
  });
}

export async function updateMyProfile(update: Partial<{ firstName: string; lastName: string; phoneNumber: string; email: string }>) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  await updateDoc(doc(db, 'users', u.uid), update);
}

export function subscribeMyVehicles(callback: (vehicles: any[]) => void) {
  // Manage both auth and snapshot unsubs together
  let innerUnsub: (() => void) | null = null;
  const authUnsub = auth.onAuthStateChanged((u) => {
    // Clean up previous snapshot if auth state changes
    if (innerUnsub) {
      innerUnsub();
      innerUnsub = null;
    }
    if (!u) {
      callback([]);
      return;
    }
    try {
      // Remove orderBy to avoid composite index requirement; sort client-side if needed
      const q = query(collection(db, 'vehicles'), where('ownerId', '==', u.uid));
      innerUnsub = onSnapshot(
        q,
        (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
        (error) => {
          console.error('subscribeMyVehicles error:', error);
          callback([]);
        }
      );
    } catch (err) {
      console.error('subscribeMyVehicles init error:', err);
      callback([]);
    }
  });
  return () => {
    authUnsub();
    if (innerUnsub) innerUnsub();
  };
}

export async function addVehicle(input: { make: string; model: string; year: string; isActive: boolean; vin?: string; licensePlate?: string; state?: string; color?: string }) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  const vehicle = {
    ...input,
    lastUpdated: serverTimestamp(),
    ownerId: u.uid,
    ownerEmail: u.email ?? '',
    photos: [],
    insuranceDocuments: [],
  };
  const refDoc = doc(collection(db, 'vehicles'));
  await setDoc(refDoc, vehicle);
  return refDoc.id;
}

export async function uploadMyVehiclePhoto(vehicleId: string, file: File) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  
  // Verify the vehicle belongs to the current user
  const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
  if (!vehicleDoc.exists()) {
    throw new Error('Vehicle not found');
  }
  
  const vehicleData = vehicleDoc.data();
  if (vehicleData.ownerId !== u.uid) {
    throw new Error('Access denied - you can only upload photos to your own vehicles');
  }
  
  // Upload the photo to storage
  const r = ref(storage, `vehicles/${vehicleId}/photos/photo_${Date.now()}.jpg`);
  await uploadBytes(r, file, { contentType: file.type || 'image/jpeg' });
  const photoUrl = await getDownloadURL(r);
  
  // Add the photo URL to the vehicle's photos array
  const currentPhotos = vehicleData.photos || [];
  await updateDoc(doc(db, 'vehicles', vehicleId), {
    photos: [...currentPhotos, photoUrl],
    lastUpdated: serverTimestamp(),
  });
  
  return photoUrl;
}

export async function uploadMyVehicleDocument(vehicleId: string, file: File, type: string) {
  const r = ref(storage, `vehicles/${vehicleId}/documents/${type}_${Date.now()}.${file.name.split('.').pop() || 'dat'}`);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}

export async function deleteByUrl(url: string) {
  try {
    // Convert download URL to storage reference
    // Download URLs look like: https://firebasestorage.googleapis.com/v0/b/project-id/o/path%2Fto%2Ffile.jpg?alt=media&token=...
    // We need to extract the path: path/to/file.jpg
    
    // Remove the base URL and query parameters
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
    const projectId = 'deductible-impact-protection'; // Your Firebase project ID
    
    if (url.startsWith(baseUrl)) {
      const pathStart = url.indexOf('/o/') + 3;
      const pathEnd = url.indexOf('?');
      const encodedPath = url.substring(pathStart, pathEnd);
      const decodedPath = decodeURIComponent(encodedPath);
      
      console.log('Deleting file from storage:', decodedPath);
      await deleteObject(ref(storage, decodedPath));
    } else {
      console.warn('Invalid Firebase Storage URL:', url);
      throw new Error('Invalid Firebase Storage URL');
    }
  } catch (error) {
    console.error('Error deleting file from storage:', error);
    throw error;
  }
}

export function subscribeMyClaims(callback: (claims: any[]) => void) {
  // Manage both auth and snapshot unsubs together
  let innerUnsub: (() => void) | null = null;
  const authUnsub = auth.onAuthStateChanged((u) => {
    if (innerUnsub) {
      innerUnsub();
      innerUnsub = null;
    }
    if (!u) {
      callback([]);
      return;
    }
    try {
      // Remove orderBy to avoid composite index requirement; sort client-side if desired
      const q = query(collection(db, 'claims'), where('userId', '==', u.uid));
      innerUnsub = onSnapshot(
        q,
        (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
        (error) => {
          console.error('subscribeMyClaims error:', error);
          callback([]);
        }
      );
    } catch (err) {
      console.error('subscribeMyClaims init error:', err);
      callback([]);
    }
  });
  return () => {
    authUnsub();
    if (innerUnsub) innerUnsub();
  };
}

export async function createClaimDraft(vehicle: { id: string; make: string; model: string; year: string }, userProfile: any) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  const refDoc = doc(collection(db, 'claims'));
  const base = {
    userId: u.uid,
    userEmail: u.email ?? '',
    userFirstName: userProfile?.firstName ?? null,
    userLastName: userProfile?.lastName ?? null,
    vehicleId: vehicle.id,
    vehicleMake: vehicle.make,
    vehicleModel: vehicle.model,
    vehicleYear: vehicle.year,
    date: serverTimestamp(),
    amount: 0,
    status: 'Pending',
    description: '',
    photoURLs: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as any;
  await setDoc(refDoc, base);
  return refDoc.id;
}

export async function uploadClaimPhoto(claimId: string, file: File) {
  const r = ref(storage, `claims/${claimId}/photos/photo_${Date.now()}.jpg`);
  await uploadBytes(r, file, { contentType: file.type || 'image/jpeg' });
  return await getDownloadURL(r);
}

export async function submitClaim(claimId: string, data: { amount: number; description?: string; userPhoneNumber: string; photoURLs: string[]; date?: Date }) {
  await updateDoc(doc(db, 'claims', claimId), {
    amount: data.amount,
    description: data.description ?? '',
    userPhoneNumber: data.userPhoneNumber,
    photoURLs: data.photoURLs,
    date: data.date ? data.date : serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getClaimById(claimId: string) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  
  const docRef = doc(db, 'claims', claimId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Request not found');
  }
  
  const data = docSnap.data();
  if (data.userId !== u.uid) {
    throw new Error('Access denied');
  }
  
  return { id: docSnap.id, ...data };
}

export async function addPhotosToClaim(claimId: string, files: File[]) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadClaimPhoto(claimId, file);
    urls.push(url);
  }
  
  const docRef = doc(db, 'claims', claimId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists() || docSnap.data().userId !== u.uid) {
    throw new Error('Access denied');
  }
  
  const currentPhotos = docSnap.data().photoURLs || [];
  await updateDoc(docRef, {
    photoURLs: [...currentPhotos, ...urls],
    updatedAt: serverTimestamp(),
  });
}

export async function updateClaimDescription(claimId: string, description: string) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  
  const docRef = doc(db, 'claims', claimId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists() || docSnap.data().userId !== u.uid) {
    throw new Error('Access denied');
  }
  
  await updateDoc(docRef, {
    description,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteClaimPhoto(claimId: string, photoURL: string) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  
  const docRef = doc(db, 'claims', claimId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists() || docSnap.data().userId !== u.uid) {
    throw new Error('Access denied');
  }
  
  const currentPhotos = docSnap.data().photoURLs || [];
  const updatedPhotos = currentPhotos.filter((url: string) => url !== photoURL);
  
  await updateDoc(docRef, {
    photoURLs: updatedPhotos,
    updatedAt: serverTimestamp(),
  });
  
  // Delete the file from storage
  await deleteByUrl(photoURL);
}

export async function updateVehicle(vehicleId: string, update: Partial<{ make: string; model: string; year: string; vin: string; licensePlate: string; state: string; color: string }>) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  await updateDoc(doc(db, 'vehicles', vehicleId), {
    ...update,
    lastUpdated: serverTimestamp(),
  });
}

export async function setVehicleActive(vehicleId: string, isActive: boolean) {
  await updateDoc(doc(db, 'vehicles', vehicleId), {
    isActive,
    lastUpdated: serverTimestamp(),
  });
}

export async function deleteVehicle(vehicleId: string) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  
  // First, verify the vehicle belongs to the current user
  const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
  if (!vehicleDoc.exists()) {
    throw new Error('Vehicle not found');
  }
  
  const vehicleData = vehicleDoc.data();
  if (vehicleData.ownerId !== u.uid) {
    throw new Error('Access denied - you can only delete your own vehicles');
  }
  
  // Delete all photos and documents from storage
  if (vehicleData.photos && Array.isArray(vehicleData.photos)) {
    for (const photoUrl of vehicleData.photos) {
      try {
        await deleteByUrl(photoUrl);
      } catch (error) {
        console.warn('Failed to delete photo:', photoUrl, error);
      }
    }
  }
  
  if (vehicleData.insuranceDocuments && Array.isArray(vehicleData.insuranceDocuments)) {
    for (const docUrl of vehicleData.insuranceDocuments) {
      try {
        await deleteByUrl(docUrl);
      } catch (error) {
        console.warn('Failed to delete document:', docUrl, error);
      }
    }
  }
  
  // Delete the vehicle document
  await deleteDoc(doc(db, 'vehicles', vehicleId));
}

export async function updatePaymentMethod(vehicleId: string, paymentData: {
  cardNumber: string;
  expiry: string;
  cvv: string;
  name: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
}) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  
  // Verify the vehicle belongs to the current user
  const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
  if (!vehicleDoc.exists()) {
    throw new Error('Vehicle not found');
  }
  
  const vehicleData = vehicleDoc.data();
  if (vehicleData.ownerId !== u.uid) {
    throw new Error('Access denied - you can only update payment for your own vehicles');
  }
  
  // In a real implementation, you would integrate with a payment processor here
  // For now, we'll just store the payment method info (securely in production)
  await updateDoc(doc(db, 'vehicles', vehicleId), {
    paymentMethod: {
      last4: paymentData.cardNumber.slice(-4),
      expiry: paymentData.expiry,
      name: paymentData.name,
      streetAddress: paymentData.streetAddress,
      city: paymentData.city,
      state: paymentData.state,
      zip: paymentData.zip,
      updatedAt: serverTimestamp(),
    },
    isActive: true, // Activate the vehicle when payment is added
    lastUpdated: serverTimestamp(),
  });
}

export async function deleteVehiclePhoto(vehicleId: string, photoUrl: string) {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  
  // Verify the vehicle belongs to the current user
  const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
  if (!vehicleDoc.exists()) {
    throw new Error('Vehicle not found');
  }
  
  const vehicleData = vehicleDoc.data();
  if (vehicleData.ownerId !== u.uid) {
    throw new Error('Access denied - you can only delete photos from your own vehicles');
  }
  
  // Remove the photo from the vehicle's photos array
  // Handle both string URLs (web format) and object format (iOS format)
  const currentPhotos = vehicleData.photos || [];
  const updatedPhotos = currentPhotos.filter((photo: any) => {
    if (typeof photo === 'string') {
      return photo !== photoUrl;
    } else {
      return photo.imageURL !== photoUrl;
    }
  });
  
  // Update the vehicle document
  await updateDoc(doc(db, 'vehicles', vehicleId), {
    photos: updatedPhotos,
    lastUpdated: serverTimestamp(),
  });
  
  // Try to delete the photo file from storage, but don't fail if it doesn't work
  try {
    await deleteByUrl(photoUrl);
  } catch (storageError) {
    console.warn('Failed to delete photo from storage, but database was updated:', storageError);
    // Don't throw the error since the database update succeeded
    // The photo will be removed from the UI anyway
  }
}