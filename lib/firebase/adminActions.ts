'use client';
import { db, storage } from '@/lib/firebase/client';
import { doc, updateDoc, collection, query, orderBy, onSnapshot, getDocs, where, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { ClaimStatus as RequestStatus, Vehicle } from '@/lib/types';

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

export function subscribeClaims(callback: (claims: any[]) => void) {
  const q = query(collection(db, 'claims'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))));
}

export function subscribeClaimsByUser(userId: string, callback: (claims: any[]) => void) {
  const q = query(collection(db, 'claims'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const claims = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    // Sort client-side to avoid composite index requirement
    claims.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
    callback(claims);
  });
}

export async function setUserActive(uid: string, isActive: boolean) {
  await updateDoc(doc(db, 'users', uid), { isActive });
}

export async function updateClaimStatus(claimId: string, status: RequestStatus) {
  await updateDoc(doc(db, 'claims', claimId), { status, updatedAt: new Date() });
}

export async function updateVehicleAdmin(vehicleId: string, update: Partial<{ make: string; model: string; year: string; vin: string; licensePlate: string; state: string; color: string }>) {
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

export async function uploadClaimPhoto(claimId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `claims/${claimId}/photos/photo_${Date.now()}.jpg`);
  await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
  return await getDownloadURL(storageRef);
}

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

// System Settings (Admin)
// Stored under collection `settings/system` to comply with security rules
const SYSTEM_SETTINGS_PATH = ['settings', 'system'] as const;

export async function getSystemSettings(): Promise<any | null> {
  const docRef = doc(db, SYSTEM_SETTINGS_PATH[0], SYSTEM_SETTINGS_PATH[1]);
  const snap = await getDoc(docRef);
  return snap.exists() ? (snap.data() as any) : null;
}

export async function saveSystemSettings(settings: any): Promise<void> {
  const docRef = doc(db, SYSTEM_SETTINGS_PATH[0], SYSTEM_SETTINGS_PATH[1]);
  await setDoc(docRef, { ...settings, updatedAt: new Date() }, { merge: true });
}

// ----- Claim Messages (Admin) -----
export type ClaimMessage = {
  id?: string;
  body: string;
  direction: 'outbound' | 'inbound';
  to?: string;
  from?: string;
  status?: 'sent' | 'failed' | 'skipped';
  createdAt: any;
};

export function subscribeClaimMessages(claimId: string, callback: (messages: ClaimMessage[]) => void) {
  const q = query(collection(db, 'claims', claimId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) =>
    callback(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as unknown as ClaimMessage[]
    )
  );
}

export async function logClaimMessage(
  claimId: string,
  message: Omit<ClaimMessage, 'createdAt'>
): Promise<boolean> {
  try {
    await addDoc(collection(db, 'claims', claimId, 'messages'), {
      ...message,
      createdAt: new Date(),
    });
    // Touch claim for recency
    await updateDoc(doc(db, 'claims', claimId), { updatedAt: new Date() });
    return true;
  } catch (error) {
    console.warn('[logClaimMessage] Failed to write message (likely rules).', error);
    return false;
  }
}







