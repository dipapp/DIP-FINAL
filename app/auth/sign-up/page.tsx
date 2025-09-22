'use client';
import React, { FormEvent, useEffect, useState, Suspense } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthErrorMessage } from '@/lib/auth-errors';

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
      setError(getAuthErrorMessage(err, false)); // false = sign-in
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
      setError(getAuthErrorMessage(err, true)); // true = sign-up
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {/* Header - AAA Style */}
          <div className="text-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dip-logo.png" alt="DIP Logo" className="h-12 w-auto mx-auto mb-3" />
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {selectedTab === 0 ? 'Sign In to Your Account' : 'Join DIP Today'}
            </h1>
            <p className="text-gray-600 text-sm">
              {selectedTab === 0 ? 'Access your membership services' : 'Start your membership in minutes'}
            </p>
          </div>

          {/* Tab Navigation - AAA Style */}
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
              Join Now
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
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                />
                <p className="text-xs text-gray-500 mt-1">Used for emergency communications</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <button 
                    type="button" 
                    onClick={() => setAgreedToTerms(!agreedToTerms)} 
                    className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      agreedToTerms ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {agreedToTerms && <span className="text-xs font-bold">✓</span>}
                  </button>
                  <div className="text-xs">
                    <p className="text-gray-700 leading-relaxed">
                      I agree to the <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</a>. I consent to receive disclosures electronically.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <button 
                    type="button" 
                    onClick={() => setOptedInMarketing(!optedInMarketing)} 
                    className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      optedInMarketing ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {optedInMarketing && <span className="text-xs font-bold">✓</span>}
                  </button>
                  <p className="text-xs text-gray-700">Send me updates about new services and benefits.</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong>Privacy Notice:</strong> We collect personal and vehicle information to provide membership services, verify identity, and process service requests. Your data is securely protected and only used as described in our Privacy Policy. DIP is a membership program, not an insurance company.
                  </p>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={!agreedToTerms || loading} 
                className={`w-full font-semibold py-2 rounded-lg transition-colors ${
                  agreedToTerms 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Join DIP'
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