'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClaimDraft, subscribeMyClaims, subscribeMyProfile, subscribeMyVehicles, submitClaim, uploadClaimPhoto } from '@/lib/firebase/memberActions';
import BackButton from '@/components/BackButton';

export default function MyRequestsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState<{ vehicleId: string; description: string; phone: string; photos: File[] }>({ 
    vehicleId: '', description: '', phone: '', photos: [] 
  });

  useEffect(() => {
    const unsubProfile = subscribeMyProfile((p) => {
      setProfile(p);
      if (p?.phoneNumber && !form.phone) {
        setForm(f => ({ ...f, phone: p.phoneNumber }));
      }
    });
    try {
      const unsubVehicles = subscribeMyVehicles((rows) => setVehicles(rows));
      const unsubClaims = subscribeMyClaims((rows) => { setClaims(rows); setLoading(false); });
      return () => { try { (unsubVehicles as any)?.(); (unsubClaims as any)?.(); (unsubProfile as any)?.(); } catch {} };
    } catch { setLoading(false); }
  }, []);

  const selectedVehicle = useMemo(() => vehicles.find((v) => v.id === form.vehicleId), [vehicles, form.vehicleId]);
  const activeVehicles = vehicles.filter(v => v.isActive);

  async function handleSubmit() {
    if (!selectedVehicle || !form.phone || form.photos.length === 0) return;
    
    setSubmitting(true);
    try {
      const claimId = await createClaimDraft({ 
        id: selectedVehicle.id, 
        make: selectedVehicle.make, 
        model: selectedVehicle.model, 
        year: selectedVehicle.year,
        vin: selectedVehicle.vin
      }, profile);
      
      const urls: string[] = [];
      for (const f of form.photos) {
        const url = await uploadClaimPhoto(claimId, f);
        urls.push(url);
      }
      
      await submitClaim(claimId, { 
        amount: 0, 
        description: form.description, 
        userPhoneNumber: form.phone, 
        photoURLs: urls, 
        date: new Date() 
      });
      
      setForm({ vehicleId: '', description: '', phone: profile?.phoneNumber || '', photos: [] });
      setStep(1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; icon: string }> = {
      'Pending': { class: 'badge-warning', icon: '⏳' },
      'In Review': { class: 'badge-info', icon: '👀' },
      'Approved': { class: 'badge-success', icon: '✅' },
      'Denied': { class: 'badge-error', icon: '❌' }
    };
    const config = statusConfig[status] || { class: 'badge-info', icon: '❓' };
    return (
      <span className={`badge ${config.class}`}>
        {config.icon} {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-muted">Loading your requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex justify-start">
        <BackButton />
      </div>
      
      {/* Success Message */}
      {showSuccess && (
        <div className="card-accent bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="font-semibold text-green-800">Request Submitted Successfully!</h3>
              <p className="text-green-600 text-sm">You can view your request details and add more photos anytime from the requests list below.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* File New Claim */}
      <div className="card-accent">
        <div className="flex items-center space-x-3 mb-6">
          <span className="text-2xl">📋</span>
          <h2 className="text-xl font-semibold">File New Request</h2>
        </div>

        {activeVehicles.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🚫</div>
            <p className="text-muted mb-4">You need at least one active vehicle to file a request.</p>
            <a href="/dashboard/vehicles" className="btn btn-primary">Add Vehicle</a>
          </div>
        ) : (
          <>
            {/* Step Indicator */}
            <div className="flex items-center space-x-4 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step >= s ? 'text-white' : 'bg-gray-200 text-muted'
                  }`} style={{backgroundColor: step >= s ? 'var(--brand)' : undefined}}>
                    {s}
                  </div>
                  {s < 3 && <div className={`w-8 h-0.5 mx-2`} style={{backgroundColor: step > s ? 'var(--brand)' : '#e2e8f0'}}></div>}
                </div>
              ))}
            </div>

            {/* Step 1: Vehicle Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Step 1: Select Vehicle</h3>
                <div>
                  <label className="label">Select Vehicle</label>
                  <select className="input" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                    <option value="">Choose your vehicle...</option>
                    {activeVehicles.map((v) => (
                      <option key={v.id} value={v.id}>{`${v.year} ${v.make} ${v.model}`}</option>
                    ))}
                  </select>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setStep(2)}
                  disabled={!form.vehicleId}
                >
                  Next: Contact Info
                </button>
              </div>
            )}

            {/* Step 2: Contact & Description */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Step 2: Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Phone Number (Required)</label>
                    <input 
                      className="input" 
                      placeholder="(555) 123-4567" 
                      value={form.phone} 
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    />
                    <p className="text-xs text-muted mt-1">We'll use this to contact you about your request</p>
                  </div>
                  <div>
                    <label className="label">Description (Optional)</label>
                    <textarea 
                      className="input" 
                      rows={3} 
                      placeholder="Describe what happened..."
                      value={form.description} 
                      onChange={(e) => setForm({ ...form, description: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setStep(3)}
                    disabled={!form.phone}
                  >
                    Next: Upload Photos
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Photos & Submit */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Step 3: Upload Photos</h3>
                <div>
                  <label className="label">Damage Photos (Required)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="input" 
                    onChange={(e) => setForm({ ...form, photos: Array.from(e.target.files || []) })} 
                  />
                  <p className="text-xs text-muted mt-1">Upload clear photos of the damage from multiple angles</p>
                  {form.photos.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">✓ {form.photos.length} photo(s) selected</p>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mt-6 border border-gray-200">
                  <h4 className="font-medium mb-3">Request Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Vehicle:</span>
                      <span>{selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : ''}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted">Contact:</span>
                      <span>{form.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Photos:</span>
                      <span>{form.photos.length} uploaded</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                  <button 
                    className="btn btn-success" 
                    onClick={handleSubmit}
                    disabled={form.photos.length === 0 || submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="loading-spinner mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🚀</span>
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* My Claims */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">My Requests</h2>
          <div className="text-sm text-muted">
            {claims.length} total requests
          </div>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No requests yet</h3>
            <p className="text-muted">When you file a request, it will appear here.</p>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-xl">💡</span>
                <div>
                  <h4 className="font-medium text-blue-800">Need to add more photos?</h4>
                  <p className="text-blue-600 text-sm">Click on any request below to view details and upload additional photos.</p>
                </div>
              </div>
            </div>
          <div className="space-y-4">
            {claims.map((claim) => (
              <div key={claim.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => window.location.href = `/dashboard/claims/${claim.id}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🚗</span>
                    <div>
                      <h3 className="font-semibold">{claim.vehicleYear} {claim.vehicleMake} {claim.vehicleModel}</h3>
                      <p className="text-sm text-muted">Request #{claim.id.slice(-8)}</p>
                    </div>
                  </div>
                  {getStatusBadge(claim.status)}
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted">Deductible Amount:</span>
                    <div className="font-semibold">
                      {claim.amount && claim.amount > 0 ? `$${claim.amount.toFixed(2)}` : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted">Date:</span>
                    <div>{claim.date?.toDate?.()?.toLocaleDateString?.() || 'Unknown'}</div>
                  </div>
                  <div>
                    <span className="text-muted">Photos:</span>
                    <div>{claim.photoURLs?.length || 0} uploaded</div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Click to view details and add photos</span>
                    <span className="text-xs text-blue-600">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}


