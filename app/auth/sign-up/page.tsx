'use client';
import React, { FormEvent, useEffect, useState, Suspense } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
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

  // OAuth handlers
  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is a new user
      const isNewUser = result.additionalUserInfo?.isNewUser;
      
      if (isNewUser) {
        // Create user profile for new Google users
        const user = result.user;
        const nameParts = user.displayName?.split(' ') || ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName,
          lastName,
          phoneNumber: '',
          marketingOptIn: false,
          isAdmin: user.email === 'admin@dipmembers.com',
          isActive: true,
          createdAt: serverTimestamp(),
        });
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is a new user
      const isNewUser = result.additionalUserInfo?.isNewUser;
      
      if (isNewUser) {
        // Create user profile for new Apple users
        const user = result.user;
        const nameParts = user.displayName?.split(' ') || ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName,
          lastName,
          phoneNumber: '',
          marketingOptIn: false,
          isAdmin: user.email === 'admin@dipmembers.com',
          isActive: true,
          createdAt: serverTimestamp(),
        });
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to sign in with Apple');
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
              onClick={() => setSelectedTab(0)}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
                selectedTab === 1 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setSelectedTab(1)}
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

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            
            <button
              type="button"
              onClick={handleAppleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

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