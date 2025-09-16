'use client';
import { db, storage } from '@/lib/firebase/client';
import { doc, updateDoc, collection, query, orderBy, onSnapshot, getDocs, where, getDoc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
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

// --- Dangerous Operation: Delete a user and related data ---
export async function deleteUserEverywhere(uid: string): Promise<void> {
  // Load user doc to infer email and attached files
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const user = userSnap.exists() ? (userSnap.data() as any) : null;
  const userEmail: string | undefined = user?.email;

  // Best-effort delete of user-specific files
  const possibleUserFileUrls: (string | undefined)[] = [user?.driverLicenseURL];
  for (const url of possibleUserFileUrls) {
    if (typeof url === 'string' && url.startsWith('http')) {
      try { await deleteByUrl(url); } catch {}
    }
  }

  // Delete vehicles owned by the user
  const vehicleIds = new Set<string>();
  const byOwnerId = await getDocs(query(collection(db, 'vehicles'), where('ownerId', '==', uid)));
  byOwnerId.forEach((d) => vehicleIds.add(d.id));
  if (userEmail) {
    const byOwnerEmail = await getDocs(query(collection(db, 'vehicles'), where('ownerEmail', '==', userEmail)));
    byOwnerEmail.forEach((d) => vehicleIds.add(d.id));
  }
  for (const vid of Array.from(vehicleIds)) {
    const vRef = doc(db, 'vehicles', vid);
    const vSnap = await getDoc(vRef);
    const v = vSnap.exists() ? (vSnap.data() as any) : null;
    if (v) {
      const vehicleFileUrls: string[] = [];
      try { (v.photos || []).forEach((p: any) => p?.imageURL && vehicleFileUrls.push(p.imageURL)); } catch {}
      try { (v.insuranceDocuments || []).forEach((d: any) => { if (d?.fileURL) vehicleFileUrls.push(d.fileURL); if (d?.imageURL) vehicleFileUrls.push(d.imageURL); }); } catch {}
      for (const url of vehicleFileUrls) {
        if (typeof url === 'string' && url.startsWith('http')) {
          try { await deleteByUrl(url); } catch {}
        }
      }
    }
    try { await deleteDoc(vRef); } catch {}
  }

  // Delete claims belonging to the user
  const claimIds = new Set<string>();
  const byUserId = await getDocs(query(collection(db, 'claims'), where('userId', '==', uid)));
  byUserId.forEach((d) => claimIds.add(d.id));
  if (userEmail) {
    const byEmail = await getDocs(query(collection(db, 'claims'), where('userEmail', '==', userEmail)));
    byEmail.forEach((d) => claimIds.add(d.id));
  }
  for (const cid of Array.from(claimIds)) {
    const cRef = doc(db, 'claims', cid);
    const cSnap = await getDoc(cRef);
    const c = cSnap.exists() ? (cSnap.data() as any) : null;
    if (c) {
      try {
        (c.photoURLs || []).forEach(async (u: string) => {
          if (typeof u === 'string' && u.startsWith('http')) {
            try { await deleteByUrl(u); } catch {}
          }
        });
      } catch {}
      // Delete messages subcollection
      try {
        const msgs = await getDocs(collection(db, 'claims', cid, 'messages'));
        for (const m of msgs.docs) {
          try { await deleteDoc(doc(db, 'claims', cid, 'messages', m.id)); } catch {}
        }
      } catch {}
    }
    try { await deleteDoc(cRef); } catch {}
  }

  // Finally delete the user document itself
  try { await deleteDoc(userRef); } catch {}
}

// --- Dangerous Operation: Delete a claim and related data ---
export async function deleteClaimEverywhere(claimId: string): Promise<void> {
  const cRef = doc(db, 'claims', claimId);
  const cSnap = await getDoc(cRef);
  const c = cSnap.exists() ? (cSnap.data() as any) : null;
  if (c) {
    try {
      (c.photoURLs || []).forEach(async (u: string) => {
        if (typeof u === 'string' && u.startsWith('http')) {
          try { await deleteByUrl(u); } catch {}
        }
      });
    } catch {}
    try {
      const msgs = await getDocs(collection(db, 'claims', claimId, 'messages'));
      for (const m of msgs.docs) {
        try { await deleteDoc(doc(db, 'claims', claimId, 'messages', m.id)); } catch {}
      }
    } catch {}
  }
  try { await deleteDoc(cRef); } catch {}
}







