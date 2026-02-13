'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(undefined);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ? { uid: u.uid, email: u.email || null } : null);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm.');
      return;
    }
    const u = auth.currentUser;
    if (!u) {
      setError('You are not signed in.');
      return;
    }
    setLoading(true);
    try {
      const idToken = await u.getIdToken();
      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to delete account. Please try again.');
        setLoading(false);
        return;
      }
      await signOut(auth);
      router.push('/?deleted=1');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 py-12">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Home
          </Link>
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Delete your account</h1>
            <p className="text-gray-600 mb-6">
              You must be signed in to delete your account.
            </p>
            <Link
              href="/auth/sign-up?tab=login"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-12">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Dashboard
        </Link>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Delete your account</h1>
          <p className="text-gray-600 mb-4">
            This will permanently remove your DIP member account and associated data. This action cannot be undone.
          </p>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1 text-sm">
            <li>Your profile and contact information will be deleted</li>
            <li>Your vehicles and claim history will be removed</li>
            <li>You will no longer have access to the app with this account</li>
          </ul>

          <form onSubmit={handleDelete} className="space-y-4">
            <p className="text-sm text-gray-700">
              To confirm, type <strong>DELETE</strong> below:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={loading}
              autoComplete="off"
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || confirmText !== 'DELETE'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Deleting…' : 'Delete my account'}
              </button>
              <Link
                href="/dashboard"
                className="inline-block px-4 py-2 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
