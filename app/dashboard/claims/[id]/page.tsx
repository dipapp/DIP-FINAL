'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClaimById, addPhotosToClaim, updateClaimDescription, deleteClaimPhoto } from '@/lib/firebase/memberActions';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import BackButton from '@/components/BackButton';

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const hasLoadedRef = useRef(false);

  async function loadClaim() {
    if (!claimId || hasLoadedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      hasLoadedRef.current = true;
          const requestData = await getClaimById(claimId);
      setRequest(requestData);
      setDescription((requestData as any).description || '');
      setContactPhone((requestData as any).userPhoneNumber || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load request');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    hasLoadedRef.current = false;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const authenticated = !!user;
      setIsAuthenticated(authenticated);
      if (authenticated && claimId && !hasLoadedRef.current) {
        loadClaim();
      }
    });

    return () => unsubscribe();
  }, [claimId]);

  async function handlePhotoUpload() {
    if (newPhotos.length === 0) return;
    
    setUploading(true);
    try {
      await addPhotosToClaim(claimId, newPhotos);
      setNewPhotos([]);
      await loadClaim(); // Reload to get updated photo URLs
    } catch (err: any) {
      setError(err.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  }

  async function handleDescriptionUpdate() {
    setUploading(true);
    try {
      await updateClaimDescription(claimId, description);
      setEditingDescription(false);
      await loadClaim(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || 'Failed to update description');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeletePhoto(photoURL: string) {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    setDeletingPhoto(photoURL);
    try {
      await deleteClaimPhoto(claimId, photoURL);
      await loadClaim(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || 'Failed to delete photo');
    } finally {
      setDeletingPhoto(null);
    }
  }

  async function handleContactUpdate() {
    setUploading(true);
    try {
      await updateDoc(doc(db, 'claims', claimId), {
        userPhoneNumber: contactPhone,
        updatedAt: serverTimestamp(),
      });
      setEditingContact(false);
      await loadClaim(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || 'Failed to update contact information');
    } finally {
      setUploading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; icon: string }> = {
      'Pending': { class: 'badge-warning', icon: '⏳' },
      'In Review': { class: 'badge-info', icon: '👀' },
      'Approved': { class: 'badge-success', icon: '✅' },
      'Denied': { class: 'badge-error', icon: '❌' }
    };
    const config = statusConfig[status] || { class: 'badge-info', icon: '❓' };
    return (
      <span className={`badge ${config.class}`}>
        {config.icon} {status}
      </span>
    );
  };

  if (isAuthenticated === null) {
    return (
      <div className="card text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-muted">Checking authentication...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
        <p className="text-muted mb-4">Please sign in to view claim details.</p>
        <button className="btn btn-primary" onClick={() => router.push('/auth/sign-in')}>
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-muted">Loading claim details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-xl font-semibold mb-2">Error</h3>
        <p className="text-muted mb-4">{error}</p>
        <button className="btn btn-primary" onClick={() => router.push('/dashboard/claims')}>
          Back to Requests
        </button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold mb-2">Request Not Found</h3>
        <p className="text-muted mb-4">The request you're looking for doesn't exist or you don't have access to it.</p>
        <button className="btn btn-primary" onClick={() => router.push('/dashboard/claims')}>
          Back to Requests
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BackButton />
          <h1 className="text-2xl font-bold">Request Details</h1>
        </div>
        {getStatusBadge(request.status)}
      </div>

      {/* Claim Information */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Request Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Vehicle Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Vehicle:</span>
                <span>{request.vehicleYear} {request.vehicleMake} {request.vehicleModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Vehicle VIN Number:</span>
                <span className="font-mono">{request.vehicleVin || 'Not provided'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Request Details</h3>
              {!editingContact && (
                <button 
                  className="btn btn-secondary btn-xs"
                  onClick={() => setEditingContact(true)}
                >
                  Edit Contact
                </button>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Deductible Amount:</span>
                <span className="font-semibold">
                  {request.amount && request.amount > 0 ? `$${request.amount.toFixed(2)}` : 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Date:</span>
                <span>{request.date?.toDate?.()?.toLocaleDateString?.() || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Contact:</span>
                {editingContact ? (
                  <div className="flex items-center space-x-2">
                    <input 
                      className="input input-sm w-32" 
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                    <button 
                      className="btn btn-success btn-xs"
                      onClick={handleContactUpdate}
                      disabled={uploading}
                    >
                      {uploading ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      className="btn btn-secondary btn-xs"
                      onClick={() => {
                        setEditingContact(false);
                        setContactPhone(request.userPhoneNumber || '');
                      }}
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <span>{request.userPhoneNumber || 'Not provided'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Description</h2>
          {!editingDescription && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setEditingDescription(true)}
            >
              Edit
            </button>
          )}
        </div>
        
        {editingDescription ? (
          <div className="space-y-3">
            <textarea 
              className="input w-full" 
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened..."
            />
            <div className="flex space-x-2">
              <button 
                className="btn btn-success btn-sm"
                onClick={handleDescriptionUpdate}
                disabled={uploading}
              >
                {uploading ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditingDescription(false);
                  setDescription(request.description || '');
                }}
                disabled={uploading}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-muted">
            {request.description || 'No description provided.'}
          </p>
        )}
      </div>

      {/* Photos */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Photos ({request.photoURLs?.length || 0})</h2>
        
        {/* Existing Photos */}
        {request.photoURLs && request.photoURLs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {request.photoURLs.map((url: string, index: number) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                <img 
                  src={url} 
                  alt={`Claim photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(url);
                    }}
                    disabled={deletingPhoto === url}
                    className="btn btn-error btn-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    {deletingPhoto === url ? (
                      <div className="loading-spinner"></div>
                    ) : (
                      '🗑️'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add More Photos */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Add More Photos</h3>
          <div className="space-y-3">
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              className="input" 
              onChange={(e) => setNewPhotos(Array.from(e.target.files || []))} 
            />
            {newPhotos.length > 0 && (
              <div className="text-sm text-green-600">
                ✓ {newPhotos.length} photo(s) selected
              </div>
            )}
            <button 
              className="btn btn-primary"
              onClick={handlePhotoUpload}
              disabled={newPhotos.length === 0 || uploading}
            >
              {uploading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  📸 Upload Photos
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Timeline</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Created:</span>
            <span>{request.createdAt?.toDate?.()?.toLocaleString?.() || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Last Updated:</span>
            <span>{request.updatedAt?.toDate?.()?.toLocaleString?.() || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
