'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { createClaimDraft, subscribeMyClaims, subscribeMyProfile, subscribeMyVehicles, submitClaim, uploadClaimPhoto } from '@/lib/firebase/memberActions';
import BackButton from '@/components/BackButton';

export default function MyRequestsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [claimType, setClaimType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    const unsubClaims = subscribeMyClaims(setClaims);
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
    if (!selectedVehicle || !claimType || !description.trim() || !location.trim()) {
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

      // Submit the claim with all data
      await submitClaim(claimId, {
        amount: 0,
        description: description.trim(),
        userPhoneNumber: profile?.phoneNumber || '',
        photoURLs,
      });

      // Reset form
      setSelectedVehicle('');
      setClaimType('');
      setDescription('');
      setLocation('');
      setPhotos([]);
      setShowForm(false);
      
      alert('Service request submitted successfully!');
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'in-progress':
        return <span className="badge badge-info">In Progress</span>;
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'cancelled':
        return <span className="badge badge-error">Cancelled</span>;
      default:
        return <span className="badge badge-gray">Unknown</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton />
        {activeVehicles.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
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
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Submit Service Request</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleSubmit} className="form-group">
              <div>
                <label className="label">Select Vehicle</label>
                <select
                  className="input"
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
                <label className="label">Type of Assistance</label>
                <select
                  className="input"
                  value={claimType}
                  onChange={(e) => setClaimType(e.target.value)}
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

              <div>
                <label className="label">Current Location</label>
                <input
                  type="text"
                  className="input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Street address or nearest intersection"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the situation and any relevant details..."
                  required
                />
              </div>

              <div>
                <label className="label">Photos (Optional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">Upload photos to help us understand the situation better</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingPhotos}
                  className="btn btn-primary"
                >
                  {loading || uploadingPhotos ? (
                    <div className="flex items-center">
                      <div className="loading-spinner mr-2"></div>
                      {uploadingPhotos ? 'Uploading Photos...' : 'Submitting...'}
                    </div>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* No Vehicles Message */}
      {activeVehicles.length === 0 && (
        <div className="card card-body text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Vehicles</h3>
          <p className="text-gray-600 mb-6">You need to add and activate vehicles before submitting service requests.</p>
          <a href="/dashboard/vehicles" className="btn btn-primary">
            Add Vehicle
          </a>
        </div>
      )}

      {/* Claims List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Your Service Requests</h2>
        </div>
        <div className="card-body">
          {claims.length > 0 ? (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div key={claim.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{claim.type}</h3>
                        {getStatusBadge(claim.status)}
                      </div>
                      <p className="text-gray-600 mb-2">{claim.description}</p>
                      <div className="text-sm text-gray-500">
                        <div>Location: {claim.location}</div>
                        <div>Submitted: {claim.createdAt?.toDate?.()?.toLocaleString?.()}</div>
                      </div>
                    </div>
                    <a
                      href={`/dashboard/claims/${claim.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      View Details →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Service Requests</h3>
              <p className="text-gray-600">You haven't submitted any service requests yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}