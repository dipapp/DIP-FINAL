'use client';
import { useState, useEffect, Suspense } from 'react';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/client';
import BackButton from '@/components/BackButton';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatProviderId } from '@/lib/provider-utils';

interface Provider {
  id: string;
  providerId: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  ein: string;
  legalEntityName: string;
  status: string;
}

function CreateProviderAccountForm() {
  const [providerId, setProviderId] = useState('');
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setIsAdmin(user.email === 'admin@dipmembers.com');
        if (user.email !== 'admin@dipmembers.com') {
          setError('Access denied. Admin privileges required.');
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setError('Please sign in to access this page.');
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-populate provider ID from URL parameter
  useEffect(() => {
    const urlProviderId = searchParams.get('providerId');
    if (urlProviderId) {
      setProviderId(urlProviderId);
    }
  }, [searchParams]);

  const fetchProvider = async () => {
    if (!providerId) return;
    
    if (!isAuthenticated || !isAdmin) {
      setError('Please sign in as admin to access provider data.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const providerDoc = await getDoc(doc(db, 'providers', providerId));
      if (providerDoc.exists()) {
        const data = providerDoc.data();
        setProvider({ id: providerDoc.id, ...data } as Provider);
      } else {
        setError('Provider not found');
      }
    } catch (err) {
      setError('Error fetching provider. Make sure you are signed in as admin@dipmembers.com');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingAccount = async () => {
    if (!provider) return false;
    
    try {
      // Check if user exists in Firestore users collection
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', provider.email)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        const existingUser = usersSnapshot.docs[0].data();
        setSuccess(`Account already exists!\n\nProvider ID: ${formatProviderId(existingUser.providerId) || 'Not assigned'}\nEmail: ${existingUser.email}\nProvider can login at /provider/login\n\nIf they don't know their password, you can reset it in Firebase Console.`);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error checking existing account:', err);
      return false;
    }
  };

  const createAccount = async () => {
    if (!provider) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // First check if account already exists
      const accountExists = await checkExistingAccount();
      if (accountExists) {
        setLoading(false);
        return;
      }
      
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, provider.email, tempPassword);
      const user = userCredential.user;
      
      // Update profile
      await updateProfile(user, {
        displayName: `${provider.contactPerson} (${provider.businessName})`
      });

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: provider.email,
        firstName: provider.contactPerson.split(' ')[0] || provider.contactPerson,
        lastName: provider.contactPerson.split(' ').slice(1).join(' ') || '',
        phoneNumber: provider.phone,
        isProvider: true,
        providerId: provider.id,
        businessName: provider.businessName,
        isActive: true,
        createdAt: new Date(),
        needsPasswordReset: true,
        tempPassword: tempPassword,
      });

      // Create provider profile
      await setDoc(doc(db, 'provider_profiles', user.uid), {
        providerId: provider.id,
        businessName: provider.businessName,
        legalEntityName: provider.legalEntityName,
        ein: provider.ein,
        contactPerson: provider.contactPerson,
        phone: provider.phone,
        address: provider.address,
        city: provider.city,
        state: provider.state,
        zipCode: provider.zipCode,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSuccess(`Account created successfully!\n\nLogin credentials:\nProvider ID: ${formatProviderId(provider.providerId) || 'Not assigned'}\nEmail: ${provider.email}\nTemporary Password: ${tempPassword}\n\nProvider can now login at /provider/login`);
      
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. The provider may already have a login account. Check the Users section in admin panel.');
      } else {
        setError(err.message || 'Error creating account');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <BackButton />
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-6">
            <h3 className="text-red-800 font-medium">Access Denied</h3>
            <p className="text-red-700 mt-1">Admin privileges required. Please sign in as admin@dipmembers.com</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <BackButton />
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Create Provider Account</h1>
        <p className="text-gray-600 mt-2">Create login account for approved providers</p>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider ID
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                placeholder="Enter provider ID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={fetchProvider}
                disabled={loading || !providerId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Find Provider'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
              {error.includes('already exists') && (
                <div className="mt-2">
                  <a 
                    href="/admin/users" 
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Check existing users →
                  </a>
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md whitespace-pre-line">
              {success}
            </div>
          )}

          {provider && (
            <div className="border rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Provider Details</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Provider ID:</strong> {formatProviderId(provider.providerId) || 'Not assigned'}</div>
                <div><strong>Business:</strong> {provider.businessName}</div>
                <div><strong>Contact:</strong> {provider.contactPerson}</div>
                <div><strong>Email:</strong> {provider.email}</div>
                <div><strong>Phone:</strong> {provider.phone}</div>
                <div><strong>Status:</strong> <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{provider.status}</span></div>
              </div>
              
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={checkExistingAccount}
                  disabled={!provider || loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Check Existing Account
                </button>
                <button
                  onClick={createAccount}
                  disabled={!provider || loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Login Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateProviderAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>}>
      <CreateProviderAccountForm />
    </Suspense>
  );
}
