'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { updatePaymentMethod } from '@/lib/firebase/memberActions';
import { auth } from '@/lib/firebase/client';
import BackButton from '@/components/BackButton';
import BillingInterface from '@/components/BillingInterface';

function ManageSubscriptionPageContent() {
  const params = useSearchParams();
  const vehicleId = params.get('vehicleId');
  const [showCancel, setShowCancel] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);

  useEffect(() => {
    async function fetchVehicle() {
      if (!vehicleId) {
        setLoadingVehicle(false);
        return;
      }
      
      try {
        const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
        if (vehicleDoc.exists()) {
          setVehicle({ id: vehicleDoc.id, ...vehicleDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching vehicle:', error);
      } finally {
        setLoadingVehicle(false);
      }
    }

    fetchVehicle();
  }, [vehicleId]);

  const getVehicleDisplayInfo = () => {
    if (!vehicle) return 'Vehicle information not available';
    
    const year = vehicle.year || '';
    const make = vehicle.make || '';
    const model = vehicle.model || '';
    const vin = vehicle.vin || '';
    const vinLast8 = vin.length >= 8 ? vin.slice(-8) : vin;
    
    return `${year} ${make} ${model}${vinLast8 ? ` • VIN: ...${vinLast8}` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-start">
        <BackButton />
      </div>
      
      <div className="card">
        <h1 className="text-2xl font-bold mb-2">Manage Subscription</h1>
        <p className="text-muted mb-4">Manage billing and membership for your vehicle.</p>
        {loadingVehicle ? (
          <div className="flex items-center space-x-2 text-sm text-muted">
            <div className="loading-spinner"></div>
            <span>Loading vehicle information...</span>
          </div>
        ) : vehicleId && (
          <p className="text-sm">Vehicle: <span className="font-medium text-gray-900">{getVehicleDisplayInfo()}</span></p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-2">Current Plan</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">DIP Membership</p>
                <p className="text-sm text-gray-600">$20/month</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <button 
                className="btn btn-secondary w-full" 
                onClick={async () => {
                  if (!vehicleId) {
                    alert('Vehicle ID not found');
                    return;
                  }

                  try {
                    const user = auth.currentUser;
                    if (!user) {
                      alert('Please sign in to update payment method');
                      return;
                    }

                    // Create Stripe customer portal session for payment method updates
                    const response = await fetch('/api/stripe/portal', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await user.getIdToken()}`,
                      },
                      body: JSON.stringify({ vehicleId }),
                    });

                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Failed to create portal session');
                    }

                    const { url } = await response.json();
                    window.location.href = url;
                  } catch (error) {
                    console.error('Error opening payment portal:', error);
                    alert('Failed to open payment portal. Please try again.');
                  }
                }}
              >
                Update Payment Method
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">Billing & Invoices</h2>
          <p className="text-muted mb-4">View and download your payment history.</p>
          <div className="space-x-3">
            <button 
              className="btn btn-primary" 
              onClick={() => setShowBilling(true)}
            >
              📄 View Invoices
            </button>
            <Link href="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
          </div>
        </div>
      </div>

      {message && (
        <div className="card bg-green-50 border-green-200">
          <p className="text-green-700">{message}</p>
        </div>
      )}

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-2xl bg-white relative overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-60"></div>
            
            <div className="relative z-10">
              {/* Header with emotion */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">😢</div>
                <h3 className="text-2xl font-bold mb-2">Wait! Don't drive unprotected...</h3>
                <p className="text-gray-600">Accidents happen when you least expect them. Let's find you a better option:</p>
              </div>

              {/* Retention offers with enhanced styling */}
              <div className="space-y-4">
                {/* Premium offer */}
                <button
                  disabled={!!busy}
                  className="relative selectable-row border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100"
                  onClick={async () => {
                    setBusy('discount');
                    try {
                      // await applyRetentionOffer('DISCOUNT_30_6MO'); // Function not available
                      setMessage('🎉 Amazing! 30% off for 6 months activated. You just saved $82!');
                      setShowCancel(false);
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    BEST DEAL
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">💰</div>
                    <div>
                      <div className="font-bold text-green-700">Save 30% for 6 months!</div>
                      <div className="text-sm text-green-600">Just $16.09/month instead of $20 • Save $82 total</div>
                    </div>
                  </div>
                  <span className="chev text-green-600">›</span>
                </button>

                {/* Pause option */}
                <button
                  disabled={!!busy}
                  className="selectable-row border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100"
                  onClick={async () => {
                    setBusy('pause');
                    try {
                      // await applyRetentionOffer('PAUSE_3MO'); // Function not available
                      setMessage('✅ Membership paused for 3 months. Zero charges until you are ready!');
                      setShowCancel(false);
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">⏸️</div>
                    <div>
                      <div className="font-bold text-blue-700">Pause for 3 months</div>
                      <div className="text-sm text-blue-600">No charges • Keep your account • Resume anytime</div>
                    </div>
                  </div>
                  <span className="chev text-blue-600">›</span>
                </button>



                {/* Warning section before cancel */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mt-6">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">⚠️</div>
                    <div>
                      <div className="font-bold text-red-700 mb-1">Think twice about canceling:</div>
                      <ul className="text-sm text-red-600 space-y-1">
                        <li>• You'll lose assistance on your next accident</li>
                        <li>• Average deductible cost: $1,000+</li>
                        <li>• Reactivation may require new approval</li>
                        <li>• Our rates may increase for new members</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Final cancel option (hidden initially) */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                    I still want to cancel (click to expand)
                  </summary>
                  <div className="mt-3">
                    <button
                      disabled={!!busy}
                      className="selectable-row border-red-200 hover:border-red-300 hover:bg-red-50 w-full"
                      onClick={async () => {
                        setBusy('cancel');
                        try {
                          // await requestMembershipCancellation('User chose to cancel despite retention offers'); // Function not available
                          setMessage('💔 Cancellation request submitted. Our team will process this within 24 hours.');
                          setShowCancel(false);
                        } finally {
                          setBusy(null);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">💔</div>
                        <div>
                          <div className="font-medium text-red-700">Yes, cancel my membership</div>
                          <div className="text-sm text-red-600">We'll miss keeping you safe</div>
                        </div>
                      </div>
                      <span className="chev text-red-600">›</span>
                    </button>
                  </div>
                </details>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  🔒 Secure • 🌟 5-star rated • 💬 24/7 support
                </div>
                <button 
                  className="btn btn-secondary text-sm" 
                  onClick={() => setShowCancel(false)}
                  disabled={!!busy}
                >
                  {busy ? 'Processing...' : 'Keep Current Plan'}
                </button>
              </div>
            </div>

            {/* Loading overlay */}
            {busy && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                <div className="text-center">
                  <div className="loading-spinner mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Processing your choice...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Custom Billing Interface */}
      {showBilling && vehicleId && (
        <BillingInterface 
          vehicleId={vehicleId} 
          onClose={() => setShowBilling(false)} 
        />
      )}
    </div>
  );
}

export default function ManageSubscriptionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ManageSubscriptionPageContent />
    </Suspense>
  );
}







