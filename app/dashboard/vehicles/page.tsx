'use client';
import { useEffect, useMemo, useState, Suspense } from 'react';
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
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex justify-start">
        <BackButton />
      </div>
      
      {/* Clean Add Vehicle Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
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

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl text-white">🚗</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Your Vehicle</h2>
            <p className="text-gray-600">Enter your vehicle details to get started with DIP protection</p>
          </div>

          {/* Form Steps */}
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Step 1: Vehicle Details */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${
                  form.make && form.model && form.year 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-500 text-white'
                }`}>
                  {form.make && form.model && form.year ? '✓' : '1'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Vehicle Information</h3>
                  <p className="text-gray-600 text-sm">Tell us about your vehicle</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Make</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
                  <select
                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 ${
                      !form.make 
                        ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
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
            <div className={`rounded-xl p-6 border transition-all duration-300 ${
              form.make && form.model && form.year
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${
                  form.state && form.vin.length === 17 && (form.licensePlate.length >= 6 && form.licensePlate.length <= 7)
                    ? 'bg-green-500 text-white' 
                    : form.make && form.model && form.year
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-400 text-white'
                }`}>
                  {form.state && form.vin.length === 17 && (form.licensePlate.length >= 6 && form.licensePlate.length <= 7) ? '✓' : '2'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Registration Details</h3>
                  <p className="text-gray-600 text-sm">Vehicle identification information</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                  <input 
                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 font-bold text-center uppercase ${
                      form.make && form.model && form.year
                        ? 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                        : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    placeholder="CA"
                    value={form.state}
                    maxLength={2}
                    disabled={!form.make || !form.model || !form.year}
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
                      setForm({ ...form, state: value });
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">2-letter state code</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">VIN</label>
                  <input 
                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 font-mono text-sm uppercase ${
                      form.make && form.model && form.year
                        ? 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                        : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    placeholder="1HGBH41JXMN109186"
                    value={form.vin}
                    maxLength={17}
                    disabled={!form.make || !form.model || !form.year}
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
                      setForm({ ...form, vin: value });
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <span className={form.vin.length === 17 ? 'text-green-600 font-medium' : ''}>
                      {form.vin.length}/17 characters
                    </span>
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">License Plate</label>
                  <input 
                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 font-bold text-center uppercase ${
                      form.make && form.model && form.year
                        ? 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                        : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    placeholder="ABC123"
                    value={form.licensePlate}
                    maxLength={7}
                    disabled={!form.make || !form.model || !form.year}
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                      setForm({ ...form, licensePlate: value });
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <span className={(form.licensePlate.length >= 6 && form.licensePlate.length <= 7) ? 'text-green-600 font-medium' : ''}>
                      {form.licensePlate.length}/6-7 characters
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-4">
              <button 
                className={`inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white rounded-xl shadow-lg transition-all duration-200 ${
                  (!form.make || !form.model || !form.year || !form.state ||
                   form.vin.length !== 17 ||
                   form.licensePlate.length < 6 || form.licensePlate.length > 7 ||
                   adding)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl hover:scale-105'
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
                    <div className="loading-spinner mr-2"></div>
                    <span>Adding Vehicle...</span>
                  </>
                ) : (
                  <>
                    <span className="mr-2">🚗</span>
                    <span>Add Vehicle</span>
                  </>
                )}
              </button>
              
              {/* Success Message */}
              {(form.make && form.model && form.year && form.state && form.vin.length === 17 && (form.licensePlate.length >= 6 && form.licensePlate.length <= 7)) && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-center space-x-2 text-green-700">
                    <span>✅</span>
                    <span className="font-semibold">Ready to add your {form.year} {form.make} {form.model}!</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">My Vehicles</h2>
          <div className="flex items-center space-x-2 text-sm text-muted">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{vehicles.filter(v => v.isActive).length} active</span>
            <span>•</span>
            <span>{vehicles.length} total</span>
          </div>
        </div>

        {vehicles.length === 0 ? (
          <div className="card text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-6xl mb-4">🚗</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No vehicles yet</h3>
            <p className="text-muted mb-6 text-sm sm:text-base">Add your first vehicle to get started with DIP benefits.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="card hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getVehicleIcon(vehicle.make) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getVehicleIcon(vehicle.make) as string} alt={`${vehicle.make} logo`} className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="text-3xl">🚗</span>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{vehicle.year} {vehicle.make}</h3>
                      <p className="text-muted">{vehicle.model}</p>
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
                      <span className="text-muted w-12">VIN:</span>
                      <span className="font-mono">{vehicle.vin}</span>
                    </div>
                  )}
                  {vehicle.licensePlate && (
                    <div className="flex items-center text-sm">
                      <span className="text-muted w-12">Plate:</span>
                      <span className="font-medium">{vehicle.licensePlate}</span>
                    </div>
                  )}
                  {vehicle.state && (
                    <div className="flex items-center text-sm">
                      <span className="text-muted w-12">State:</span>
                      <span>{vehicle.state}</span>
                    </div>
                  )}
                </div>

                {/* Primary Actions */}
                <div className="flex gap-2 mb-3">
                  {!vehicle.isActive && (
                    <button
                      className="btn bg-green-100 text-green-700 border-green-300 hover:bg-green-200 flex-1"
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
                    className={`btn bg-gray-100 text-black border-gray-300 hover:bg-gray-200 ${vehicle.isActive ? 'flex-1' : 'flex-1'}`}
                  >
                    Manage Membership
                  </Link>
                </div>

                {/* Secondary Actions */}
                <div className="flex gap-2 mb-2">
                  <button
                    className="btn btn-outline flex-1"
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setShowPhotoModal(true);
                    }}
                  >
                    📸 View Photos
                  </button>
                  <button
                    className="btn btn-outline flex-1"
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
                    className="btn btn-outline text-red-600 hover:bg-red-50 flex-1"
                    onClick={() => {
                      setDeletingVehicleId(vehicle.id);
                      setShowDeleteModal(true);
                    }}
                    title="Delete vehicle"
                  >
                    🗑️ Delete Vehicle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="card w-full max-w-lg bg-white">
            <h3 className="text-xl font-semibold mb-4" style={{color: '#000'}}>Edit Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">VIN</label>
                <input 
                  className="input uppercase" 
                  value={editForm.vin} 
                  maxLength={17}
                  placeholder="17 CHARACTERS"
                  style={{ textTransform: 'uppercase' }}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
                    setEditForm({ ...editForm, vin: value });
                  }}
                />
                <p className="text-xs text-muted mt-1">VIN must be exactly 17 characters</p>
              </div>
              <div>
                <label className="label">License Plate</label>
                <input 
                  className="input uppercase" 
                  value={editForm.licensePlate}
                  maxLength={7}
                  placeholder="6–7 CHARACTERS"
                  style={{ textTransform: 'uppercase' }}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                    setEditForm({ ...editForm, licensePlate: value });
                  }}
                />
                <p className="text-xs text-muted mt-1">License plate must be 6–7 characters</p>
              </div>
              <div>
                <label className="label">State</label>
                <input 
                  className="input uppercase" 
                  value={editForm.state} 
                  placeholder="STATE"
                  maxLength={2}
                  style={{ textTransform: 'uppercase' }}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
                    setEditForm({ ...editForm, state: value });
                  }}
                />
                <p className="text-xs text-muted mt-1">State must be exactly 2 characters (e.g., CA, NY, TX)</p>
              </div>
              <div>
                <label className="label">Color</label>
                <input 
                  className="input uppercase" 
                  value={editForm.color} 
                  placeholder="VEHICLE COLOR"
                  style={{ textTransform: 'uppercase' }}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, '').slice(0, 20);
                    setEditForm({ ...editForm, color: value });
                  }}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
              <button
                className="btn btn-primary"
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
          <div className="card w-full max-w-md bg-white">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-xl font-semibold">Delete Vehicle</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this vehicle? This action cannot be undone and will remove all associated data including photos and documents.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <div className="flex items-center space-x-2 text-sm text-red-700">
                <span>⚠️</span>
                <span>This will permanently delete the vehicle and all its data</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingVehicleId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteVehicle(deletingVehicleId)}
                disabled={deletingVehicleId === null || deletingVehicle}
              >
                {deletingVehicle ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
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
          <div className="card w-full max-w-4xl bg-white max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                Photos - {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowPhotoModal(false);
                  setSelectedVehicle(null);
                  setExpandedPhoto(null);
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
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
                            className="btn btn-primary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPhoto(photoUrl);
                            }}
                          >
                            🔍 View
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
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
                  <div className="text-6xl mb-4">📸</div>
                  <h4 className="text-lg font-semibold mb-2">No photos yet</h4>
                  <p className="text-muted">Upload photos of your vehicle to view them here.</p>
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
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              onClick={() => setExpandedPhoto(null)}
            >
              ✕
            </button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
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


