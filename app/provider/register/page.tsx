'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatProviderId } from '@/lib/provider-utils';

export default function ProviderRegisterPage() {
  const [email, setEmail] = useState('');
  const [providerId, setProviderId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const validateProviderId = async (id: string, email: string) => {
    try {
      // First, try to find provider by providerId
      const providersQuery = query(
        collection(db, 'providers'),
        where('providerId', '==', id)
      );
      const providersSnapshot = await getDocs(providersQuery);
      
      if (!providersSnapshot.empty) {
        const provider = providersSnapshot.docs[0].data();
        
        // Check if email matches
        if (provider.email.toLowerCase() !== email.toLowerCase()) {
          throw new Error('Provider ID and email do not match. Please verify your information.');
        }
        
        // Check if provider is approved
        if (provider.status !== 'approved') {
          throw new Error('Your provider application is not yet approved. Please contact support.');
        }
        
        return {
          isValid: true,
          provider: { id: providersSnapshot.docs[0].id, ...provider }
        };
      }
      
      // If not found by providerId, try by document ID (for backward compatibility)
      const providerDoc = await getDoc(doc(db, 'providers', id));
      if (providerDoc.exists()) {
        const provider = providerDoc.data();
        
        // Check if email matches
        if (provider.email.toLowerCase() !== email.toLowerCase()) {
          throw new Error('Provider ID and email do not match. Please verify your information.');
        }
        
        // Check if provider is approved
        if (provider.status !== 'approved') {
          throw new Error('Your provider application is not yet approved. Please contact support.');
        }
        
        return {
          isValid: true,
          provider: { id: providerDoc.id, ...provider }
        };
      }
      
      throw new Error('Invalid provider ID or email. Please check your information.');
    } catch (err: any) {
      throw new Error(err.message || 'Error validating provider information.');
    }
  };

  const checkExistingAccount = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      return false;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      // Check if account already exists
      await checkExistingAccount();

      // Validate provider ID and email
      const validation = await validateProviderId(providerId, email);
      if (!validation.isValid) {
        throw new Error('Invalid provider information.');
      }

      const provider = validation.provider;

      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile
      await updateProfile(user, {
        displayName: `${(provider as any).contactPerson} (${(provider as any).businessName})`
      });

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        firstName: (provider as any).contactPerson.split(' ')[0] || (provider as any).contactPerson,
        lastName: (provider as any).contactPerson.split(' ').slice(1).join(' ') || '',
        phoneNumber: (provider as any).phone,
        isProvider: true,
        providerId: (provider as any).providerId || (provider as any).id,
        businessName: (provider as any).businessName,
        isActive: true,
        createdAt: new Date(),
        needsPasswordReset: false,
      });

      // Create provider profile
      await setDoc(doc(db, 'provider_profiles', user.uid), {
        providerId: (provider as any).providerId || (provider as any).id,
        businessName: (provider as any).businessName,
        legalEntityName: (provider as any).legalEntityName,
        ein: (provider as any).ein,
        contactPerson: (provider as any).contactPerson,
        phone: (provider as any).phone,
        address: (provider as any).address,
        city: (provider as any).city,
        state: (provider as any).state,
        zipCode: (provider as any).zipCode,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSuccess('Account created successfully! You can now sign in with your credentials.');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/provider/login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">DIP</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create Provider Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your login account using your provider credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="providerId" className="block text-sm font-medium text-gray-700">
                Provider ID
              </label>
              <div className="mt-1">
                <input
                  id="providerId"
                  name="providerId"
                  type="text"
                  required
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="123456"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter the 6-digit provider ID you received when approved
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Choose a secure password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link 
                href="/provider/login" 
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Sign in instead
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link 
                href="/admin" 
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                Need help? Contact Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
