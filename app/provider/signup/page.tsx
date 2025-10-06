'use client';
import React, { FormEvent, useState } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

export default function ProviderSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

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
      // Check if email exists in users collection (for existing login accounts)
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', emailToCheck)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      // Also check if email exists in providers collection (for pending applications)
      const providersQuery = query(
        collection(db, 'providers'),
        where('email', '==', emailToCheck)
      );
      const providersSnapshot = await getDocs(providersQuery);
      
      return !usersSnapshot.empty || !providersSnapshot.empty;
    } catch (err) {
      console.error('Error checking email existence:', err);
      return false;
    }
  };
  const [formData, setFormData] = useState({
    // Step 1: Business Information
    businessName: '',
    legalEntityName: '',
    ein: '',
    barNumber: '',
    businessLicense: '',
    yearsInBusiness: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceExpiry: '',
    
    // Step 2: Contact Information
    contactPerson: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Step 3: Legal Documents & Terms
    w9Form: '',
    agreedToTerms: false,
    agreedToBackgroundCheck: false,
    agreedToCompliance: false,
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


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate all steps before submission
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setError('Please fill out all required fields before submitting.');
      setLoading(false);
      return;
    }

    // Validate EIN number
    if (formData.ein.length !== 9) {
      setError('EIN number must be exactly 9 digits.');
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

      const providerData = {
        ...formData,
        providerId: providerId,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        yearsInBusiness: parseInt(formData.yearsInBusiness),
      };

      await addDoc(collection(db, 'providers'), providerData);
      
      // Redirect to success page
      router.push('/provider/signup/success');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.businessName &&
          formData.legalEntityName &&
          formData.ein &&
          formData.ein.length === 9 &&
          formData.businessLicense &&
          formData.yearsInBusiness &&
          formData.insuranceProvider &&
          formData.insurancePolicyNumber &&
          formData.insuranceExpiry
        );
      case 2:
        return !!(
          formData.contactPerson &&
          formData.email &&
          formData.phone &&
          formData.address &&
          formData.city &&
          formData.state &&
          formData.zipCode
        );
      case 3:
        return !!(
          formData.agreedToTerms &&
          formData.agreedToBackgroundCheck &&
          formData.agreedToCompliance
        );
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 3 && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else if (!validateStep(currentStep)) {
      setError('Please fill out all required fields before proceeding.');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
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
              Join our network of approved service providers and help California drivers
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
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
            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>
                
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

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EIN Number *
                    </label>
                    <input
                      type="text"
                      name="ein"
                      value={formData.ein}
                      onChange={(e) => {
                        // Only allow digits and limit to 9 characters
                        const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setFormData(prev => ({ ...prev, ein: value }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formData.ein.length === 9 
                          ? 'border-green-300 bg-green-50' 
                          : formData.ein.length > 0 
                            ? 'border-yellow-300 bg-yellow-50' 
                            : 'border-gray-300'
                      }`}
                      placeholder="123456789"
                      maxLength={9}
                      required
                    />
                    <p className={`text-xs mt-1 ${
                      formData.ein.length === 9 
                        ? 'text-green-600' 
                        : formData.ein.length > 0 
                          ? 'text-yellow-600' 
                          : 'text-gray-500'
                    }`}>
                      {formData.ein.length === 9 
                        ? '✓ Valid EIN number' 
                        : formData.ein.length > 0 
                          ? `${formData.ein.length}/9 digits` 
                          : 'Enter 9 digits only (no dashes or spaces)'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bar Number (if applicable)
                    </label>
                    <input
                      type="text"
                      name="barNumber"
                      value={formData.barNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business License Number *
                    </label>
                    <input
                      type="text"
                      name="businessLicense"
                      value={formData.businessLicense}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

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

                {/* Insurance Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Information</h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Insurance Provider *
                      </label>
                      <input
                        type="text"
                        name="insuranceProvider"
                        value={formData.insuranceProvider}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Policy Number *
                      </label>
                      <input
                        type="text"
                        name="insurancePolicyNumber"
                        value={formData.insurancePolicyNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Insurance Expiration *
                      </label>
                      <input
                        type="date"
                        name="insuranceExpiry"
                        value={formData.insuranceExpiry}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                
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

                <div className="grid md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
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
            )}

            {/* Step 3: Legal & Terms */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Legal Documents & Terms</h2>
                
                <div className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      W-9 Form Status
                    </label>
                    <select
                      name="w9Form"
                      value={formData.w9Form}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="not-required">Not Required</option>
                    </select>
                  </div>
                  
                </div>

                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="agreedToTerms"
                      checked={formData.agreedToTerms}
                      onChange={handleInputChange}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      required
                    />
                    <div className="text-sm">
                      <p className="text-gray-700">
                        I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="agreedToBackgroundCheck"
                      checked={formData.agreedToBackgroundCheck}
                      onChange={handleInputChange}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      required
                    />
                    <div className="text-sm">
                      <p className="text-gray-700">
                        I consent to background checks and verification of all provided information.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="agreedToCompliance"
                      checked={formData.agreedToCompliance}
                      onChange={handleInputChange}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      required
                    />
                    <div className="text-sm">
                      <p className="text-gray-700">
                        I agree to comply with all DIP provider standards and requirements.
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
              
              {currentStep < 3 ? (
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
                  disabled={loading || !validateStep(3)}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    loading || !validateStep(3)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
