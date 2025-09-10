'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { subscribeVehiclesByOwner, subscribeClaimsByUser, updateVehicleAdmin, setUserActive } from '@/lib/firebase/adminActions';
import BackButton from '@/components/BackButton';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uid = params?.uid as string;

  const [user, setUser] = useState<any | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [savingUserActive, setSavingUserActive] = useState(false);

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
          <div className="text-right space-y-2">
            <div>
              <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                {user.isActive ? '✓ Active' : '✖ Inactive'}
              </span>
            </div>
            <button
              disabled={savingUserActive}
              onClick={async () => {
                try {
                  setSavingUserActive(true);
                  await setUserActive(uid, !user.isActive);
                } catch (e) {
                  alert('Failed to update member status');
                  console.error(e);
                } finally {
                  setSavingUserActive(false);
                }
              }}
              className={`btn ${user.isActive ? 'btn-danger' : 'btn-success'} btn-sm w-full`}
            >
              {user.isActive ? 'Deactivate' : 'Make Active'}
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
                <tr
                  key={v.id}
                  className="table-row cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedVehicle(v);
                    setVehicleModalOpen(true);
                  }}
                >
                  <td className="py-3 pr-4">
                    <div className="font-medium">{v.year} {v.make} {v.model}</div>
                    <div className="text-xs text-muted">{v.color || '—'}</div>
                  </td>
                  <td className="py-3 pr-4"><span className="font-mono text-xs">{v.vin || '—'}</span></td>
                  <td className="py-3 pr-4"><span className="font-mono text-xs">{v.licensePlate || '—'}</span></td>
                  <td className="py-3 pr-4">{v.state || '—'}</td>
                  <td className="py-3 pr-4">
                    <span className={`badge ${v.subscription?.status === 'active' || v.subscription?.status === 'trialing' ? 'badge-success' : 'badge-error'}`}>
                      {v.subscription?.status ? v.subscription.status.replace(/_/g, ' ') : 'no-subscription'}
                    </span>
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
                <tr
                  key={c.id}
                  className="table-row cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/admin/requests/${c.id}`)}
                >
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

      {/* Vehicle Quick Actions Modal */}
      {vehicleModalOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Vehicle</h3>
              <button className="text-2xl" onClick={() => setVehicleModalOpen(false)}>×</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="font-medium">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</div>
              <div className="text-muted">VIN: <span className="font-mono">{selectedVehicle.vin || '—'}</span></div>
              <div className="text-muted">Plate: {selectedVehicle.licensePlate || '—'}</div>
              <div>
                <span className={`badge ${selectedVehicle.isActive ? 'badge-success' : 'badge-error'}`}>
                  {selectedVehicle.isActive ? '✓ Active' : '✖ Inactive'}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-secondary" onClick={() => setVehicleModalOpen(false)}>Close</button>
              <button className="btn btn-secondary" onClick={() => alert('Status managed by Stripe; use subscription actions.')}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


