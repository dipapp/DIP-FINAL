'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { subscribeVehiclesByOwner, subscribeClaimsByUser } from '@/lib/firebase/adminActions';
import BackButton from '@/components/BackButton';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uid = params?.uid as string;

  const [user, setUser] = useState<any | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!uid) return;
    
    console.log('Loading user data for UID:', uid);
    
    const unsubUser = onSnapshot(doc(db, 'users', uid), (snap) => {
      const userData = snap.exists() ? { uid: snap.id, ...snap.data() } : null;
      console.log('User data:', userData);
      setUser(userData);
    });
    
    const unsubVehicles = subscribeVehiclesByOwner(uid, (rows) => {
      console.log('Vehicles for user:', rows);
      setVehicles(rows);
    });
    
    const unsubClaims = subscribeClaimsByUser(uid, (rows) => {
      console.log('Claims for user:', rows);
      setClaims(rows);
    });
    
    // Add error handling
    const handleError = (error: any) => {
      console.error('Error loading user data:', error);
      setLoading(false);
    };
    
    setLoading(false);
    return () => { 
      try { 
        (unsubUser as any)?.(); 
        (unsubVehicles as any)?.(); 
        (unsubClaims as any)?.(); 
      } catch (e) {
        console.error('Error unsubscribing:', e);
      } 
    };
  }, [uid]);

  const handleDeleteUser = async () => {
    if (!user || !uid) return;
    
    try {
      setDeleting(true);
      
      // Call API endpoint to delete user from both Firestore and Firebase Auth
      const response = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      const result = await response.json();
      console.log('User deletion result:', result);
      
      // Navigate back to users list
      router.push('/admin?tab=users');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="card text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-muted">Loading user...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user.firstName} {user.lastName}</h1>
            <p className="text-muted">{user.email}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
              {user.isActive ? '✓ Active' : '✖ Inactive'}
            </span>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete User
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-lg font-bold text-blue-600">{vehicles.length}</div>
            <div className="text-sm text-blue-800">Vehicles</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-lg font-bold text-green-600">{claims.length}</div>
            <div className="text-sm text-green-800">Claims</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-lg font-bold text-purple-600">{user.createdAt?.toDate?.()?.toLocaleDateString?.() || '—'}</div>
            <div className="text-sm text-purple-800">Joined</div>
          </div>
        </div>
      </div>

      {/* Vehicles */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Vehicles ({vehicles.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted border-b">
              <tr>
                <th className="py-2 pr-4">Vehicle</th>
                <th className="py-2 pr-4">VIN</th>
                <th className="py-2 pr-4">Plate</th>
                <th className="py-2 pr-4">State</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Updated</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="table-row">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{v.year} {v.make} {v.model}</div>
                    <div className="text-xs text-muted">{v.color || '—'}</div>
                  </td>
                  <td className="py-3 pr-4"><span className="font-mono text-xs">{v.vin || '—'}</span></td>
                  <td className="py-3 pr-4"><span className="font-mono text-xs">{v.licensePlate || '—'}</span></td>
                  <td className="py-3 pr-4">{v.state || '—'}</td>
                  <td className="py-3 pr-4">
                    <span className={`badge ${v.isActive ? 'badge-success' : 'badge-error'}`}>{v.isActive ? '✓ Active' : '✖ Inactive'}</span>
                  </td>
                  <td className="py-3 pr-4">{v.lastUpdated?.toDate?.()?.toLocaleDateString?.() || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {vehicles.length === 0 && (
            <div className="text-center py-8"><p className="text-muted">No vehicles</p></div>
          )}
        </div>
      </div>

      {/* Claims */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Claims ({claims.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted border-b">
              <tr>
                <th className="py-2 pr-4">Claim</th>
                <th className="py-2 pr-4">Vehicle</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} className="table-row">
                  <td className="py-3 pr-4"><span className="font-mono text-xs">#{c.id.slice(-8)}</span></td>
                  <td className="py-3 pr-4">{c.vehicleYear} {c.vehicleMake} {c.vehicleModel}</td>
                  <td className="py-3 pr-4">${c.amount?.toFixed?.(2) || '0.00'}</td>
                  <td className="py-3 pr-4">
                    <span className={`badge ${c.status === 'Approved' ? 'badge-success' : c.status === 'Pending' ? 'badge-warning' : 'badge-info'}`}>{c.status}</span>
                  </td>
                  <td className="py-3 pr-4">{c.date?.toDate?.()?.toLocaleDateString?.() || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {claims.length === 0 && (
            <div className="text-center py-8"><p className="text-muted">No claims</p></div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Delete User</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 text-center">
                  Are you sure you want to delete <strong>{user.firstName} {user.lastName}</strong>?
                </p>
                <p className="text-sm text-gray-500 text-center mt-2">
                  This action cannot be undone. This will permanently delete the user and all their data.
                </p>
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>User Details:</strong></p>
                  <p>Email: {user.email}</p>
                  <p>Vehicles: {vehicles.length}</p>
                  <p>Claims: {claims.length}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


