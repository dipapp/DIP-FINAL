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
        const message = `Vehicle details found and populated!\n\n${data.year} ${data.make} ${data.model}\nVIN: ${data.vin}`;
        alert(message);
      } else {
        const errorMsg = data.details || 'Please check the plate number and state, or try entering the details manually.';
        alert(`Could not find vehicle details for plate ${form.licensePlate} in ${form.state}.\n\n${errorMsg}`);
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

  const isFormValid = form.licensePlate && form.state && form.vin.length === 17 && form.make && form.model && form.year;

  const progressWidth = !form.licensePlate || !form.state ? 0 : !form.vin || form.vin.length !== 17 ? 33 : !form.make || !form.model || !form.year ? 66 : 100;

  return (
    <div className="space-y-4">
      <BackButton />
      
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Add New Vehicle</h2>
            <p className="text-sm text-gray-500">Register your vehicle to your DIP membership</p>
          </div>

          <div className="mb-6">
            <div className="relative bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progressWidth}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span className={form.licensePlate && form.state ? 'text-blue-600 font-medium' : ''}>License Info</span>
              <span className={form.vin.length === 17 ? 'text-blue-600 font-medium' : ''}>VIN Details</span>
              <span className={form.make && form.model && form.year ? 'text-blue-600 font-medium' : ''}>Complete</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`rounded-lg p-4 border transition-all ${
              form.licensePlate && form.state 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2.5 ${
                  form.licensePlate && form.state ? 'bg-green-600' : 'bg-blue-600'
                }`}>
                  {form.licensePlate && form.state ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold text-white">1</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">License Plate & State</h3>
                  <p className="text-xs text-gray-500">Enter to auto-fill vehicle details</p>
                </div>
              </div>
            
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">License Plate</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center uppercase font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ABC123"
                    value={form.licensePlate}
                    maxLength={7}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                      setForm({ ...form, licensePlate: value });
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">{form.licensePlate.length}/6-7 chars</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">State</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center uppercase font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="CA"
                    value={form.state}
                    maxLength={2}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
                      setForm({ ...form, state: value });
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">2-letter code</p>
                </div>
              </div>

              <button
                type="button"
                className={`w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  form.licensePlate && form.state && !lookingUpVin
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!form.licensePlate || !form.state || lookingUpVin}
                onClick={lookupVehicleFromPlate}
              >
                {lookingUpVin ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Looking up...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Auto-Fill Details
                  </>
                )}
              </button>
            </div>

            <div className={`rounded-lg p-4 border transition-all ${
              form.vin.length === 17 && form.make && form.model && form.year
                ? 'bg-green-50 border-green-200'
                : form.licensePlate && form.state
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-gray-100 border-gray-200 opacity-50'
            }`}>
              <div className="flex items-center mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2.5 ${
                  form.vin.length === 17 && form.make && form.model && form.year
                    ? 'bg-green-600' 
                    : form.licensePlate && form.state
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                }`}>
                  {form.vin.length === 17 && form.make && form.model && form.year ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold text-white">2</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">Vehicle Details</h3>
                  <p className="text-xs text-gray-500">Auto-filled from lookup</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">VIN Number</label>
                  <input 
                    className={`w-full px-3 py-2 border rounded-lg font-mono text-xs uppercase ${
                      form.licensePlate && form.state
                        ? 'border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
                  <p className="text-xs text-gray-500 mt-1">{form.vin.length}/17 chars</p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Year</label>
                    <input 
                      className={`w-full px-3 py-2 border rounded-lg ${
                        form.licensePlate && form.state
                          ? 'border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Make</label>
                    <input 
                      className={`w-full px-3 py-2 border rounded-lg ${
                        form.licensePlate && form.state
                          ? 'border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Model</label>
                    <input 
                      className={`w-full px-3 py-2 border rounded-lg ${
                        form.licensePlate && form.state
                          ? 'border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Color <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input 
                    className={`w-full px-3 py-2 border rounded-lg ${
                      form.licensePlate && form.state
                        ? 'border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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

            {isFormValid && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {form.year} {form.make} {form.model}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {form.licensePlate} ({form.state}) • {form.vin}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button 
              className={`w-full inline-flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
                !isFormValid || adding
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={createVehicle}
              disabled={!isFormValid || adding}
            >
              {adding ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Vehicle...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
