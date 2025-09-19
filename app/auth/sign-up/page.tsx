'use client';
import React, { FormEvent, useEffect, useState, Suspense } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTab, setSelectedTab] = useState(1); // 0 = Log In, 1 = Sign Up

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'login') setSelectedTab(0);
    if (tab === 'signup') setSelectedTab(1);
  }, [searchParams]);

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [optedInMarketing, setOptedInMarketing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms and Conditions.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: `${firstName} ${lastName}` });
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        firstName,
        lastName,
        phoneNumber,
        marketingOptIn: optedInMarketing,
        isAdmin: cred.user.email === 'admin@dipmembers.com',
        isActive: true,
        createdAt: serverTimestamp(),
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
          {/* Logo Section */}
          <div className="text-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dip-logo.png" alt="DIP Logo" className="h-12 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Member Access</h1>
            <p className="text-slate-600">Sign in to your DIP account or create a new membership</p>
          </div>

          {/* Tab Selector */}
          <div className="bg-slate-100 p-1 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-1">
              <button
                className={`py-3 px-4 rounded-md font-medium transition-colors ${
                  selectedTab === 0 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setSelectedTab(0)}
              >
                Sign In
              </button>
              <button
                className={`py-3 px-4 rounded-md font-medium transition-colors ${
                  selectedTab === 1 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setSelectedTab(1)}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {/* Sign In Form */}
          {selectedTab === 0 && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors" 
                  value={signInEmail} 
                  onChange={(e) => setSignInEmail(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors" 
                  value={signInPassword} 
                  onChange={(e) => setSignInPassword(e.target.value)} 
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
              <div className="text-center">
                <button type="button" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  Forgot your password?
                </button>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {selectedTab === 1 && (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                />
                <p className="text-xs text-slate-500 mt-1">Used for emergency communications and service requests</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setAgreedToTerms(!agreedToTerms)} 
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      agreedToTerms ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {agreedToTerms && <span className="text-xs font-bold">✓</span>}
                  </button>
                  <div className="text-sm">
                    <p className="text-slate-700 leading-relaxed">
                      I agree to the <a href="#" className="text-slate-900 font-medium hover:underline">Terms of Service</a> and acknowledge the <a href="#" className="text-slate-900 font-medium hover:underline">Privacy Policy</a>. I consent to receive disclosures electronically.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setOptedInMarketing(!optedInMarketing)} 
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      optedInMarketing ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {optedInMarketing && <span className="text-xs font-bold">✓</span>}
                  </button>
                  <p className="text-sm text-slate-700">Send me updates about new features and services.</p>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Privacy Notice:</strong> We collect personal and vehicle information to provide membership services, verify identity, process service requests, and prevent fraud. Data is securely stored and only retained as necessary. Review our Privacy Policy for complete details.
                  </p>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={!agreedToTerms || loading} 
                className={`w-full font-semibold py-3 rounded-lg transition-colors ${
                  agreedToTerms 
                    ? 'bg-slate-900 text-white hover:bg-slate-800' 
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Membership Account'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
