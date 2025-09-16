'use client';
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { addVehicle, setVehicleActive, subscribeMyVehicles, updateVehicle, uploadMyVehiclePhoto, updatePaymentMethod, deleteVehicle, deleteVehiclePhoto, subscribeMyProfile } from '@/lib/firebase/memberActions';
import carData from '@/lib/car_data.json';
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

function MyVehiclesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [form, setForm] = useState({ make: '', model: '', year: '', vin: '', licensePlate: '', state: '', color: '' });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ vin: string; licensePlate: string; state: string; color: string }>({ vin: '', licensePlate: '', state: '', color: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [activatingVehicleId, setActivatingVehicleId] = useState<string | null>(null);
  const [billingForm, setBillingForm] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: ''
  });
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activatingBilling, setActivatingBilling] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [billingErrors, setBillingErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    try {
      const unsub = subscribeMyVehicles((rows) => {
        setVehicles(rows);
        setLoading(false);
      });
      const unsubProfile = subscribeMyProfile((p) => setProfile(p));
      return () => { try { (unsub as any)?.(); unsubProfile?.(); } catch {} };
    } catch {
      setLoading(false);
    }
  }, []);

  // Handle return from Stripe Checkout (webhook-first)
  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    const vehicleId = searchParams?.get('vehicleId');
    if (!sessionId || !vehicleId) return;

    async function finalizeActivation() {
      try {
        setActivatingVehicleId(vehicleId as string);
        // Poll vehicle doc briefly for webhook to flip isActive
        const start = Date.now();
        let active = false;
        while (Date.now() - start < 45000) { // up to 45s
          const resp = await fetch(`/api/stripe/confirm-session?session_id=${encodeURIComponent(sessionId as string)}`);
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error || 'Failed to confirm session');
          active = data.status === 'active' || data.status === 'trialing';
          if (active) break;
          await new Promise((r) => setTimeout(r, 3000));
        }

        // Fallback: immediately flip isActive on the vehicle document for UI responsiveness
        try {
          await setVehicleActive(vehicleId as string, true);
        } catch {}
      } catch (e) {
        console.error('Finalize activation failed', e);
        alert('Activation completed, but we could not update your vehicle automatically. If it still shows inactive, refresh or contact support.');
      } finally {
        setActivatingVehicleId(null);
        // Clean the query string
        try {
          router.replace('/dashboard/vehicles');
        } catch {}
      }
    }

    finalizeActivation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  function validateBillingForm() {
    const errors: {[key: string]: string} = {};
    
    // Validate cardholder name
    if (!billingForm.name.trim()) {
      errors.name = 'Cardholder name is required';
    } else if (billingForm.name.trim().length < 2) {
      errors.name = 'Cardholder name must be at least 2 characters';
    }
    
    // Validate card number
    const cleanCardNumber = billingForm.cardNumber.replace(/\s/g, '');
    if (!cleanCardNumber) {
      errors.cardNumber = 'Card number is required';
    } else if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      errors.cardNumber = 'Card number must be 13-19 digits';
    }
    
    // Validate expiry date
    if (!billingForm.expiry) {
      errors.expiry = 'Expiry date is required';
    } else if (!billingForm.expiry.match(/^\d{2}\/\d{2}$/)) {
      errors.expiry = 'Expiry date must be in MM/YY format';
    } else {
      const [month, year] = billingForm.expiry.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        errors.expiry = 'Invalid month';
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        errors.expiry = 'Card has expired';
      }
    }
    
    // Validate CVV
    if (!billingForm.cvv) {
      errors.cvv = 'CVV is required';
    } else if (billingForm.cvv.length < 3 || billingForm.cvv.length > 4) {
      errors.cvv = 'CVV must be 3-4 digits';
    }
    
    // Validate street address
    if (!billingForm.streetAddress.trim()) {
      errors.streetAddress = 'Street address is required';
    } else if (billingForm.streetAddress.trim().length < 5) {
      errors.streetAddress = 'Street address must be at least 5 characters';
    }
    
    // Validate city
    if (!billingForm.city.trim()) {
      errors.city = 'City is required';
    } else if (billingForm.city.trim().length < 2) {
      errors.city = 'City must be at least 2 characters';
    }
    
    // Validate state
    if (!billingForm.state.trim()) {
      errors.state = 'State is required';
    } else if (!billingForm.state.match(/^[A-Z]{2}$/)) {
      errors.state = 'State must be 2 letters (e.g., CA, NY, TX)';
    }
    
    // Validate ZIP code
    if (!billingForm.zip.trim()) {
      errors.zip = 'ZIP code is required';
    } else if (!billingForm.zip.match(/^\d{5}$/)) {
      errors.zip = 'ZIP code must be 5 digits';
    }
    
    setBillingErrors(errors);
    return Object.keys(errors).length === 0;
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
      
      {/* Add Vehicle Form */}
      <div className="card-accent">
        <div className="flex items-center space-x-3 mb-6">
          <span className="text-2xl">➕</span>
          <h2 className="text-xl font-semibold">Add New Vehicle</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="label">Year</label>
            <select
              className="input"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            >
              <option value="">Select year…</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Make</label>
            <select
              className="input"
              value={form.make}
              onChange={(e) => {
                setForm({ ...form, make: e.target.value, model: '' });
              }}
            >
              <option value="">Select make…</option>
              {makeOptions.map((mk) => (
                <option key={mk} value={mk}>{mk}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Model</label>
            <select
              className="input"
              value={form.model}
              onChange={(e) => {
                const nextModel = e.target.value;
                // Preselect the most recent year for UX
                const makeEntry: any = carData.find((m: any) => m.make === form.make);
                const modelEntry: any = makeEntry?.models.find((mm: any) => mm.name === nextModel);
                const years: string[] = modelEntry ? [...modelEntry.years].sort((a: string, b: string) => Number(b) - Number(a)) : [];
                setForm({ ...form, model: nextModel, year: years[0] || '' });
              }}
              disabled={!form.make}
            >
              <option value="">Select model…</option>
              {modelOptions.map((md) => (
                <option key={md} value={md}>{md}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">State</label>
            <input 
              className="input uppercase" 
              placeholder="STATE"
              value={form.state}
              maxLength={2}
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
                setForm({ ...form, state: value });
              }}
            />
            <p className="text-xs text-muted mt-1">State must be exactly 2 characters (e.g., CA, NY, TX)</p>
          </div>
          <div>
            <label className="label">VIN</label>
            <input 
              className="input uppercase" 
              placeholder="17 CHARACTERS"
              value={form.vin}
              maxLength={17}
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
                setForm({ ...form, vin: value });
              }}
            />
            <p className="text-xs text-muted mt-1">VIN must be exactly 17 characters</p>
          </div>
          <div>
            <label className="label">License Plate</label>
            <input 
              className="input uppercase" 
              placeholder="6–7 CHARACTERS"
              value={form.licensePlate}
              maxLength={7}
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                setForm({ ...form, licensePlate: value });
              }}
            />
            <p className="text-xs text-muted mt-1">License plate must be 6–7 characters</p>
          </div>
          <div className="flex items-end">
            <button 
              className="btn btn-primary w-full" 
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
                  Adding...
                </>
              ) : (
                <>
                  <span className="mr-2">🚗</span>
                  Add Vehicle
                </>
              )}
            </button>
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
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold mb-2">No vehicles yet</h3>
            <p className="text-muted mb-6">Add your first vehicle to get started with DIP benefits.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => {
              const billingActive = vehicle?.stripe?.status === 'active' || vehicle?.stripe?.status === 'trialing';
              const showActive = Boolean(billingActive || vehicle?.isActive);
              const needsBilling = vehicle?.isActive && !billingActive;
              return (
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
                    showActive
                      ? 'bg-green-100 text-green-800'
                      : needsBilling
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {showActive ? 'Active' : needsBilling ? 'Needs Billing' : 'Inactive'}
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
                  {showActive ? (
                    <button
                      className="btn bg-red-100 text-red-700 border-red-300 hover:bg-red-200 flex-1"
                      onClick={async () => {
                        try {
                          setActivatingVehicleId(vehicle.id);
                          const resp = await fetch('/api/stripe/cancel-vehicle', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ vehicleId: vehicle.id }),
                          });
                          const data = await resp.json();
                          if (!resp.ok) throw new Error(data.error || 'Failed to cancel membership');
                        } catch (e) {
                          console.error('Cancel membership failed', e);
                          alert('Failed to cancel membership. Please try again.');
                        } finally {
                          setActivatingVehicleId(null);
                        }
                      }}
                    >
                      {activatingVehicleId === vehicle.id ? 'Processing…' : 'Deactivate'}
                    </button>
                  ) : (
                    <button
                      className="btn bg-green-100 text-green-700 border-green-300 hover:bg-green-200 flex-1"
                      onClick={async () => {
                        try {
                          setActivatingVehicleId(vehicle.id);
                          
                          // If vehicle is marked as active but has no Stripe subscription, reset it first
                          if (needsBilling) {
                            console.log('Resetting vehicle active status before checkout');
                            await setVehicleActive(vehicle.id, false);
                          }
                          
                          const resp = await fetch('/api/stripe/create-checkout-session', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              vehicleId: vehicle.id,
                              userId: profile?.uid,
                              customerEmail: profile?.email,
                              customerId: profile?.stripe?.customerId,
                              vin: vehicle.vin,
                              licensePlate: vehicle.licensePlate,
                            }),
                          });
                          const data = await resp.json();
                          if (!resp.ok) throw new Error(data.error || 'Failed to start billing');
                          if (!data.url) throw new Error('Missing checkout URL');
                          window.location.href = data.url as string;
                        } catch (e) {
                          console.error('Start checkout failed', e);
                          alert('Failed to start checkout. Please try again.');
                          setActivatingVehicleId(null);
                        }
                      }}
                    >
                      {activatingVehicleId === vehicle.id ? 'Redirecting…' : 'Activate'}
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
              );
            })}
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

      {/* Billing Modal for Vehicle Activation */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-2xl bg-white">
            <h3 className="text-xl font-semibold mb-4">Billing Information Required</h3>
            <p className="text-gray-600 mb-4">
                              To activate your vehicle benefits, please provide your billing information for the monthly membership fee.
            </p>
            
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                
                // Validate form and show errors
                if (!validateBillingForm()) {
                  return;
                }
                
                try {
                  setActivatingBilling(true);
                  console.log('Submitting billing form:', billingForm);
                  
                  if (activatingVehicleId) {
                    console.log('Updating payment method for vehicle:', activatingVehicleId);
                    await updatePaymentMethod(activatingVehicleId, billingForm);
                    console.log('Payment method updated successfully');
                    
                    console.log('Activating vehicle:', activatingVehicleId);
                    await setVehicleActive(activatingVehicleId, true);
                    console.log('Vehicle activated successfully');
                  } else {
                    throw new Error('No vehicle ID found for activation');
                  }
                  
                  setShowBillingModal(false);
                  setActivatingVehicleId(null);
                  setBillingForm({
                    cardNumber: '',
                    expiry: '',
                    cvv: '',
                    name: '',
                    streetAddress: '',
                    city: '',
                    state: '',
                    zip: ''
                  });
                  
                  alert('Vehicle activated successfully!');
                } catch (error) {
                  console.error('Error updating billing:', error);
                  alert('Failed to activate vehicle. Please check your billing information and try again.');
                } finally {
                  setActivatingBilling(false);
                }
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Payment Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 mb-3">Payment Information</h4>
                  
                  <div>
                    <label className="label">Cardholder Name</label>
                    <input
                      type="text"
                      className={`input ${billingErrors.name ? 'border-red-500 bg-red-50' : ''}`}
                      placeholder="John Doe"
                      value={billingForm.name}
                      onChange={(e) => {
                        setBillingForm({ ...billingForm, name: e.target.value });
                        if (billingErrors.name) {
                          setBillingErrors({ ...billingErrors, name: '' });
                        }
                      }}
                      required
                    />
                    {billingErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{billingErrors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="label">Card Number</label>
                    <input
                      type="text"
                      className={`input ${billingErrors.cardNumber ? 'border-red-500 bg-red-50' : ''}`}
                      placeholder="1234 5678 9012 3456"
                      value={billingForm.cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                        if (value.length <= 19) setBillingForm({ ...billingForm, cardNumber: value });
                        if (billingErrors.cardNumber) {
                          setBillingErrors({ ...billingErrors, cardNumber: '' });
                        }
                      }}
                      required
                    />
                    {billingErrors.cardNumber && (
                      <p className="text-red-500 text-sm mt-1">{billingErrors.cardNumber}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Expiry Date</label>
                      <input
                        type="text"
                        className={`input ${billingErrors.expiry ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="MM/YY"
                        value={billingForm.expiry}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) {
                            value = value.substring(0, 2) + '/' + value.substring(2, 4);
                          }
                          if (value.length <= 5) setBillingForm({ ...billingForm, expiry: value });
                          if (billingErrors.expiry) {
                            setBillingErrors({ ...billingErrors, expiry: '' });
                          }
                        }}
                        required
                      />
                      {billingErrors.expiry && (
                        <p className="text-red-500 text-sm mt-1">{billingErrors.expiry}</p>
                      )}
                    </div>
                    <div>
                      <label className="label">CVV</label>
                      <input
                        type="text"
                        className={`input ${billingErrors.cvv ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="123"
                        value={billingForm.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 4) setBillingForm({ ...billingForm, cvv: value });
                          if (billingErrors.cvv) {
                            setBillingErrors({ ...billingErrors, cvv: '' });
                          }
                        }}
                        required
                      />
                      {billingErrors.cvv && (
                        <p className="text-red-500 text-sm mt-1">{billingErrors.cvv}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Billing Address */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 mb-3">Billing Address</h4>
                  
                  <div>
                    <label className="label">Street Address</label>
                    <input
                      type="text"
                      className={`input ${billingErrors.streetAddress ? 'border-red-500 bg-red-50' : ''}`}
                      placeholder="123 Main St"
                      value={billingForm.streetAddress}
                      onChange={(e) => {
                        setBillingForm({ ...billingForm, streetAddress: e.target.value });
                        if (billingErrors.streetAddress) {
                          setBillingErrors({ ...billingErrors, streetAddress: '' });
                        }
                      }}
                      required
                    />
                    {billingErrors.streetAddress && (
                      <p className="text-red-500 text-sm mt-1">{billingErrors.streetAddress}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">City</label>
                      <input
                        type="text"
                        className={`input ${billingErrors.city ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="Los Angeles"
                        value={billingForm.city}
                        onChange={(e) => {
                          setBillingForm({ ...billingForm, city: e.target.value });
                          if (billingErrors.city) {
                            setBillingErrors({ ...billingErrors, city: '' });
                          }
                        }}
                        required
                      />
                      {billingErrors.city && (
                        <p className="text-red-500 text-sm mt-1">{billingErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="label">State</label>
                      <input
                        type="text"
                        className={`input uppercase ${billingErrors.state ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="CA"
                        value={billingForm.state}
                        maxLength={2}
                        style={{ textTransform: 'uppercase' }}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
                          setBillingForm({ ...billingForm, state: value });
                          if (billingErrors.state) {
                            setBillingErrors({ ...billingErrors, state: '' });
                          }
                        }}
                        required
                      />
                      {billingErrors.state && (
                        <p className="text-red-500 text-sm mt-1">{billingErrors.state}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="label">ZIP Code</label>
                    <input
                      type="text"
                      className={`input ${billingErrors.zip ? 'border-red-500 bg-red-50' : ''}`}
                      placeholder="90210"
                      value={billingForm.zip}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={5}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 5);
                        setBillingForm({ ...billingForm, zip: digitsOnly });
                        if (billingErrors.zip) {
                          setBillingErrors({ ...billingErrors, zip: '' });
                        }
                      }}
                      required
                    />
                    {billingErrors.zip && (
                      <p className="text-red-500 text-sm mt-1">{billingErrors.zip}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <span>💰</span>
                  <span>Monthly membership fee: $20/month</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowBillingModal(false);
                    setActivatingVehicleId(null);
                    setBillingErrors({});
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={activatingBilling}
                >
                  {activatingBilling ? (
                    <>
                      <div className="loading-spinner mr-2"></div>
                      Activating...
                    </>
                  ) : (
                    'Activate Vehicle'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>🔒</span>
                <span>Your payment information is secure and encrypted</span>
              </div>
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
    <Suspense fallback={<div className="card text-center py-12"><div className="loading-spinner mx-auto mb-4"></div><p className="text-muted">Loading…</p></div>}>
      <MyVehiclesContent />
    </Suspense>
  );
}


