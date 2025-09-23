'use client';
import React, { FormEvent, useState, Suspense } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { getAuthErrorMessage } from '@/lib/auth-errors';

function ProviderAuthContent() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(0); // 0 = Sign In, 1 = Sign Up
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
      // Redirect to provider dashboard (we'll create this later)
      router.push('/provider/dashboard');
    } catch (err: any) {
      setError(getAuthErrorMessage(err, false)); // false = sign-in
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {/* Header */}
          <div className="text-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dip-logo.png" alt="DIP Logo" className="h-12 w-auto mx-auto mb-3" />
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              Provider Portal
            </h1>
            <p className="text-gray-600 text-sm">
              Access your provider account or join our network
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex mb-4 border-b border-gray-200">
            <button
              className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
                selectedTab === 0 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => {
                setSelectedTab(0);
                setError(null); // Clear error when switching tabs
              }}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
                selectedTab === 1 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => {
                setSelectedTab(1);
                setError(null); // Clear error when switching tabs
              }}
            >
              Join Network
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Sign In Form */}
          {selectedTab === 0 && (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  value={signInEmail} 
                  onChange={(e) => setSignInEmail(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  value={signInPassword} 
                  onChange={(e) => setSignInPassword(e.target.value)} 
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
              <div className="text-center">
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot your password?
                </button>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {selectedTab === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Join Our Provider Network</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Complete our comprehensive application to become an approved DIP provider
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">What you'll need:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Business and legal entity information</li>
                  <li>• EIN number and business license</li>
                  <li>• Insurance and certification details</li>
                  <li>• Service areas and specialties</li>
                </ul>
              </div>

              <div className="text-center">
                <a 
                  href="/provider/signup"
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                >
                  Start Application
                </a>
                <p className="text-xs text-gray-500 mt-2">
                  Application takes 10-15 minutes to complete
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProviderAuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProviderAuthContent />
    </Suspense>
  );
}



