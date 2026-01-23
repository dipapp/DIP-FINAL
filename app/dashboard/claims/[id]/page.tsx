'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClaimById, addPhotosToClaim, updateClaimDescription, deleteClaimPhoto, cancelClaim } from '@/lib/firebase/memberActions';
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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
      // iOS uses 'requests' collection
      await updateDoc(doc(db, 'requests', claimId), {
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

  async function handleCancelRequest() {
    setCancelling(true);
    try {
      await cancelClaim(claimId);
      setShowCancelModal(false);
      router.push('/dashboard/claims');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel request');
      setCancelling(false);
      setShowCancelModal(false);
    }
  }

  // Check if claim can be cancelled
  const canCancel = request?.status === 'Pending' || request?.status === 'In Review';

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; icon: string }> = {
      'Pending': { class: 'px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full', icon: '⏳' },
      'In Review': { class: 'px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full', icon: '👀' },
      'Approved': { class: 'px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full', icon: '✅' },
      'Denied': { class: 'px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full', icon: '❌' }
    };
    const config = statusConfig[status] || { class: 'px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full', icon: '❓' };
    return (
      <span className={config.class}>
        {config.icon} {status}
      </span>
    );
  };

  // Status Timeline Component
  const StatusTimeline = ({ status }: { status: string }) => {
    const steps = [
      { key: 'Pending', label: 'Submitted', icon: '📝' },
      { key: 'In Review', label: 'In Review', icon: '👀' },
      { key: 'Approved', label: 'Approved', icon: '✅' },
      { key: 'Denied', label: 'Denied', icon: '❌' },
    ];

    const getStepStatus = (stepKey: string) => {
      const statusOrder = ['Pending', 'In Review', 'Approved', 'Denied'];
      const currentIndex = statusOrder.indexOf(status);
      const stepIndex = statusOrder.indexOf(stepKey);
      
      // Special handling for Approved/Denied - they're mutually exclusive final states
      if (status === 'Approved') {
        if (stepKey === 'Denied') return 'inactive';
        if (stepIndex <= 2) return stepIndex < currentIndex ? 'completed' : (stepIndex === currentIndex ? 'current' : 'inactive');
      }
      if (status === 'Denied') {
        if (stepKey === 'Approved') return 'inactive';
        if (stepIndex <= 1) return 'completed';
        if (stepKey === 'Denied') return 'current';
        return 'inactive';
      }
      
      if (stepIndex < currentIndex) return 'completed';
      if (stepIndex === currentIndex) return 'current';
      return 'inactive';
    };

    const getStepColor = (stepStatus: string, stepKey: string) => {
      if (stepStatus === 'completed') return 'bg-green-500';
      if (stepStatus === 'current') {
        if (stepKey === 'Pending') return 'bg-yellow-500';
        if (stepKey === 'In Review') return 'bg-blue-500';
        if (stepKey === 'Approved') return 'bg-green-500';
        if (stepKey === 'Denied') return 'bg-red-500';
      }
      return 'bg-gray-300';
    };

    const getLineColor = (stepStatus: string) => {
      return stepStatus === 'completed' ? 'bg-green-500' : 'bg-gray-300';
    };

    // Filter steps based on current status - show appropriate final state
    const visibleSteps = status === 'Denied' 
      ? steps.filter(s => s.key !== 'Approved')
      : steps.filter(s => s.key !== 'Denied');

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Status Timeline</h2>
        </div>

        <div className="flex items-center justify-between">
          {visibleSteps.map((step, index) => {
            const stepStatus = getStepStatus(step.key);
            const isLast = index === visibleSteps.length - 1;
            
            return (
              <div key={step.key} className="flex items-center flex-1">
                {/* Step circle and label */}
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${getStepColor(stepStatus, step.key)}`}
                  >
                    {stepStatus === 'completed' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm">{step.icon}</span>
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center ${stepStatus === 'inactive' ? 'text-gray-400' : 'text-gray-700'}`}>
                    {step.label}
                  </span>
                </div>
                
                {/* Connecting line */}
                {!isLast && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-all duration-300 ${getLineColor(stepStatus)}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Status message */}
        <div className="mt-6 p-4 rounded-lg bg-gray-50">
          {status === 'Pending' && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-yellow-600">Your request has been submitted.</span> Our team will review it shortly.
            </p>
          )}
          {status === 'In Review' && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600">Your request is currently being reviewed.</span> We&apos;ll notify you once a decision is made.
            </p>
          )}
          {status === 'Approved' && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-green-600">Great news! Your request has been approved.</span> You will receive further instructions soon.
            </p>
          )}
          {status === 'Denied' && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-red-600">Unfortunately, your request was denied.</span> Please contact support if you have questions.
            </p>
          )}
        </div>
      </div>
    );
  };

  if (isAuthenticated === null) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h3>
        <p className="text-gray-600 mb-4">Please sign in to view claim details.</p>
        <button 
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors" 
          onClick={() => router.push('/auth/sign-in')}
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-600">Loading claim details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors" 
          onClick={() => router.push('/dashboard/claims')}
        >
          Back to Requests
        </button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Not Found</h3>
        <p className="text-gray-600 mb-4">The request you're looking for doesn't exist or you don't have access to it.</p>
        <button 
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors" 
          onClick={() => router.push('/dashboard/claims')}
        >
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
          <h1 className="text-2xl font-bold text-gray-900">Request Details</h1>
        </div>
        {getStatusBadge(request.status)}
      </div>

      {/* Status Timeline */}
      <StatusTimeline status={request.status || 'Pending'} />

      {/* Claim Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Request Information</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Vehicle Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle:</span>
                <span className="font-medium text-gray-900">{request.vehicleYear} {request.vehicleMake} {request.vehicleModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle VIN Number:</span>
                <span className="font-mono text-gray-900">{request.vehicleVin || 'Not provided'}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Request Details</h3>
              {!editingContact && (
                <button 
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setEditingContact(true)}
                >
                  Edit Contact
                </button>
              )}
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Deductible Amount:</span>
                <span className="font-semibold text-gray-900">
                  {request.amount && request.amount > 0 ? `$${request.amount.toFixed(2)}` : 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="text-gray-900">{request.date?.toDate?.()?.toLocaleDateString?.() || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contact:</span>
                {editingContact ? (
                  <div className="flex items-center space-x-2">
                    <input 
                      className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                    <button 
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                      onClick={handleContactUpdate}
                      disabled={uploading}
                    >
                      {uploading ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
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
                  <span className="text-gray-900">{request.userPhoneNumber || 'Not provided'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Description</h2>
          </div>
          {!editingDescription && (
            <button 
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              onClick={() => setEditingDescription(true)}
            >
              Edit
            </button>
          )}
        </div>
        
        {editingDescription ? (
          <div className="space-y-4">
            <textarea 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" 
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened..."
            />
            <div className="flex space-x-3">
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                onClick={handleDescriptionUpdate}
                disabled={uploading}
              >
                {uploading ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
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
          <p className="text-gray-600 bg-gray-50 rounded-lg p-4">
            {request.description || 'No description provided.'}
          </p>
        )}
      </div>

      {/* Photos */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Photos ({request.photoURLs?.length || 0})</h2>
        </div>
        
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
                    className="px-2 py-1 bg-red-600 text-white rounded text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-50"
                  >
                    {deletingPhoto === url ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      '🗑️ Delete'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add More Photos */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add More Photos</h3>
          <div className="space-y-4">
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              onChange={(e) => setNewPhotos(Array.from(e.target.files || []))} 
            />
            {newPhotos.length > 0 && (
              <div className="flex items-center text-sm text-green-600 bg-green-50 rounded-lg p-3">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {newPhotos.length} photo(s) selected
              </div>
            )}
            <button 
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePhotoUpload}
              disabled={newPhotos.length === 0 || uploading}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Photos
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Request Dates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Request Dates</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Created:</span>
              <span className="text-gray-900">{request.createdAt?.toDate?.()?.toLocaleString?.() || 'Unknown'}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Last Updated:</span>
              <span className="text-gray-900">{request.updatedAt?.toDate?.()?.toLocaleString?.() || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Request Section */}
      {canCancel && (
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Cancel Request</h3>
              <p className="text-sm text-gray-600">
                You can cancel this request since it hasn&apos;t been processed yet.
              </p>
            </div>
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel Request
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Cancel Request</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this service request? All photos and information associated with this request will be permanently deleted.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep Request
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {cancelling ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelling...
                  </>
                ) : (
                  'Cancel Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
