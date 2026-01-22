'use client';
import React, { useEffect, useState } from 'react';
import { createClaimDraft, subscribeMyClaims, subscribeMyProfile, subscribeMyVehicles, submitClaim, uploadClaimPhoto } from '@/lib/firebase/memberActions';
import BackButton from '@/components/BackButton';

export default function AccidentRequestPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Claim form state
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [anyInjuries, setAnyInjuries] = useState<string>('');
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    const unsubClaims = subscribeMyClaims(setClaims);
    const unsubVehicles = subscribeMyVehicles(setVehicles);
    const unsubProfile = subscribeMyProfile((p) => {
      setProfile(p);
      if (p?.phoneNumber && !phoneNumber) {
        setPhoneNumber(p.phoneNumber);
      }
    });
    
    return () => {
      unsubClaims();
      unsubVehicles();
      unsubProfile();
    };
  }, []);

  const activeVehicles = vehicles.filter(v => v.isActive);

  const handleNewRequest = () => {
    setShowClaimForm(true);
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !phoneNumber.trim() || !anyInjuries || photos.length === 0) {
      alert('Please fill in all required fields and add at least one photo.');
      return;
    }

    if (phoneNumber.replace(/\D/g, '').length < 10) {
      alert('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    setLoading(true);
    try {
      const vehicle = activeVehicles.find(v => v.id === selectedVehicle);
      if (!vehicle) {
        throw new Error('Selected vehicle not found');
      }

      const claimId = await createClaimDraft(vehicle, profile);

      let photoURLs: string[] = [];
      if (photos.length > 0) {
        setUploadingPhotos(true);
        for (const photo of photos) {
          const url = await uploadClaimPhoto(claimId, photo);
          photoURLs.push(url);
        }
        setUploadingPhotos(false);
      }

      await submitClaim(claimId, {
        amount: 0,
        description: '',
        userPhoneNumber: phoneNumber.trim(),
        photoURLs,
        date: new Date(incidentDate),
        anyInjuries: anyInjuries === 'yes'
      });

      // Reset form
      setSelectedVehicle('');
      setPhoneNumber('');
      setAnyInjuries('');
      setPhotos([]);
      setShowClaimForm(false);
      
      alert('Coupon request submitted successfully!');
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Failed to submit coupon request. Please try again.');
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { bg: string; text: string } } = {
      'Pending': { bg: 'bg-yellow-50', text: 'text-yellow-700' },
      'In Review': { bg: 'bg-blue-50', text: 'text-blue-700' },
      'Approved': { bg: 'bg-green-50', text: 'text-green-700' },
      'Denied': { bg: 'bg-red-50', text: 'text-red-700' }
    };
    
    const colors = statusMap[status] || { bg: 'bg-gray-50', text: 'text-gray-700' };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
        {status}
      </span>
    );
  };

  const isFormValid = selectedVehicle && phoneNumber.trim() && anyInjuries && photos.length > 0;

  if (showClaimForm) {
    return (
      <div className="space-y-4">
        <BackButton />

        <div className="max-w-2xl mx-auto bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">File a Coupon Request</h1>
            <p className="text-sm text-gray-500">Submit your vehicle damage information</p>
          </div>

          <form onSubmit={handleClaimSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle *</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a vehicle</option>
                {activeVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Incident *</label>
              <input
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Required for admin to contact you about this coupon request</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Any Injuries? *</label>
              <select
                value={anyInjuries}
                onChange={(e) => setAnyInjuries(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Required</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photos *Required</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowClaimForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid || loading || uploadingPhotos}
                className="flex-1 bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading || uploadingPhotos ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <BackButton />
        <div className="flex space-x-2">
          <button
            onClick={() => setShowInfo(true)}
            className="text-blue-600 hover:text-blue-700 p-2"
            title="About Coupons"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={handleNewRequest}
            disabled={activeVehicles.length === 0}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Request
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Request a Coupon</h2>
          <p className="text-sm text-gray-500">Only for Active Members</p>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Coupon Requests Yet!</h3>
            <p className="text-sm text-gray-600 mb-4">When you need to make a coupon request, it will appear here.</p>
            
            <div className="inline-flex items-center space-x-2 bg-orange-50 px-4 py-2 rounded-lg border border-orange-100 mt-4">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-xs text-gray-700">Tip: Make sure your vehicle is active to file a coupon request</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)).map((claim) => (
              <a 
                key={claim.id}
                href={`/dashboard/claims/${claim.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    {claim.vehicleYear} {claim.vehicleMake} {claim.vehicleModel}
                  </h3>
                  {getStatusBadge(claim.status)}
                </div>
                
                {claim.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{claim.description}</p>
                )}
                
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {claim.date?.toDate?.()?.toLocaleDateString() || claim.createdAt?.toDate?.()?.toLocaleDateString()}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInfo(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">About Coupons</h3>
              <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">What is Request a Coupon?</h4>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-4 bg-orange-50 p-4 rounded-lg">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">Exclusive Repair Savings</h5>
                    <p className="text-sm text-gray-700">DIP works directly with vetted, trusted collision centers nationwide to bring you exclusive repair coupons worth up to $1,000 towards your vehicle repairs.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-green-50 p-4 rounded-lg">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">Incredible Value</h5>
                    <p className="text-sm text-gray-700">Your DIP membership costs roughly $0.67 per day — that's less than a cup of coffee! And when you need it, you get access to significant savings on repairs.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-blue-50 p-4 rounded-lg">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">Vetted Partners</h5>
                    <p className="text-sm text-gray-700">All our partner collision centers are carefully vetted for quality workmanship and customer service, so you can trust you're getting the best care for your vehicle.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 bg-purple-50 p-4 rounded-lg">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">How It Works</h5>
                    <p className="text-sm text-gray-700">Simply submit a coupon request with your vehicle information and damage details. Once approved, you'll receive your coupon to use at any of our partner locations.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
                <p className="text-sm text-gray-700 text-center mb-2 font-medium">Ready to save on repairs?</p>
                <p className="text-xs text-gray-600 text-center">Tap the + button to submit your first coupon request!</p>
                <p className="text-xs text-gray-500 text-center mt-2">Only members with an active vehicle subscription can request a coupon.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
