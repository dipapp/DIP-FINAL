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
      
      {/* Quantum Vehicle Registration Portal */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-600 rounded-3xl blur-lg opacity-40 group-hover:opacity-60 transition-all duration-500"></div>
        <div className="relative bg-black/70 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl shadow-purple-500/20 overflow-hidden">
          {/* Quantum Progress Matrix */}
          <div className="h-2 bg-gradient-to-r from-black via-gray-800 to-black relative overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-1000 ease-out relative"
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
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
          </div>

          <div className="p-8">
            {/* Holographic Header */}
            <div className="text-center mb-10">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute -inset-4 rounded-full border-2 border-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-spin" style={{ animationDuration: '6s' }}></div>
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 opacity-30 blur-lg animate-pulse"></div>
                
                <div className="relative w-20 h-20 bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50">
                  <span className="text-3xl">🚗</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                </div>
                
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-cyan-400 rounded-full animate-ping"></div>
                <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-0 left-0 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
              </div>
              
              <h2 className="text-4xl font-black bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent mb-4 tracking-tight">
                QUANTUM VEHICLE PORTAL
              </h2>
              <p className="text-gray-300 text-xl font-medium tracking-wide">
                Advanced Vehicle Registration Matrix
              </p>
            </div>

            {/* Holographic Form Matrix */}
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Phase 1: Vehicle Intelligence */}
              <div className="group/phase relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 rounded-2xl blur opacity-30 group-hover/phase:opacity-50 transition-all duration-500"></div>
                <div className="relative bg-black/50 backdrop-blur-2xl border border-cyan-400/30 rounded-2xl p-8 shadow-2xl shadow-cyan-500/20">
                  <div className="flex items-center mb-6">
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center mr-4 transition-all duration-500 ${
                      form.make && form.model && form.year 
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl shadow-emerald-500/50' 
                        : 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-2xl shadow-cyan-500/50'
                    }`}>
                      {form.make && form.model && form.year ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xl font-black text-white">1</span>
                      )}
                      {form.make && form.model && form.year && (
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl animate-pulse opacity-50"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent tracking-wide">
                        VEHICLE INTELLIGENCE
                      </h3>
                      <p className="text-cyan-300 font-medium">Neural vehicle identification</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group/field relative">
                      <label className="block text-sm font-black text-cyan-300 mb-3 tracking-wider uppercase">Year</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-4 bg-black/40 backdrop-blur-xl border border-cyan-400/30 rounded-xl focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-white font-bold shadow-lg shadow-cyan-500/10"
                          value={form.year}
                          onChange={(e) => setForm({ ...form, year: e.target.value })}
                        >
                          <option value="" className="bg-black text-gray-400">Select year</option>
                          {yearOptions.map((y) => (
                            <option key={y} value={y} className="bg-black text-white">{y}</option>
                          ))}
                        </select>
                        {form.year && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="group/field relative">
                      <label className="block text-sm font-black text-cyan-300 mb-3 tracking-wider uppercase">Make</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-4 bg-black/40 backdrop-blur-xl border border-cyan-400/30 rounded-xl focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-white font-bold shadow-lg shadow-cyan-500/10"
                          value={form.make}
                          onChange={(e) => {
                            setForm({ ...form, make: e.target.value, model: '' });
                          }}
                        >
                          <option value="" className="bg-black text-gray-400">Select make</option>
                          {makeOptions.map((mk) => (
                            <option key={mk} value={mk} className="bg-black text-white">{mk}</option>
                          ))}
                        </select>
                        {form.make && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="group/field relative">
                      <label className="block text-sm font-black text-cyan-300 mb-3 tracking-wider uppercase">Model</label>
                      <div className="relative">
                        <select
                          className={`w-full px-4 py-4 backdrop-blur-xl border rounded-xl transition-all duration-300 font-bold shadow-lg ${
                            !form.make 
                              ? 'bg-black/20 border-gray-600/30 text-gray-500 cursor-not-allowed' 
                              : 'bg-black/40 border-cyan-400/30 text-white focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 shadow-cyan-500/10'
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
                          <option value="" className="bg-black text-gray-400">Select model</option>
                          {modelOptions.map((md) => (
                            <option key={md} value={md} className="bg-black text-white">{md}</option>
                          ))}
                        </select>
                        {form.model && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 2: Quantum Registration */}
              <div className="group/phase relative">
                <div className={`absolute -inset-1 rounded-2xl blur transition-all duration-500 ${
                  form.make && form.model && form.year
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-green-600 opacity-30 group-hover/phase:opacity-50'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 opacity-20'
                }`}></div>
                <div className={`relative backdrop-blur-2xl border rounded-2xl p-8 shadow-2xl transition-all duration-500 ${
                  form.make && form.model && form.year
                    ? 'bg-black/50 border-emerald-400/30 shadow-emerald-500/20'
                    : 'bg-black/30 border-gray-600/30 shadow-gray-500/10'
                }`}>
                  <div className="flex items-center mb-6">
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center mr-4 transition-all duration-500 ${
                      form.state && form.vin.length === 17 && (form.licensePlate.length >= 6 && form.licensePlate.length <= 7)
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl shadow-emerald-500/50' 
                        : form.make && form.model && form.year
                          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl shadow-emerald-500/50'
                          : 'bg-gradient-to-br from-gray-500 to-gray-600 shadow-xl shadow-gray-500/30'
                    }`}>
                      {form.state && form.vin.length === 17 && (form.licensePlate.length >= 6 && form.licensePlate.length <= 7) ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xl font-black text-white">2</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent tracking-wide">
                        QUANTUM REGISTRATION
                      </h3>
                      <p className="text-emerald-300 font-medium">Secure identification matrix</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group/field relative">
                      <label className="block text-sm font-black text-emerald-300 mb-3 tracking-wider uppercase">State</label>
                      <div className="relative">
                        <input 
                          className={`w-full px-4 py-4 backdrop-blur-xl border rounded-xl transition-all duration-300 font-black text-center text-lg uppercase tracking-widest shadow-lg ${
                            form.make && form.model && form.year
                              ? 'bg-black/40 border-emerald-400/30 text-white focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 shadow-emerald-500/10'
                              : 'bg-black/20 border-gray-600/30 text-gray-500 cursor-not-allowed shadow-gray-500/10'
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
                        {form.state && form.state.length === 2 && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="group/field relative">
                      <label className="block text-sm font-black text-emerald-300 mb-3 tracking-wider uppercase">VIN Matrix</label>
                      <div className="relative">
                        <input 
                          className={`w-full px-4 py-4 backdrop-blur-xl border rounded-xl transition-all duration-300 font-mono text-sm uppercase tracking-wide shadow-lg ${
                            form.make && form.model && form.year
                              ? 'bg-black/40 border-emerald-400/30 text-white focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 shadow-emerald-500/10'
                              : 'bg-black/20 border-gray-600/30 text-gray-500 cursor-not-allowed shadow-gray-500/10'
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
                        <div className="absolute bottom-1 left-2 text-xs text-emerald-400 font-mono">
                          <span className={form.vin.length === 17 ? 'text-emerald-300 font-bold' : 'text-gray-500'}>
                            [{form.vin.length}/17] CHARS
                          </span>
                        </div>
                        {form.vin.length === 17 && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="group/field relative">
                      <label className="block text-sm font-black text-emerald-300 mb-3 tracking-wider uppercase">License ID</label>
                      <div className="relative">
                        <input 
                          className={`w-full px-4 py-4 backdrop-blur-xl border rounded-xl transition-all duration-300 font-black text-center text-lg uppercase tracking-widest shadow-lg ${
                            form.make && form.model && form.year
                              ? 'bg-black/40 border-emerald-400/30 text-white focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 shadow-emerald-500/10'
                              : 'bg-black/20 border-gray-600/30 text-gray-500 cursor-not-allowed shadow-gray-500/10'
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
                        <div className="absolute bottom-1 left-2 text-xs text-emerald-400 font-mono">
                          <span className={(form.licensePlate.length >= 6 && form.licensePlate.length <= 7) ? 'text-emerald-300 font-bold' : 'text-gray-500'}>
                            [{form.licensePlate.length}/6-7] CHARS
                          </span>
                        </div>
                        {(form.licensePlate.length >= 6 && form.licensePlate.length <= 7) && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantum Activation Portal */}
              <div className="text-center pt-8">
                <div className="relative inline-block">
                  <button 
                    className={`group/quantum relative overflow-hidden inline-flex items-center justify-center px-12 py-6 text-2xl font-black text-white rounded-2xl shadow-2xl transform transition-all duration-500 ${
                      (!form.make || !form.model || !form.year || !form.state ||
                       form.vin.length !== 17 ||
                       form.licensePlate.length < 6 || form.licensePlate.length > 7 ||
                       adding)
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed scale-95 shadow-gray-500/20'
                        : 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-110 cursor-pointer'
                    }`}
                    onClick={createVehicle}
                    disabled={
                      !form.make || !form.model || !form.year || !form.state ||
                      form.vin.length !== 17 ||
                      form.licensePlate.length < 6 || form.licensePlate.length > 7 ||
                      adding
                    }
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 opacity-0 group-hover/quantum:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/quantum:translate-x-full transition-transform duration-1000"></div>
                    
                    {adding ? (
                      <div className="relative flex items-center">
                        <div className="loading-spinner mr-4"></div>
                        <span className="tracking-wider">QUANTUM ACTIVATION...</span>
                      </div>
                    ) : (
                      <div className="relative flex items-center">
                        <span className="mr-4 text-3xl">🚗</span>
                        <span className="tracking-wider">ACTIVATE QUANTUM PROTECTION</span>
                        <span className="ml-4 text-3xl">⚡</span>
                      </div>
                    )}
                  </button>
                  
                  {/* Quantum Indicators */}
                  {!adding && (form.make && form.model && form.year && form.state && form.vin.length === 17 && (form.licensePlate.length >= 6 && form.licensePlate.length <= 7)) && (
                    <>
                      <div className="absolute -top-3 -right-3 w-6 h-6 bg-emerald-400 rounded-full animate-ping"></div>
                      <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute -top-3 -left-3 w-3 h-3 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                      <div className="absolute -bottom-3 -right-3 w-5 h-5 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
                    </>
                  )}
                </div>
                
                {/* Quantum Success Matrix */}
                {(form.make && form.model && form.year && form.state && form.vin.length === 17 && (form.licensePlate.length >= 6 && form.licensePlate.length <= 7)) && (
                  <div className="mt-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 rounded-2xl blur-xl opacity-40 animate-pulse"></div>
                    <div className="relative bg-black/60 backdrop-blur-2xl border border-emerald-400/40 rounded-2xl p-6 shadow-2xl shadow-emerald-500/30">
                      <div className="flex items-center justify-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/50">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-30"></div>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black text-white tracking-wider mb-1">
                            QUANTUM LOCK: {form.year} {form.make} {form.model}
                          </p>
                          <p className="text-emerald-300 font-bold tracking-wide">PROTECTION MATRIX READY</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantum Vehicle Fleet */}
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-500/50">
              <span className="text-xl text-white">🚗</span>
            </div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent tracking-wide">
              QUANTUM FLEET
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-black/50 backdrop-blur-xl border border-emerald-400/30 rounded-xl px-4 py-2 shadow-lg shadow-emerald-500/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-300 font-bold text-sm tracking-wider">{vehicles.filter(v => v.isActive).length} ACTIVE</span>
              </div>
            </div>
            <div className="bg-black/50 backdrop-blur-xl border border-cyan-400/30 rounded-xl px-4 py-2 shadow-lg shadow-cyan-500/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-300 font-bold text-sm tracking-wider">{vehicles.length} TOTAL</span>
              </div>
            </div>
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


