'use client';
import { db, storage } from '@/lib/firebase/client';
import { doc, updateDoc, collection, query, orderBy, onSnapshot, getDocs, where } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { ClaimStatus, Vehicle } from '@/lib/types';

export function subscribeUsers(callback: (users: any[]) => void) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }))));
}

export function subscribeVehicles(callback: (vehicles: Vehicle[]) => void) {
  const q = query(collection(db, 'vehicles'), orderBy('lastUpdated', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as unknown as Vehicle[]));
}

export function subscribeVehiclesByOwner(ownerId: string, callback: (vehicles: Vehicle[]) => void) {
  const q = query(collection(db, 'vehicles'), where('ownerId', '==', ownerId));
  return onSnapshot(q, (snap) => {
    const vehicles = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as unknown as Vehicle[];
    // Sort client-side to avoid composite index requirement
    vehicles.sort((a, b) => (b.lastUpdated?.toDate?.() || 0) - (a.lastUpdated?.toDate?.() || 0));
    callback(vehicles);
  });
}

export function subscribeRequests(callback: (requests: any[]) => void) {
  const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))));
}

// Alias for backward compatibility
export const subscribeClaims = subscribeRequests;

export function subscribeRequestsByUser(userId: string, callback: (requests: any[]) => void) {
  const q = query(collection(db, 'requests'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const requests = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    // Sort client-side to avoid composite index requirement
    requests.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
    callback(requests);
  });
}

// Alias for backward compatibility
export const subscribeClaimsByUser = subscribeRequestsByUser;

export async function setUserActive(uid: string, isActive: boolean) {
  await updateDoc(doc(db, 'users', uid), { isActive });
}

export async function updateRequestStatus(requestId: string, status: ClaimStatus) {
  await updateDoc(doc(db, 'requests', requestId), { status, updatedAt: new Date() });
}

// Alias for backward compatibility
export const updateClaimStatus = updateRequestStatus;

export async function updateVehicleAdmin(vehicleId: string, update: Partial<{ make: string; model: string; year: string; vin: string; licensePlate: string; state: string; color: string; isActive: boolean }>) {
  await updateDoc(doc(db, 'vehicles', vehicleId), {
    ...update,
    lastUpdated: new Date(),
  });
}

export async function uploadVehiclePhoto(vehicleId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `vehicles/${vehicleId}/photos/photo_${Date.now()}.jpg`);
  await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
  return await getDownloadURL(storageRef);
}

export async function deleteByUrl(fileUrl: string) {
  const r = ref(storage, fileUrl);
  await deleteObject(r);
}

export async function uploadRequestPhoto(requestId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `requests/${requestId}/photos/photo_${Date.now()}.jpg`);
  await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
  return await getDownloadURL(storageRef);
}

// Alias for backward compatibility
export const uploadClaimPhoto = uploadRequestPhoto;

export async function listConsentLogs() {
  const snap = await getDocs(collection(db, 'consent_logs'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export function subscribeTowEvents(callback: (events: any[]) => void) {
  const q = query(collection(db, 'admin_events'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snap) => {
    const events = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter(event => event.event === 'tow_call');
    callback(events);
  });
}







