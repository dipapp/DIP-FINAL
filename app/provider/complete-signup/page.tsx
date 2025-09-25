'use client';
import React, { FormEvent, useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';

interface Provider {
  id: string;
  providerId: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: string;
}

export default function CompleteProviderSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  
  const [formData, setFormData] = useState({
    providerId: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const verifyProviderCredentials = async () => {
    if (!formData.providerId || !formData.email) {
      setError('Please enter both Provider ID and email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verify-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: formData.providerId,
          email: formData.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error verifying credentials. Please try again.');
        setLoading(false);
        return;
      }

      if (data.success && data.provider) {
        setProvider(data.provider as Provider);
        setSuccess('Credentials verified! Please create your password below.');
      } else {
        setError('Invalid response from server. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(`Error verifying credentials: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!provider) {
      setError('Please verify your credentials first');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if account already exists by trying to sign in first
      try {
        await signInWithEmailAndPassword(auth, provider.email, 'dummy-password');
        // If we get here, account exists but password is wrong
        setError('An account with this email already exists. Please sign in at /provider/login or contact support if you forgot your password.');
        setLoading(false);
        return;
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found') {
          // Account doesn't exist, proceed with creation
        } else if (signInErr.code === 'auth/wrong-password') {
          // Account exists but wrong password - check if it's a half-created account
          try {
            const response = await fetch('/api/complete-provider-setup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                providerId: provider.providerId,
                email: provider.email
              })
            });

            const data = await response.json();

            if (response.ok && data.success) {
              setSuccess('Account setup completed! You can now sign in at /provider/login');
              setTimeout(() => {
                router.push('/provider/login');
              }, 2000);
              setLoading(false);
              return;
            } else {
              setError('An account with this email already exists. Please sign in at /provider/login or contact support if you forgot your password.');
              setLoading(false);
              return;
            }
          } catch (setupErr) {
            setError('An account with this email already exists. Please sign in at /provider/login or contact support if you forgot your password.');
            setLoading(false);
            return;
          }
        } else {
          // Other error, proceed with creation attempt
        }
      }

      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        provider.email, 
        formData.password
      );
      
      const user = userCredential.user;
      
      // Update user profile
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
        providerId: provider.providerId,
        businessName: provider.businessName,
        isActive: true,
        createdAt: new Date(),
      });

      // Create provider profile
      await setDoc(doc(db, 'provider_profiles', user.uid), {
        providerId: provider.providerId,
        businessName: provider.businessName,
        contactPerson: provider.contactPerson,
        email: provider.email,
        phone: provider.phone,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSuccess('Account created successfully! Redirecting to provider dashboard...');
      
      // Redirect to provider dashboard after 2 seconds
      setTimeout(() => {
        router.push('/provider/dashboard');
      }, 2000);

    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. You can sign in at /provider/login or contact support if you need help.');
      } else {
        setError(err.message || 'Error creating account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-8">
        <BackButton />
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Complete Provider Signup</h1>
        <p className="text-gray-600 mt-2">Enter your Provider ID and email to create your account</p>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Provider ID and Email Verification */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider ID
                </label>
                <input
                  type="text"
                  name="providerId"
                  value={formData.providerId}
                  onChange={handleInputChange}
                  placeholder="Enter your 6-digit Provider ID"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              {!provider && (
                <button
                  type="button"
                  onClick={verifyProviderCredentials}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Credentials'}
                </button>
              )}
            </div>

            {/* Password Creation (only show after verification) */}
            {provider && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Create Your Password</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password (min 6 characters)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Complete Signup'}
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-3">
                {success}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
