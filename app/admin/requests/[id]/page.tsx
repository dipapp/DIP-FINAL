'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { subscribeClaims, updateClaimStatus } from '@/lib/firebase/adminActions';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';

export default function AdminRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = Array.isArray(params?.id) ? params?.id[0] : (params as any)?.id;
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [vehicleVin, setVehicleVin] = useState<string | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [assigningProvider, setAssigningProvider] = useState(false);

  const allStatuses = ['Pending', 'In Review', 'Approved', 'Denied'] as const;

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return;
    try {
      setSaving(true);
      // Optimistic UI update
      setRequest({ ...request, status: newStatus });
      await updateClaimStatus(request.id, newStatus as any);
    } finally {
      setSaving(false);
    }
  };

  const handleProviderAssignment = async (providerId: string) => {
    if (!request) return;
    try {
      setAssigningProvider(true);
      await updateDoc(doc(db, 'claims', request.id), {
        assignedProviderId: providerId,
        assignedProviderName: providers.find(p => p.id === providerId)?.businessName,
        assignedAt: new Date(),
        updatedAt: new Date(),
      });
      // Update local state
      setRequest({ 
        ...request, 
        assignedProviderId: providerId,
        assignedProviderName: providers.find(p => p.id === providerId)?.businessName,
        assignedAt: new Date(),
      });
    } catch (error) {
      console.error('Error assigning provider:', error);
    } finally {
      setAssigningProvider(false);
    }
  };

  const loadProviders = async () => {
    try {
      const providersSnapshot = await getDocs(collection(db, 'providers'));
      const providersData = providersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Only show approved providers
      const approvedProviders = providersData.filter(p => p.status === 'approved');
      setProviders(approvedProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  useEffect(() => {
    if (!requestId) return;
    // Reuse subscribeClaims and pick the one we need
    const unsub = subscribeClaims((all) => {
      const found = all.find((r) => r.id === requestId) || null;
      setRequest(found);
      setLoading(false);
    });
    return () => { try { (unsub as any)(); } catch {} };
  }, [requestId]);

  useEffect(() => {
    loadProviders();
  }, []);

  // Handle ESC key to close expanded photo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedPhoto) {
        setExpandedPhoto(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expandedPhoto]);

  // Load VIN for the vehicle on this request
  useEffect(() => {
    const loadVin = async () => {
      try {
        if (!request?.vehicleId) return;
        const snap = await getDoc(doc(db, 'vehicles', request.vehicleId));
        const vin = (snap.data() as any)?.vin || null;
        setVehicleVin(vin);
      } catch {
        setVehicleVin(null);
      }
    };
    loadVin();
  }, [request?.vehicleId]);

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-muted">Loading request...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">Request not found</h1>
        <button onClick={() => router.back()} className="btn btn-secondary">Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold">Request #{request.id?.slice(-8)}</h1>
          <button onClick={() => router.back()} className="btn btn-secondary">Back</button>
        </div>
        <p className="text-muted">Submitted on {request.createdAt?.toDate?.()?.toLocaleString?.() || request.date?.toDate?.()?.toLocaleString?.() || '—'}</p>
      </div>

      <div className="card grid md:grid-cols-2 gap-4">
        <div>
          <h2 className="font-semibold mb-2">Member</h2>
          <div>{request.userFirstName} {request.userLastName}</div>
          <div className="text-sm text-muted">{request.userEmail}</div>
          {request.userPhoneNumber && (
            <div className="text-sm">{request.userPhoneNumber}</div>
          )}
        </div>
        <div>
          <h2 className="font-semibold mb-2">Vehicle</h2>
          <div className="font-medium">{request.vehicleYear} {request.vehicleMake} {request.vehicleModel}</div>
          <div className="text-sm text-muted">{vehicleVin || request.vin || '—'}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Details</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted">Amount</div>
            <div className="font-semibold">${request.amount?.toFixed?.(2) || '0.00'}</div>
          </div>
          <div>
            <div className="text-muted">Status</div>
            <div className="flex items-center gap-3">
              <span className={`badge ${
                request.status === 'Approved' ? 'badge-success' :
                request.status === 'Denied' ? 'badge-error' :
                request.status === 'In Review' ? 'badge-info' : 'badge-warning'
              }`}>{request.status}</span>
              <select
                className="input max-w-xs"
                value={request.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={saving}
              >
                {allStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="text-xs text-muted">{saving ? 'Updating…' : ''}</span>
            </div>
          </div>
          <div>
            <div className="text-muted">Updated</div>
            <div>{request.updatedAt?.toDate?.()?.toLocaleString?.() || '—'}</div>
          </div>
        </div>
        {request.description && (
          <div className="mt-4">
            <div className="text-muted mb-1">Description</div>
            <p>{request.description}</p>
          </div>
        )}
      </div>

      {/* Provider Assignment Section */}
      <div className="card">
        <h2 className="font-semibold mb-3">Provider Assignment</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Provider
            </label>
            <select
              className="input max-w-xs"
              value={request?.assignedProviderId || ''}
              onChange={(e) => handleProviderAssignment(e.target.value)}
              disabled={assigningProvider}
            >
              <option value="">Select Provider</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.businessName} - {provider.contactPerson}
                </option>
              ))}
            </select>
            {assigningProvider && (
              <span className="text-xs text-muted ml-2">Assigning...</span>
            )}
          </div>
          <div>
            <div className="text-sm text-muted">Currently Assigned</div>
            <div className="font-medium">
              {request?.assignedProviderName || 'No provider assigned'}
            </div>
            {request?.assignedAt && (
              <div className="text-xs text-muted">
                Assigned: {request.assignedAt.toDate?.()?.toLocaleString?.() || '—'}
              </div>
            )}
          </div>
        </div>
        {providers.length === 0 && (
          <div className="mt-2 text-sm text-yellow-600">
            No approved providers available. <Link href="/admin/providers" className="text-blue-600 hover:text-blue-700">Manage providers</Link>
          </div>
        )}
      </div>

      {/* Photos Section */}
      {request.photoURLs && request.photoURLs.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3">Photos ({request.photoURLs.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {request.photoURLs.map((photoUrl: string, index: number) => (
              <div 
                key={index} 
                className="relative group cursor-pointer"
                onClick={() => {
                  console.log('Photo clicked:', photoUrl);
                  setExpandedPhoto(photoUrl);
                }}
              >
                <img
                  src={photoUrl}
                  alt={`Request photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center pointer-events-none">
                  <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                    Click to expand
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Photo Modal */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={expandedPhoto}
              alt="Expanded photo"
              className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{ maxWidth: '95vw', maxHeight: '95vh' }}
            />
            <button
              onClick={() => setExpandedPhoto(null)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


