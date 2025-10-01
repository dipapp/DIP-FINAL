'use client';
import React, { useEffect, useState } from 'react';
import { createClaimDraft, subscribeMyClaims, subscribeMyProfile, subscribeMyVehicles, submitClaim, uploadClaimPhoto } from '@/lib/firebase/memberActions';
import BackButton from '@/components/BackButton';

export default function AccidentRequestPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [showEmergencyWorkflow, setShowEmergencyWorkflow] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Emergency workflow state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Claim form state
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  const emergencySteps = [
    {
      title: "Call 911 if needed",
      subtitle: "If anyone is injured",
      icon: "phone",
      description: "Call emergency services if there are injuries or major damage.",
      actionText: "Called / Not needed"
    },
    {
      title: "Contact a tow service",
      subtitle: "If your vehicle is disabled",
      icon: "truck",
      description: "Call a local towing service for assistance if your vehicle cannot be driven.",
      actionText: "Called / Not needed"
    },
    {
      title: "File your claim",
      subtitle: "Submit to DIP",
      icon: "document-text",
      description: "Submit your claim to DIP with photos and incident details.",
      actionText: "File claim now"
    }
  ];

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

  const activeVehicles = vehicles.filter(v => v.isActive);

  const handleEmergencyStart = () => {
    setShowEmergencyWorkflow(true);
    setCurrentStep(0);
    setCompletedSteps(new Set());
  };

  const handleStepComplete = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep);
    setCompletedSteps(newCompleted);

    if (currentStep < emergencySteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // All steps completed, show claim form
      setShowEmergencyWorkflow(false);
      setShowClaimForm(true);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !amount || !description.trim() || !location.trim() || !phoneNumber.trim()) {
      alert('Please fill in all required fields.');
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
        amount: parseFloat(amount),
        description: `${description.trim()}\n\nLocation: ${location.trim()}`,
        userPhoneNumber: phoneNumber.trim(),
        photoURLs,
        date: new Date(incidentDate)
      });

      // Reset form
      setSelectedVehicle('');
      setAmount('');
      setDescription('');
      setLocation('');
      setPhoneNumber('');
      setPhotos([]);
      setShowClaimForm(false);
      
      alert('Accident claim submitted successfully!');
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Failed to submit claim. Please try again.');
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
    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Assigned': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-orange-100 text-orange-800',
      'Completed': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (showEmergencyWorkflow) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            {emergencySteps.map((_, index) => (
              <React.Fragment key={index}>
                <div className={`w-3 h-3 rounded-full ${index <= currentStep ? 'bg-green-500' : 'bg-gray-300'}`} />
                {index < emergencySteps.length - 1 && (
                  <div className={`w-8 h-0.5 ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {currentStep < emergencySteps.length ? (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {emergencySteps[currentStep].icon === 'phone' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      )}
                      {emergencySteps[currentStep].icon === 'truck' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1m-1-1V8a1 1 0 00-1-1H9m4 8V8a1 1 0 00-1-1H9" />
                      )}
                      {emergencySteps[currentStep].icon === 'document-text' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      )}
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {emergencySteps[currentStep].title}
                  </h2>
                  <p className="text-lg text-gray-600 mb-4">
                    {emergencySteps[currentStep].subtitle}
                  </p>
                </div>

                <p className="text-gray-700 mb-8">
                  {emergencySteps[currentStep].description}
                </p>

                {currentStep === 0 && (
                  <div className="mb-6">
                    <a 
                      href="tel:911" 
                      className="inline-flex items-center bg-red-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call 911
                    </a>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="mb-6">
                    <a 
                      href="tel:7147661669" 
                      className="inline-flex items-center bg-yellow-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call Tow Service (714-766-1669)
                    </a>
                  </div>
                )}

                <button
                  onClick={handleStepComplete}
                  className="w-full bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {emergencySteps[currentStep].actionText}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Emergency steps completed
                </h2>
                <p className="text-gray-700 mb-8">
                  You've handled the immediate situation. Now let's file your claim with all the details.
                </p>
                <button
                  onClick={() => {
                    setShowEmergencyWorkflow(false);
                    setShowClaimForm(true);
                  }}
                  className="w-full bg-green-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-green-700 transition-colors"
                >
                  File Claim Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showClaimForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">File Accident Claim</h1>
              <p className="text-gray-600">Provide details about your accident to submit your claim.</p>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Vehicle *
                </label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a vehicle</option>
                  {activeVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Incident *
                </label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Damage Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="$0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location of Incident *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Street address, city, state"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened, including any injuries or damage..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowClaimForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingPhotos}
                  className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading || uploadingPhotos ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton />
        <button
          onClick={handleEmergencyStart}
          className="bg-red-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          I'm in an Accident
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your Accident Claims</h2>
            <p className="text-gray-600">Track and manage your accident claims</p>
          </div>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Claims Yet</h3>
            <p className="text-gray-600 mb-6">If you're in an accident, use the emergency button above to get help and file a claim.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div key={claim.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Accident Claim</h3>
                  {getStatusBadge(claim.status)}
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1m-1-1V8a1 1 0 00-1-1H9" />
                    </svg>
                    Vehicle: {claim.vehicleYear} {claim.vehicleMake} {claim.vehicleModel}
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location: {claim.location || 'Not specified'}
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submitted: {claim.createdAt?.toDate?.()?.toLocaleString() || 'Unknown'}
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <a 
                    href={`/dashboard/claims/${claim.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
