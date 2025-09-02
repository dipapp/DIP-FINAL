'use client';
import { FormEvent, useEffect, useState, Suspense } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTab, setSelectedTab] = useState(1); // 0 = Log In, 1 = Sign Up

  useEffect(() => {
    const tab = searchParams?.get('tab');
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

  function mapAuthError(err: any): string {
    const code = err?.code || '';
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password'
    ) {
      return 'Incorrect username or password.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many attempts. Please try again later or reset your password.';
    }
    return 'Something went wrong. Please try again.';
  }

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
      setError(mapAuthError(err));
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
    <div className="min-h-screen flex items-start justify-center pt-8 pb-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dip-logo.png" alt="DIP Logo" className="h-20 w-auto mx-auto mb-4" />
          <p className="text-lg text-gray-500">Membership Benefits That Have You Covered</p>
        </div>

        <div className="bg-gray-100 p-1 rounded-lg">
          <div className="grid grid-cols-2 gap-1">
            <button
              className={`py-2 px-4 rounded-md font-medium transition-all ${
                selectedTab === 0 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setSelectedTab(0)}
            >Log In</button>
            <button
              className={`py-2 px-4 rounded-md font-medium transition-all ${
                selectedTab === 1 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setSelectedTab(1)}
            >Sign Up</button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {selectedTab === 0 && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <input type="email" placeholder="Email" className="input" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="input" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required />
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? (<div className="flex items-center justify-center"><div className="loading-spinner mr-2"></div>Signing In...</div>) : ('Log In')}
            </button>
            <div className="text-center">
              <button type="button" className="text-sm text-blue-600 hover:underline">Forgot password?</button>
            </div>
          </form>
        )}

        {selectedTab === 1 && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <input type="text" placeholder="First Name" className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <input type="text" placeholder="Last Name" className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <div>
              <input type="tel" placeholder="Phone Number" className="input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">Phone number will be used for request communications</p>
            </div>
            <input type="email" placeholder="Email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <input type="password" placeholder="Confirm Password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <button type="button" onClick={() => setAgreedToTerms(!agreedToTerms)} className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center ${agreedToTerms ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 hover:border-gray-400'}`}>{agreedToTerms && <span className="text-xs">✓</span>}</button>
                <div className="text-sm">
                  <p className="text-gray-700">I agree to the Terms of Service and acknowledge the Privacy Policy. I consent to receive disclosures electronically and to use electronic signatures.</p>
                  <div className="flex space-x-4 mt-2">
                    <a href="#" className="text-blue-600 hover:underline text-xs">Terms of Service</a>
                    <a href="#" className="text-blue-600 hover:underline text-xs">Privacy Policy</a>
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <button type="button" onClick={() => setOptedInMarketing(!optedInMarketing)} className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center ${optedInMarketing ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 hover:border-gray-400'}`}>{optedInMarketing && <span className="text-xs">✓</span>}</button>
                <p className="text-sm text-gray-700">I'd like to receive product updates and promotions.</p>
              </div>
              <p className="text-xs text-gray-500">We collect identity (name, driver's license image), vehicle (VIN, photos), insurance details (insurance card image), and contact information to set up your account, verify identity, assist with requests, and prevent fraud. We retain this data only as long as necessary for these purposes. Learn more in our Privacy Policy.</p>
            </div>
            <button type="submit" disabled={!agreedToTerms || loading} className={`btn w-full ${agreedToTerms ? 'btn-primary' : 'btn-secondary cursor-not-allowed'}`}>
              {loading ? (<div className="flex items-center justify-center"><div className="loading-spinner mr-2"></div>Creating Account...</div>) : ('Sign Up')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="card text-center py-12"><div className="loading-spinner mx-auto mb-2"></div>Loading…</div>}>
      <AuthPage />
    </Suspense>
  );
}
