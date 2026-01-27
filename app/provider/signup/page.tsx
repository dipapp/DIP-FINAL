'use client';
import React, { FormEvent, useState, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

// Declare google namespace for TypeScript
declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

export default function ProviderSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: boolean}>({});

  // File states
  const [coiFile, setCoiFile] = useState<File | null>(null);
  const [barLicenseFile, setBarLicenseFile] = useState<File | null>(null);
  const [w9File, setW9File] = useState<File | null>(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);

  // Load Google Places API
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not configured');
      return;
    }

    // Check if already loaded
    if (window.google?.maps?.places) {
      setGoogleLoaded(true);
      return;
    }

    // Create callback for when script loads
    window.initGooglePlaces = () => {
      setGoogleLoaded(true);
    };

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Initialize autocomplete when Google is loaded and on step 1
  useEffect(() => {
    if (!googleLoaded || currentStep !== 1 || !addressInputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      componentRestrictions: { country: 'us' },
      fields: ['address_components', 'formatted_address'],
      types: ['address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      let streetNumber = '';
      let route = '';
      let city = '';
      let state = '';
      let zipCode = '';

      for (const component of place.address_components) {
        const type = component.types[0];
        switch (type) {
          case 'street_number':
            streetNumber = component.long_name;
            break;
          case 'route':
            route = component.long_name;
            break;
          case 'locality':
            city = component.long_name;
            break;
          case 'administrative_area_level_1':
            state = component.short_name;
            break;
          case 'postal_code':
            zipCode = component.long_name;
            break;
        }
      }

      // Update form data
      setFormData(prev => ({
        ...prev,
        address: `${streetNumber} ${route}`.trim(),
        city,
        state,
        zipCode,
      }));
    });
  }, [googleLoaded, currentStep]);

  const generateProviderId = async (): Promise<string> => {
    let providerId: string;
    let isUnique = false;
    
    while (!isUnique) {
      // Generate 6-digit number
      providerId = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Check if this ID already exists
      try {
        const providersQuery = query(
          collection(db, 'providers'),
          where('providerId', '==', providerId)
        );
        const snapshot = await getDocs(providersQuery);
        isUnique = snapshot.empty;
      } catch (err) {
        console.error('Error checking provider ID uniqueness:', err);
        // If error, assume it's unique to avoid infinite loop
        isUnique = true;
      }
    }
    
    return providerId!;
  };

  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    try {
      const providersQuery = query(
        collection(db, 'providers'),
        where('email', '==', emailToCheck)
      );
      const providersSnapshot = await getDocs(providersQuery);
      
      return !providersSnapshot.empty;
    } catch (err) {
      console.error('Error checking email existence:', err);
      return false;
    }
  };

  const [formData, setFormData] = useState({
    // Step 1: Business & Contact Information
    businessName: '',
    legalEntityName: '',
    yearsInBusiness: '',
    website: '',
    contactPerson: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Step 2: Agreements
    agreedToTerms: false,
    agreedToBackgroundCheck: false,
    agreedToCompliance: false,
    agreedToIndependentContractor: false,
    agreedToIndemnification: false,
    agreedToArbitration: false,
    agreedToDataUse: false,
    acknowledgedNoGuarantees: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF, JPG, and PNG files are allowed');
        return;
      }
      setError(null);
      setter(file);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate all steps before submission
    if (!validateStep(1) || !validateStep(2)) {
      setError('Please fill out all required fields before submitting.');
      setLoading(false);
      return;
    }

    // Check required documents
    if (!coiFile) {
      setError('Certificate of Insurance (COI) is required.');
      setLoading(false);
      return;
    }
    if (!w9File) {
      setError('W-9 Form is required.');
      setLoading(false);
      return;
    }
    if (!businessLicenseFile) {
      setError('City Business License is required.');
      setLoading(false);
      return;
    }

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        setError('An application with this email already exists. Please use a different email or contact support if you need to update your application.');
        setLoading(false);
        return;
      }

      // Generate unique 6-digit Provider ID
      const providerId = await generateProviderId();
      const timestamp = Date.now();

      // Upload documents
      setUploadProgress({ coi: true });
      const coiUrl = await uploadFile(coiFile, `provider-documents/${providerId}/coi-${timestamp}.${coiFile.name.split('.').pop()}`);
      
      setUploadProgress({ coi: false, w9: true });
      const w9Url = await uploadFile(w9File, `provider-documents/${providerId}/w9-${timestamp}.${w9File.name.split('.').pop()}`);
      
      setUploadProgress({ w9: false, businessLicense: true });
      const businessLicenseUrl = await uploadFile(businessLicenseFile, `provider-documents/${providerId}/business-license-${timestamp}.${businessLicenseFile.name.split('.').pop()}`);
      
      let barLicenseUrl = null;
      if (barLicenseFile) {
        setUploadProgress({ businessLicense: false, barLicense: true });
        barLicenseUrl = await uploadFile(barLicenseFile, `provider-documents/${providerId}/bar-license-${timestamp}.${barLicenseFile.name.split('.').pop()}`);
      }
      
      setUploadProgress({});

      const providerData = {
        ...formData,
        providerId: providerId,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        yearsInBusiness: parseInt(formData.yearsInBusiness),
        documents: {
          certificateOfInsurance: coiUrl,
          w9Form: w9Url,
          businessLicense: businessLicenseUrl,
          barLicense: barLicenseUrl,
        }
      };

      await addDoc(collection(db, 'providers'), providerData);
      
      // Send email notification to admin
      try {
        await fetch('/api/send-provider-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            providerId: providerId,
            yearsInBusiness: parseInt(formData.yearsInBusiness),
          }),
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }
      
      // Redirect to success page
      router.push('/provider/signup/success');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit application');
    } finally {
      setLoading(false);
      setUploadProgress({});
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.businessName &&
          formData.legalEntityName &&
          formData.yearsInBusiness &&
          formData.website &&
          formData.contactPerson &&
          formData.email &&
          formData.phone &&
          formData.address &&
          formData.city &&
          formData.state &&
          formData.zipCode
        );
      case 2:
        return !!(
          formData.agreedToTerms &&
          formData.agreedToBackgroundCheck &&
          formData.agreedToCompliance &&
          formData.agreedToIndependentContractor &&
          formData.agreedToIndemnification &&
          formData.agreedToArbitration &&
          formData.agreedToDataUse &&
          formData.acknowledgedNoGuarantees &&
          coiFile &&
          w9File &&
          businessLicenseFile
        );
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 2 && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setError(null);
    } else if (!validateStep(currentStep)) {
      setError('Please fill out all required fields before proceeding.');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Become a DIP Provider
            </h1>
            <p className="text-gray-600">
              Join our network of approved service providers
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step === 1 ? 'Business Info' : 'Documents & Agreement'}
                  </span>
                  {step < 2 && (
                    <div className={`w-16 h-1 mx-4 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Business & Contact Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Business & Contact Information</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Legal Entity Name *
                    </label>
                    <input
                      type="text"
                      name="legalEntityName"
                      value={formData.legalEntityName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years in Business *
                    </label>
                    <input
                      type="number"
                      name="yearsInBusiness"
                      value={formData.yearsInBusiness}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website *
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://www.example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alternate Phone
                      </label>
                      <input
                        type="tel"
                        name="alternatePhone"
                        value={formData.alternatePhone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Business Address</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Address *
                    </label>
                    <input
                      ref={addressInputRef}
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder={googleLoaded ? "Start typing address..." : "Enter address"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    {googleLoaded && (
                      <p className="text-xs text-gray-500 mt-1">Start typing to search for your address</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select State</option>
                        <option value="CA">California</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Documents & Agreement */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Documents & Service Provider Agreement</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Upload required documents and review the service provider agreement.
                </p>

                {/* Document Uploads */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Required Documents</h3>
                  <p className="text-sm text-gray-600 mb-4">Upload PDF, JPG, or PNG files (max 10MB each)</p>
                  
                  <div className="space-y-4">
                    {/* Certificate of Insurance */}
                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${coiFile ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {coiFile ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Certificate of Insurance (COI) *</p>
                          {coiFile ? (
                            <p className="text-sm text-green-600">{coiFile.name}</p>
                          ) : (
                            <p className="text-sm text-gray-500">Required - Proof of liability insurance</p>
                          )}
                        </div>
                      </div>
                      <label className="cursor-pointer">
                        <span className={`px-4 py-2 rounded-lg text-sm font-medium ${coiFile ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                          {coiFile ? 'Change' : 'Upload'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, setCoiFile)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* W-9 Form */}
                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${w9File ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {w9File ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">W-9 Form *</p>
                          {w9File ? (
                            <p className="text-sm text-green-600">{w9File.name}</p>
                          ) : (
                            <p className="text-sm text-gray-500">Required - IRS tax form</p>
                          )}
                        </div>
                      </div>
                      <label className="cursor-pointer">
                        <span className={`px-4 py-2 rounded-lg text-sm font-medium ${w9File ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                          {w9File ? 'Change' : 'Upload'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, setW9File)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* City Business License */}
                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${businessLicenseFile ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {businessLicenseFile ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">City Business License *</p>
                          {businessLicenseFile ? (
                            <p className="text-sm text-green-600">{businessLicenseFile.name}</p>
                          ) : (
                            <p className="text-sm text-gray-500">Required - Valid business license</p>
                          )}
                        </div>
                      </div>
                      <label className="cursor-pointer">
                        <span className={`px-4 py-2 rounded-lg text-sm font-medium ${businessLicenseFile ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                          {businessLicenseFile ? 'Change' : 'Upload'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, setBusinessLicenseFile)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Bar License (Optional) */}
                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${barLicenseFile ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {barLicenseFile ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Bar License</p>
                          {barLicenseFile ? (
                            <p className="text-sm text-green-600">{barLicenseFile.name}</p>
                          ) : (
                            <p className="text-sm text-gray-500">Optional - For legal service providers</p>
                          )}
                        </div>
                      </div>
                      <label className="cursor-pointer">
                        <span className={`px-4 py-2 rounded-lg text-sm font-medium ${barLicenseFile ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                          {barLicenseFile ? 'Change' : 'Upload'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, setBarLicenseFile)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Scrollable Terms Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Provider Agreement Summary</h3>
                    <a 
                      href="/provider/terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Read Full Agreement →
                    </a>
                  </div>
                  <div className="h-48 overflow-y-auto text-sm text-gray-700 space-y-3 pr-2">
                    <p><strong>Independent Contractor Status:</strong> You are an independent contractor, not an employee of DIP. You are solely responsible for all taxes, insurance, and business expenses.</p>
                    <p><strong>Licensing & Insurance:</strong> You must maintain all required licenses, permits, and insurance coverage throughout your relationship with DIP.</p>
                    <p><strong>Indemnification:</strong> You agree to indemnify and hold harmless DIP from all claims, damages, and liabilities arising from your services, conduct, or breach of this agreement.</p>
                    <p><strong>Limitation of Liability:</strong> DIP&apos;s maximum liability is limited to $100 or fees paid in the prior 12 months. DIP is not liable for any indirect, consequential, or punitive damages.</p>
                    <p><strong>No Guarantees:</strong> DIP does not guarantee any minimum referrals, work volume, or income. Participation does not guarantee business.</p>
                    <p><strong>Binding Arbitration:</strong> All disputes will be resolved through binding arbitration in Los Angeles County, California. You waive your right to jury trial and class action participation.</p>
                    <p><strong>Termination:</strong> DIP may terminate your participation at any time, for any reason, with or without notice.</p>
                    <p><strong>Data Use:</strong> Your information will be shared with DIP members and used for verification, communication, and platform operations.</p>
                  </div>
                </div>

                {/* Required Agreements */}
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Required Agreements</h3>
                  <p className="text-sm text-gray-600 mb-4">You must agree to all of the following to submit your application:</p>
                  
                  <div className="space-y-4">
                    {/* Terms and Privacy */}
                    <div className="flex items-start space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        name="agreedToTerms"
                        checked={formData.agreedToTerms}
                        onChange={handleInputChange}
                        className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        required
                      />
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">Terms of Service & Privacy Policy</p>
                        <p className="text-gray-600">
                          I have read and agree to the <a href="/provider/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">DIP Service Provider Agreement</a>, <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">Terms of Service</a>, and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</a>.
                        </p>
                      </div>
                    </div>

                    {/* Independent Contractor */}
                    <div className="flex items-start space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        name="agreedToIndependentContractor"
                        checked={formData.agreedToIndependentContractor}
                        onChange={handleInputChange}
                        className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        required
                      />
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">Independent Contractor Status</p>
                        <p className="text-gray-600">
                          I understand and acknowledge that I am an independent contractor, not an employee of DIP. I am solely responsible for all taxes, insurance, employee benefits, and business expenses. I have no authority to bind DIP or act as its agent.
                        </p>
                      </div>
                    </div>

                    {/* Background Check */}
                    <div className="flex items-start space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        name="agreedToBackgroundCheck"
                        checked={formData.agreedToBackgroundCheck}
                        onChange={handleInputChange}
                        className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        required
                      />
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">Background Check & Verification Consent</p>
                        <p className="text-gray-600">
                          I consent to background checks including criminal history, credit history, professional license verification, and reference checks. I confirm that all information provided in this application is true, accurate, and complete.
                        </p>
                      </div>
                    </div>

                    {/* Indemnification */}
                    <div className="flex items-start space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        name="agreedToIndemnification"
                        checked={formData.agreedToIndemnification}
                        onChange={handleInputChange}
                        className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        required
                      />
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">Indemnification & Hold Harmless</p>
                        <p className="text-gray-600">
                          I agree to indemnify, defend, and hold harmless DIP, its officers, directors, employees, and affiliates from any claims, damages, losses, liabilities, and expenses arising from my services, conduct, breach of agreement, or violation of laws.
                        </p>
                      </div>
                    </div>

                    {/* Arbitration */}
                    <div className="flex items-start space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        name="agreedToArbitration"
                        checked={formData.agreedToArbitration}
                        onChange={handleInputChange}
                        className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        required
                      />
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">Binding Arbitration & Class Action Waiver</p>
                        <p className="text-gray-600">
                          I agree that all disputes will be resolved through binding arbitration in Los Angeles County, California. <strong>I waive my right to a jury trial and my right to participate in any class action lawsuit.</strong>
                        </p>
                      </div>
                    </div>

                    {/* Data Use */}
                    <div className="flex items-start space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        name="agreedToDataUse"
                        checked={formData.agreedToDataUse}
                        onChange={handleInputChange}
                        className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        required
                      />
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">Data Use & Sharing Consent</p>
                        <p className="text-gray-600">
                          I consent to DIP collecting, using, and sharing my business information with DIP members, verification services, and service providers as described in the Privacy Policy.
                        </p>
                      </div>
                    </div>

                    {/* Compliance */}
                    <div className="flex items-start space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        name="agreedToCompliance"
                        checked={formData.agreedToCompliance}
                        onChange={handleInputChange}
                        className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        required
                      />
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">Provider Standards & Compliance</p>
                        <p className="text-gray-600">
                          I agree to maintain all required licenses, insurance, and credentials. I will perform services professionally and comply with all applicable laws, regulations, and DIP provider standards.
                        </p>
                      </div>
                    </div>

                    {/* No Guarantees */}
                    <div className="flex items-start space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        name="acknowledgedNoGuarantees"
                        checked={formData.acknowledgedNoGuarantees}
                        onChange={handleInputChange}
                        className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        required
                      />
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">No Guarantee of Business</p>
                        <p className="text-gray-600">
                          I understand that DIP does not guarantee any minimum volume of referrals, work, or income. DIP may terminate my participation at any time, for any reason, with or without notice.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Acknowledgment */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm">
                      <p className="text-yellow-800 font-medium">Important Legal Notice</p>
                      <p className="text-yellow-700 mt-1">
                        By submitting this application, you are entering into a legally binding agreement. This agreement contains limitations of liability, indemnification obligations, and a binding arbitration provision with class action waiver. We recommend consulting with legal counsel before agreeing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    validateStep(currentStep)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !validateStep(2)}
                  className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    loading || !validateStep(2)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>
                        {uploadProgress.coi ? 'Uploading COI...' : 
                         uploadProgress.w9 ? 'Uploading W-9...' :
                         uploadProgress.businessLicense ? 'Uploading License...' :
                         uploadProgress.barLicense ? 'Uploading Bar License...' :
                         'Submitting...'}
                      </span>
                    </>
                  ) : (
                    <span>Submit Application</span>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
