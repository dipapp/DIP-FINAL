'use client';
import React, { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { addVehicle, setVehicleActive, subscribeMyVehicles, updateVehicle, uploadMyVehiclePhoto, updatePaymentMethod, deleteVehicle, deleteVehiclePhoto } from '@/lib/firebase/memberActions';
import { auth } from '@/lib/firebase/client';
import carData from './car_data.json';
import BackButton from '@/components/BackButton';

// United States states (incl. DC) as abbreviations
const US_STATES: { code: string; name: string }[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

function MyVehiclesPageContent() {
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [form, setForm] = useState({ make: '', model: '', year: '', vin: '', licensePlate: '', state: '', color: '' });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ vin: string; licensePlate: string; state: string; color: string }>({ vin: '', licensePlate: '', state: '', color: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [activatingVehicleId, setActivatingVehicleId] = useState<string | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsub = subscribeMyVehicles((rows) => {
        setVehicles(rows);
        setLoading(false);
      });
      return () => { try { (unsub as any)?.(); } catch {} };
    } catch {
      setLoading(false);
    }
  }, []);

  // Handle ESC key to close expanded photo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedPhoto) {
        setExpandedPhoto(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expandedPhoto]);

  // Handle Stripe checkout success/cancel
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      alert('🎉 Payment successful! Your vehicle is now active.');
      // Refresh the page to show updated vehicle status
      window.location.href = '/dashboard/vehicles';
    } else if (canceled === 'true') {
      alert('Payment was canceled. You can try again anytime.');
    }
  }, [searchParams]);

  // Car data derived lists similar to iOS app
  const makeOptions: string[] = useMemo(() => carData.map((m: any) => m.make), []);
  const modelOptions: string[] = useMemo(() => {
    const selectedMake = carData.find((m: any) => m.make === form.make);
    return selectedMake ? selectedMake.models.map((mm: any) => mm.name) : [];
  }, [form.make]);
  const yearOptions: string[] = useMemo(() => {
    const selectedMake = carData.find((m: any) => m.make === form.make);
    const selectedModel = selectedMake?.models.find((mm: any) => mm.name === form.model);
    if (selectedModel) {
      return [...selectedModel.years].sort((a: string, b: string) => Number(b) - Number(a));
    }
    // Fallback to union of all years if no specific model selected yet
    const allYears = new Set<string>();
    carData.forEach((m: any) => m.models.forEach((mm: any) => mm.years.forEach((y: string) => allYears.add(y))));
    return Array.from(allYears).sort((a, b) => Number(b) - Number(a));
  }, [form.make, form.model]);

  async function createVehicle() {
    // Require all essential fields
    if (!form.make || !form.model || !form.year) return;
    if (!form.state) return;
    if (form.vin.length !== 17) return;
    if (form.licensePlate.length < 6 || form.licensePlate.length > 7) return;
    setAdding(true);
    await addVehicle({ ...form, isActive: false });
    setForm({ make: '', model: '', year: '', vin: '', licensePlate: '', state: '', color: '' });
    setAdding(false);
  }

  async function handlePhotoUpload(vehicleId: string, file: File) {
    setUploading(vehicleId);
    try {
      await uploadMyVehiclePhoto(vehicleId, file);
    } finally {
      setUploading(null);
    }
  }

  async function handleDeleteVehicle(vehicleId: string) {
    try {
      setDeletingVehicle(true);
      console.log('Attempting to delete vehicle:', vehicleId);
      await deleteVehicle(vehicleId);
      console.log('Vehicle deleted successfully');
      setShowDeleteModal(false);
      setDeletingVehicleId(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert(`Failed to delete vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingVehicle(false);
    }
  }


  const getVehicleIcon = (make: string) => {
    const key = make.toLowerCase().replace(/[^a-z0-9]/g, '');
    const known = [
      'acura','audi','bmw','buick','cadillac','chevrolet','chrysler','dodge','ford',
      'genesis','gmc','honda','hyundai','infiniti','jaguar','jeep','kia','landrover','lexus',
      'lincoln','maserati','mazda','mercedesbenz','mini','mitsubishi','nissan','polestar',
      'porsche','ram','subaru','tesla','toyota','volkswagen','volvo'
    ];
    if (known.includes(key)) return `/brands/${key}.png`;
    return null;
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-muted">Loading your vehicles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-start">
        <BackButton />
      </div>
      
      {/* Add Vehicle Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Add New Vehicle
          </h2>
          <p className="text-gray-600">
            Add your vehicle to your DIP membership for protection and benefits
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${
                  (!form.make ? 0 : 
                   !form.model ? 25 : 
                   !form.year ? 50 : 
                   !form.state ? 70 : 
                   form.vin.length !== 17 ? 85 : 
                   (form.licensePlate.length >= 6 && form.licensePlate.length <= 7) ? 100 : 85)
                }%` 
              }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Complete all fields to add your vehicle
          </p>
        </div>

        {/* Vehicle Information Form */}
        <div className="space-y-6">
          {/* Step 1: Vehicle Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
                form.make && form.model && form.year 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {form.make && form.model && form.year ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-bold">1</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Vehicle Information
                </h3>
                <p className="text-gray-600 text-sm">Select your vehicle's make, model, and year</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                >
                  <option value="">Select year</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={form.make}
                  onChange={(e) => {
                    setForm({ ...form, make: e.target.value, model: '' });
                  }}
                >
                  <option value="">Select make</option>
                  {makeOptions.map((mk) => (
                    <option key={mk} value={mk}>{mk}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                    !form.make 
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  value={form.model}
                  onChange={(e) => {
                    const nextModel = e.target.value;
                    const makeEntry: any = carData.find((m: any) => m.make === form.make);
                    const modelEntry: any = makeEntry?.models.find((mm: any) => mm.name === nextModel);
                    const years: string[] = modelEntry ? [...modelEntry.years].sort((a: string, b: string) => Number(b) - Number(a)) : [];
                    setForm({ ...form, model: nextModel, year: years[0] || '' });
                  }}
                  disabled={!form.make}
                >
                  <option value="">Select model</option>
                  {modelOptions.map((md) => (
                    <option key={md} value={md}>{md}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Registration Details */}
          <div className={`rounded-lg p-6 transition-all duration-300 ${
            form.make && form.model && form.year
              ? 'bg-gray-50 border border-gray-200'
              : 'bg-gray-100 border border-gray-300'
          }`}>
            <div className="flex items-center mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
                form.state && form.vin.length === 17 && (form.licensePlate.length >= 6 && form.licensePlate.length <= 7)
                  ? 'bg-green-100 text-green-600' 
                  : form.make && form.model && form.year
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {form.state && form.vin.length === 17 && (form.licensePlate.length >= 6 && form.licensePlate.length <= 7) ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-bold">2</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Registration Details
                </h3>
                <p className="text-gray-600 text-sm">Enter your vehicle's registration information</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input 
                  className={`w-full px-3 py-2 border rounded-lg text-center uppercase font-medium transition-colors ${
                    form.make && form.model && form.year
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  placeholder="CA"
                  value={form.state}
                  maxLength={2}
                  disabled={!form.make || !form.model || !form.year}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
                    setForm({ ...form, state: value });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Two-letter state code</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">VIN Number</label>
                <input 
                  className={`w-full px-3 py-2 border rounded-lg font-mono text-sm uppercase transition-colors ${
                    form.make && form.model && form.year
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  placeholder="1HGBH41JXMN109186"
                  value={form.vin}
                  maxLength={17}
                  disabled={!form.make || !form.model || !form.year}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
                    setForm({ ...form, vin: value });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {form.vin.length}/17 characters
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
                <input 
                  className={`w-full px-3 py-2 border rounded-lg text-center uppercase font-medium transition-colors ${
                    form.make && form.model && form.year
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  placeholder="ABC123"
                  value={form.licensePlate}
                  maxLength={7}
                  disabled={!form.make || !form.model || !form.year}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                    setForm({ ...form, licensePlate: value });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {form.licensePlate.length}/6-7 characters
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-6">
            <button 
              className={`inline-flex items-center px-8 py-4 text-lg font-semibold rounded-lg shadow-md transition-all duration-200 ${
                (!form.make || !form.model || !form.year || !form.state ||
                 form.vin.length !== 17 ||
                 form.licensePlate.length < 6 || form.licensePlate.length > 7 ||
                 adding)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
              onClick={createVehicle}
              disabled={
                !form.make || !form.model || !form.year || !form.state ||
                form.vin.length !== 17 ||
                form.licensePlate.length < 6 || form.licensePlate.length > 7 ||
                adding
              }
            >
              {adding ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            
            {/* Success Preview */}
            {(form.make && form.model && form.year && form.state && form.vin.length === 17 && (form.licensePlate.length >= 6 && form.licensePlate.length <= 7)) && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      Ready: {form.year} {form.make} {form.model}
                    </p>
                    <p className="text-green-600 font-medium">All information complete</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Vehicles List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              My Vehicles
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium text-sm">{vehicles.filter(v => v.isActive).length} Active</span>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-700 font-medium text-sm">{vehicles.length} Total</span>
              </div>
            </div>
          </div>
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vehicles yet</h3>
            <p className="text-gray-600 mb-6">Add your first vehicle to get started with DIP benefits.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getVehicleIcon(vehicle.make) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getVehicleIcon(vehicle.make) as string} alt={`${vehicle.make} logo`} className="w-10 h-10 object-contain" />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{vehicle.year} {vehicle.make}</h3>
                      <p className="text-gray-600">{vehicle.model}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    vehicle.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {vehicle.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Key Details */}
                <div className="space-y-2 mb-4">
                  {vehicle.vin && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-16">VIN:</span>
                      <span className="font-mono text-gray-900">{vehicle.vin}</span>
                    </div>
                  )}
                  {vehicle.licensePlate && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-16">Plate:</span>
                      <span className="font-medium text-gray-900">{vehicle.licensePlate}</span>
                    </div>
                  )}
                  {vehicle.state && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-16">State:</span>
                      <span className="text-gray-900">{vehicle.state}</span>
                    </div>
                  )}
                </div>

                {/* Primary Actions */}
                <div className="flex gap-2 mb-3">
                  {!vehicle.isActive && (
                    <button
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      onClick={async () => { 
                        try {
                          setActivatingVehicleId(vehicle.id);
                          
                          // Get current user
                          const user = auth.currentUser;
                          if (!user) {
                            alert('Please sign in to activate your vehicle');
                            return;
                          }

                          // Create Stripe checkout session
                          const response = await fetch('/api/stripe/checkout', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${await user.getIdToken()}`,
                            },
                            body: JSON.stringify({
                              vehicleId: vehicle.id,
                              userId: user.uid,
                            }),
                          });

                          if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.error || 'Failed to create checkout session');
                          }

                          const { url } = await response.json();
                          
                          // Redirect to Stripe Checkout
                          window.location.href = url;
                        } catch (error) {
                          console.error('Error creating checkout session:', error);
                          alert('Failed to start checkout process. Please try again.');
                          setActivatingVehicleId(null);
                        }
                      }}
                    >
                      Activate
                    </button>
                  )}
                  <Link 
                    href={{ pathname: '/dashboard/subscription', query: { vehicleId: vehicle.id } }} 
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                  >
                    Manage Membership
                  </Link>
                </div>

                {/* Secondary Actions */}
                <div className="flex gap-2 mb-2">
                  <button
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setShowPhotoModal(true);
                    }}
                  >
                    📸 Photos
                  </button>
                  <button
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    onClick={() => {
                      setEditingId(vehicle.id);
                      setEditForm({
                        vin: vehicle.vin || '',
                        licensePlate: vehicle.licensePlate || '',
                        state: vehicle.state || '',
                        color: vehicle.color || '',
                      });
                    }}
                  >
                    Edit
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                    onClick={() => {
                      setDeletingVehicleId(vehicle.id);
                      setShowDeleteModal(true);
                    }}
                    title="Delete vehicle"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">VIN</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm uppercase" 
                  value={editForm.vin} 
                  maxLength={17}
                  placeholder="17 CHARACTERS"
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
                    setEditForm({ ...editForm, vin: value });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">VIN must be exactly 17 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase font-medium text-center" 
                  value={editForm.licensePlate}
                  maxLength={7}
                  placeholder="6–7 CHARACTERS"
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                    setEditForm({ ...editForm, licensePlate: value });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">License plate must be 6–7 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase font-medium text-center" 
                  value={editForm.state} 
                  placeholder="CA"
                  maxLength={2}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
                    setEditForm({ ...editForm, state: value });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Two-letter state code</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 capitalize" 
                  value={editForm.color} 
                  placeholder="Vehicle Color"
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '').slice(0, 20);
                    setEditForm({ ...editForm, color: value });
                  }}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium" 
                onClick={() => setEditingId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                disabled={savingEdit}
                onClick={async () => {
                  try {
                    setSavingEdit(true);
                    await updateVehicle(editingId, { ...editForm });
                    setEditingId(null);
                  } finally {
                    setSavingEdit(false);
                  }
                }}
              >
                {savingEdit ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingVehicleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Vehicle</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this vehicle? This action cannot be undone and will remove all associated data including photos and documents.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 text-sm text-red-700">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-medium">This will permanently delete the vehicle and all its data</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingVehicleId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                onClick={() => handleDeleteVehicle(deletingVehicleId)}
                disabled={deletingVehicleId === null || deletingVehicle}
              >
                {deletingVehicle ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Vehicle'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewing Modal */}
      {showPhotoModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Photos - {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
              </h3>
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => {
                  setShowPhotoModal(false);
                  setSelectedVehicle(null);
                  setExpandedPhoto(null);
                }}
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              {selectedVehicle.photos && selectedVehicle.photos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedVehicle.photos.map((photo: any, index: number) => {
                    // Handle both string URLs (web format) and object format (iOS format)
                    const photoUrl = typeof photo === 'string' ? photo : photo.imageURL;
                    const photoId = typeof photo === 'string' ? index.toString() : photo.id;
                    
                    if (!photoUrl) return null;
                    
                    return (
                      <div key={photoId} className="relative group cursor-pointer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoUrl}
                          alt={`Vehicle photo ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:scale-105 transition-transform duration-200"
                          onClick={() => setExpandedPhoto(photoUrl)}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <button
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPhoto(photoUrl);
                            }}
                          >
                            🔍 View
                          </button>
                          <button
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this photo?')) {
                                try {
                                  await deleteVehiclePhoto(selectedVehicle.id, photoUrl);
                                  // Update the selected vehicle state immediately
                                  const updatedPhotos = selectedVehicle.photos.filter((photo: any) => {
                                    const currentPhotoUrl = typeof photo === 'string' ? photo : photo.imageURL;
                                    return currentPhotoUrl !== photoUrl;
                                  });
                                  setSelectedVehicle({
                                    ...selectedVehicle,
                                    photos: updatedPhotos
                                  });
                                } catch (error) {
                                  alert(`Failed to delete photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                }
                              }
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No photos yet</h4>
                  <p className="text-gray-600">Upload photos of your vehicle to view them here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expanded Photo Modal */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-w-[95vw] max-h-[95vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expandedPhoto}
              alt="Expanded vehicle photo"
              className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{ maxWidth: '95vw', maxHeight: '95vh' }}
            />
            <button
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 rounded-full w-10 h-10 flex items-center justify-center transition-colors shadow-lg"
              onClick={() => setExpandedPhoto(null)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
              Click outside or press ESC to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyVehiclesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyVehiclesPageContent />
    </Suspense>
  );
}


