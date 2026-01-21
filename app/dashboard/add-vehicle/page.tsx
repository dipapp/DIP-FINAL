'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addVehicle } from '@/lib/firebase/memberActions';
import BackButton from '@/components/BackButton';

export default function AddVehiclePage() {
  const router = useRouter();
  const [form, setForm] = useState({ make: '', model: '', year: '', vin: '', licensePlate: '', state: '', color: '' });
  const [adding, setAdding] = useState(false);
  const [lookingUpVin, setLookingUpVin] = useState(false);

  async function lookupVehicleFromPlate() {
    if (!form.licensePlate || !form.state) {
      alert('Please enter both license plate and state to lookup vehicle details');
      return;
    }

    setLookingUpVin(true);
    try {
      const response = await fetch('/api/platetovin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licensePlate: form.licensePlate,
          state: form.state,
        }),
      });

      const data = await response.json();

      if (data.success && data.vin) {
        setForm({ 
          ...form, 
          vin: data.vin,
          year: data.year || '',
          make: data.make || '',
          model: data.model || '',
          color: data.color || ''
        });
        alert(`Vehicle details found and populated!\n\n${data.year} ${data.make} ${data.model}\nVIN: ${data.vin}`);
      } else {
        alert(`Could not find vehicle details for plate ${form.licensePlate} in ${form.state}.\n\n${data.details || 'Please check the plate number and state, or try entering the details manually.'}`);
      }
    } catch (error) {
      console.error('Error looking up vehicle:', error);
      alert('Failed to lookup vehicle details. Please try again or enter manually.');
    } finally {
      setLookingUpVin(false);
    }
  }

  async function createVehicle() {
    if (!form.make || !form.model || !form.year) return;
    if (!form.state) return;
    if (form.vin.length !== 17) return;
    if (form.licensePlate.length < 6 || form.licensePlate.length > 7) return;
    
    setAdding(true);
    try {
      await addVehicle({ ...form, isActive: false });
      router.push('/dashboard/vehicles');
    } catch (error) {
      console.error('Error adding vehicle:', error);
      alert('Failed to add vehicle. Please try again.');
      setAdding(false);
    }
  }

  const isFormValid = form.licensePlate && form.state && form.vin.length === 17 && 
                      form.make && form.model && form.year;

  return (
    <div className="space-y-6">
      <div className="flex justify-start">
        <BackButton />
      </div>
      
      <div className="max-w-4xl mx-auto">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-xl p-8 mb-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>
          
          <div className="relative text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">Add New Vehicle</h2>
            <p className="text-blue-100">Register your vehicle to your DIP membership</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="relative bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full transition-all duration-500 shadow-lg"
                style={{ 
                  width: `${
                    (!form.licensePlate || !form.state ? 0 : 
                     !form.vin || form.vin.length !== 17 ? 33 : 
                     !form.make || !form.model || !form.year ? 66 : 
                     100)
                  }%` 
                }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className={form.licensePlate && form.state ? 'text-blue-600' : 'text-gray-400'}>License Info</span>
              <span className={form.vin.length === 17 ? 'text-blue-600' : 'text-gray-400'}>VIN Details</span>
              <span className={form.make && form.model && form.year ? 'text-blue-600' : 'text-gray-400'}>Complete</span>
            </div>
          </div>

        <div className="space-y-6">
          {/* Step 1: License Plate & State */}
          <div className="relative group">
            <div className={`rounded-2xl p-6 border-2 transition-all duration-300 ${
              form.licensePlate && form.state 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-lg' 
                : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-md hover:shadow-lg'
            }`}>
              <div className="flex items-center mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-md ${
                  form.licensePlate && form.state 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                }`}>
                  {form.licensePlate && form.state ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-bold text-white">1</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">License Plate & State</h3>
                  <p className="text-gray-600 text-sm">Enter your license plate and state to auto-fill vehicle details</p>
                </div>
              </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">License Plate</label>
                <input 
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-center uppercase font-bold text-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="ABC123"
                  value={form.licensePlate}
                  maxLength={7}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                    setForm({ ...form, licensePlate: value });
                  }}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">{form.licensePlate.length}/6-7 characters</p>
                  {form.licensePlate.length >= 6 && (
                    <p className="text-xs text-green-600 font-medium">✓ Valid</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <input 
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-center uppercase font-bold text-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="CA"
                  value={form.state}
                  maxLength={2}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
                    setForm({ ...form, state: value });
                  }}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">Two-letter state code</p>
                  {form.state.length === 2 && (
                    <p className="text-xs text-green-600 font-medium">✓ Valid</p>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                className={`inline-flex items-center px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 shadow-lg ${
                  form.licensePlate && form.state && !lookingUpVin
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-105 transform'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!form.licensePlate || !form.state || lookingUpVin}
                onClick={lookupVehicleFromPlate}
              >
                {lookingUpVin ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Looking up vehicle...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Auto-Fill Vehicle Details
                  </>
                )}
              </button>
            </div>
            </div>
          </div>

          {/* Step 2: Vehicle Details */}
          <div className={`relative rounded-2xl p-6 border-2 transition-all duration-300 ${
            form.vin.length === 17 && form.make && form.model && form.year
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-lg'
              : form.licensePlate && form.state
                ? 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300 shadow-md'
                : 'bg-gray-100 border-gray-300 opacity-50'
          }`}>
            <div className="flex items-center mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-md ${
                form.vin.length === 17 && form.make && form.model && form.year
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                  : form.licensePlate && form.state
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    : 'bg-gray-300'
              }`}>
                {form.vin.length === 17 && form.make && form.model && form.year ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-bold text-white">2</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">Vehicle Details</h3>
                <p className="text-gray-600 text-sm">Auto-filled from license plate lookup</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">VIN Number</label>
                <input 
                  className={`w-full px-4 py-3.5 border-2 rounded-xl font-mono text-sm uppercase transition-all duration-200 ${
                    form.licensePlate && form.state
                      ? 'border-gray-200 bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm hover:shadow-md'
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  placeholder="1HGBH41JXMN109186"
                  value={form.vin}
                  maxLength={17}
                  disabled={!form.licensePlate || !form.state}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
                    setForm({ ...form, vin: value });
                  }}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">{form.vin.length}/17 characters</p>
                  {form.vin.length === 17 && (
                    <p className="text-xs text-green-600 font-medium">✓ Valid VIN</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                  <input 
                    className={`w-full px-4 py-3.5 border-2 rounded-xl transition-all duration-200 ${
                      form.licensePlate && form.state
                        ? 'border-gray-200 bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm hover:shadow-md'
                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    placeholder="2020"
                    value={form.year}
                    maxLength={4}
                    disabled={!form.licensePlate || !form.state}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                      setForm({ ...form, year: value });
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Make</label>
                  <input 
                    className={`w-full px-4 py-3.5 border-2 rounded-xl transition-all duration-200 ${
                      form.licensePlate && form.state
                        ? 'border-gray-200 bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm hover:shadow-md'
                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    placeholder="Toyota"
                    value={form.make}
                    disabled={!form.licensePlate || !form.state}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z\s]/g, '').slice(0, 20);
                      setForm({ ...form, make: value });
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
                  <input 
                    className={`w-full px-4 py-3.5 border-2 rounded-xl transition-all duration-200 ${
                      form.licensePlate && form.state
                        ? 'border-gray-200 bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm hover:shadow-md'
                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    placeholder="Camry"
                    value={form.model}
                    disabled={!form.licensePlate || !form.state}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z0-9\s]/g, '').slice(0, 30);
                      setForm({ ...form, model: value });
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input 
                  className={`w-full px-4 py-3.5 border-2 rounded-xl transition-all duration-200 ${
                    form.licensePlate && form.state
                      ? 'border-gray-200 bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm hover:shadow-md'
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  placeholder="Silver"
                  value={form.color}
                  disabled={!form.licensePlate || !form.state}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '').slice(0, 20);
                    setForm({ ...form, color: value });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Success Preview */}
          {isFormValid && (
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-center flex-1">
                  <p className="text-xl font-bold text-white mb-1">
                    {form.year} {form.make} {form.model}
                  </p>
                  <p className="text-green-100 text-sm">
                    {form.licensePlate} ({form.state}) • {form.vin}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center pt-6">
            <button 
              className={`group relative inline-flex items-center px-10 py-5 text-lg font-bold rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden ${
                !isFormValid || adding
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:scale-105 transform hover:shadow-2xl'
              }`}
              onClick={createVehicle}
              disabled={!isFormValid || adding}
            >
              {!isFormValid && !adding && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20"></div>
              )}
              {isFormValid && !adding && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
              
              <span className="relative z-10 flex items-center">
                {adding ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Vehicle...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Vehicle to DIP
                  </>
                )}
              </span>
            </button>
            
            {!isFormValid && (
              <p className="mt-4 text-sm text-gray-500">
                Complete all required fields to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
