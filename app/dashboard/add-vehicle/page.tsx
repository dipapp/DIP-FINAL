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
      
      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Add New Vehicle</h2>
          <p className="text-gray-600">Add your vehicle to your DIP membership</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${
                  (!form.licensePlate || !form.state ? 0 : 
                   !form.vin || form.vin.length !== 17 ? 25 : 
                   !form.make || !form.model || !form.year ? 50 : 
                   100)
                }%` 
              }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Enter license plate and state, then auto-fill vehicle details
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1: License Plate & State */}
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
            <div className="flex items-center mb-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
                form.licensePlate && form.state 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {form.licensePlate && form.state ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-bold">1</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">License Plate & State</h3>
                <p className="text-gray-600 text-sm">Enter your license plate and state to auto-fill vehicle details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center uppercase font-medium text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ABC123"
                  value={form.licensePlate}
                  maxLength={7}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                    setForm({ ...form, licensePlate: value });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">{form.licensePlate.length}/6-7 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center uppercase font-medium text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="CA"
                  value={form.state}
                  maxLength={2}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
                    setForm({ ...form, state: value });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Two-letter state code</p>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                className={`inline-flex items-center px-6 py-3 text-base font-semibold rounded-lg transition-colors ${
                  form.licensePlate && form.state && !lookingUpVin
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!form.licensePlate || !form.state || lookingUpVin}
                onClick={lookupVehicleFromPlate}
              >
                {lookingUpVin ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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

          {/* Step 2: Vehicle Details */}
          <div className={`rounded-lg p-5 transition-all duration-300 ${
            form.licensePlate && form.state
              ? 'bg-gray-50 border border-gray-200'
              : 'bg-gray-100 border border-gray-300 opacity-60'
          }`}>
            <div className="flex items-center mb-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
                form.vin.length === 17 && form.make && form.model && form.year
                  ? 'bg-green-100 text-green-600' 
                  : form.licensePlate && form.state
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {form.vin.length === 17 && form.make && form.model && form.year ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-bold">2</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Vehicle Details</h3>
                <p className="text-gray-600 text-sm">Auto-filled from license plate lookup</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">VIN Number</label>
                <input 
                  className={`w-full px-4 py-3 border rounded-lg font-mono uppercase ${
                    form.licensePlate && form.state
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
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
                <p className="text-xs text-gray-500 mt-1">{form.vin.length}/17 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <input 
                  className={`w-full px-4 py-3 border rounded-lg ${
                    form.licensePlate && form.state
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                <input 
                  className={`w-full px-4 py-3 border rounded-lg ${
                    form.licensePlate && form.state
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <input 
                  className={`w-full px-4 py-3 border rounded-lg ${
                    form.licensePlate && form.state
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color (Optional)</label>
                <input 
                  className={`w-full px-4 py-3 border rounded-lg ${
                    form.licensePlate && form.state
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    Ready: {form.year} {form.make} {form.model}
                  </p>
                  <p className="text-green-600 text-sm">Plate: {form.licensePlate} ({form.state}) • VIN: {form.vin}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center pt-4">
            <button 
              className={`inline-flex items-center px-8 py-4 text-lg font-semibold rounded-lg shadow-md transition-all duration-200 ${
                !isFormValid || adding
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
              onClick={createVehicle}
              disabled={!isFormValid || adding}
            >
              {adding ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Vehicle...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Vehicle to DIP
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
