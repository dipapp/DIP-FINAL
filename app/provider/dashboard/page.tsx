'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

export default function ProviderDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [providerStatus, setProviderStatus] = useState<string | null>(null);
  const [providerData, setProviderData] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Check if user is a provider and get their status
        try {
          const providerDoc = await getDoc(doc(db, 'providers', u.uid));
          if (providerDoc.exists()) {
            const data = providerDoc.data();
            setProviderStatus(data.status);
            setProviderData(data);
          } else {
            setProviderStatus('not-found');
          }
        } catch (error) {
          console.error('Error checking provider status:', error);
          setProviderStatus('error');
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/provider');
    return null;
  }

  // Handle different provider statuses
  if (providerStatus === 'not-found') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Provider Account Not Found</h1>
            <p className="text-gray-600 mb-6">
              You don't have a provider account. Please apply to become a DIP provider first.
            </p>
            <div className="space-y-3">
              <a 
                href="/provider/signup"
                className="inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply to Become a Provider
              </a>
              <div>
                <button
                  onClick={async () => {
                    await signOut(auth);
                    router.push('/provider');
                  }}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (providerStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h1>
            <p className="text-gray-600 mb-6">
              Your provider application is currently being reviewed by our team. You'll receive an email notification once your application is approved.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">What happens next:</h3>
              <ul className="text-sm text-yellow-800 space-y-1 text-left">
                <li>• Our team reviews your application (3-5 business days)</li>
                <li>• We verify all provided information</li>
                <li>• You'll receive an email with the decision</li>
                <li>• If approved, you'll get full dashboard access</li>
              </ul>
            </div>
            <div className="space-y-3">
              <a 
                href="/"
                className="inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to DIP Homepage
              </a>
              <div>
                <button
                  onClick={async () => {
                    await signOut(auth);
                    router.push('/provider');
                  }}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (providerStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Not Approved</h1>
            <p className="text-gray-600 mb-6">
              Unfortunately, your provider application was not approved at this time. Please contact us if you have questions about this decision.
            </p>
            <div className="space-y-3">
              <a 
                href="mailto:providers@dipmembers.com"
                className="inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </a>
              <div>
                <button
                  onClick={async () => {
                    await signOut(auth);
                    router.push('/provider');
                  }}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (providerStatus === 'suspended') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h1>
            <p className="text-gray-600 mb-6">
              Your provider account has been suspended. Please contact support for more information.
            </p>
            <div className="space-y-3">
              <a 
                href="mailto:providers@dipmembers.com"
                className="inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </a>
              <div>
                <button
                  onClick={async () => {
                    await signOut(auth);
                    router.push('/provider');
                  }}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only approved providers get full dashboard access
  if (providerStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/dip-logo.png" alt="DIP Logo" className="h-8 w-auto" />
              <div className="text-xl font-bold text-blue-600">DIP Provider Portal</div>
            </div>
            <button
              onClick={async () => {
                await signOut(auth);
                router.push('/provider');
              }}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Only for approved providers */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {providerData?.businessName || 'Provider'}!</h1>
          <p className="text-gray-600 mb-6">
            Your provider dashboard is coming soon. You'll be able to manage your profile, view assigned requests, and track your service history.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
            <h3 className="font-semibold text-green-900 mb-2">What's Coming:</h3>
            <ul className="text-sm text-green-800 space-y-1 text-left">
              <li>• View and manage assigned requests</li>
              <li>• Update your provider profile</li>
              <li>• Track service history and payments</li>
              <li>• Access provider resources and support</li>
            </ul>
          </div>

          <div className="mt-6">
            <a 
              href="/"
              className="inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to DIP Homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
