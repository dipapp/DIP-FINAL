'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { createClaimDraft, subscribeMyClaims, subscribeMyProfile, subscribeMyVehicles, submitClaim, uploadClaimPhoto } from '@/lib/firebase/memberActions';
import BackButton from '@/components/BackButton';

export default function MyRequestsPage() {
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [requestType, setRequestType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    const unsubClaims = subscribeMyClaims(setServiceRequests);
    const unsubVehicles = subscribeMyVehicles(setVehicles);
    const unsubProfile = subscribeMyProfile(setProfile);
    
    return () => {
      unsubClaims();
      unsubVehicles();
      unsubProfile();
    };
  }, []);

  const activeVehicles = useMemo(() => 
    vehicles.filter(v => v.isActive), 
    [vehicles]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !requestType || !description.trim() || !location.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      // Find the selected vehicle
      const vehicle = activeVehicles.find(v => v.id === selectedVehicle);
      if (!vehicle) {
        throw new Error('Selected vehicle not found');
      }

      // Create claim draft first
      const claimId = await createClaimDraft(vehicle, profile);

      // Upload photos if any
      let photoURLs: string[] = [];
      if (photos.length > 0) {
        setUploadingPhotos(true);
        for (const photo of photos) {
          const url = await uploadClaimPhoto(claimId, photo);
          photoURLs.push(url);
        }
        setUploadingPhotos(false);
      }

      // Submit the service request with all data
      await submitClaim(claimId, {
        amount: 0,
        description: description.trim(),
        userPhoneNumber: profile?.phoneNumber || '',
        photoURLs,
      });

      // Reset form
      setSelectedVehicle('');
      setRequestType('');
      setDescription('');
      setLocation('');
      setPhotos([]);
      setShowForm(false);
      
      alert('Service request submitted successfully!');
    } catch (error) {
      console.error('Error submitting service request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      case 'In Review':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">In Review</span>;
      case 'Approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Approved</span>;
      case 'Denied':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Denied</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status || 'Pending'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton />
        {activeVehicles.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Service Request
          </button>
        )}
      </div>

      {/* Service Request Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Submit Service Request</h2>
                <p className="text-gray-600">Get help with your vehicle</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Vehicle</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  required
                >
                  <option value="">Choose a vehicle...</option>
                  {activeVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.licensePlate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type of Assistance</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  required
                >
                  <option value="">Select service type...</option>
                  <option value="towing">Towing</option>
                  <option value="battery">Battery Jump</option>
                  <option value="lockout">Lockout Assistance</option>
                  <option value="flat-tire">Flat Tire</option>
                  <option value="fuel">Out of Fuel</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Street address or nearest intersection"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the situation and any relevant details..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photos (Optional)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Upload photos to help us understand the situation better</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingPhotos}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || uploadingPhotos ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploadingPhotos ? 'Uploading Photos...' : 'Submitting...'}
                  </div>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* No Vehicles Message */}
      {activeVehicles.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Vehicles</h3>
          <p className="text-gray-600 mb-6">You need to add and activate vehicles before submitting service requests.</p>
          <a href="/dashboard/vehicles" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Vehicle
          </a>
        </div>
      )}

      {/* Claims List */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">Your Requests</h2>
            <span className="text-sm text-gray-500">({serviceRequests.length})</span>
          </div>
        </div>
        
        {serviceRequests.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {serviceRequests.map((request) => (
              <div key={request.id} className="py-3 flex items-center justify-between hover:bg-gray-50 -mx-4 px-4 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm truncate">
                      {request.vehicleYear} {request.vehicleMake} {request.vehicleModel}
                    </span>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{request.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Unknown date'}</span>
                    {request.description && (
                      <span className="truncate max-w-[200px]">{request.description}</span>
                    )}
                  </div>
                </div>
                <a
                  href={`/dashboard/claims/${request.id}`}
                  className="ml-4 text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                >
                  View →
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 text-sm">No service requests yet</p>
          </div>
        )}
      </div>
    </div>
  );
}