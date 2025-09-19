'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ vehicles: 0, requests: 0, activeVehicles: 0 });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        setProfile(snap.exists() ? snap.data() : null);
        
        // Load quick stats
        try {
          const vehiclesSnap = await getDocs(query(collection(db, 'vehicles'), where('ownerId', '==', u.uid)));
          const requestsSnap = await getDocs(query(collection(db, 'claims'), where('userId', '==', u.uid)));
          const activeVehicles = vehiclesSnap.docs.filter(d => d.data().isActive);
          
          setStats({
            vehicles: vehiclesSnap.size,
            requests: requestsSnap.size,
            activeVehicles: activeVehicles.length
          });
        } catch (error) {
          console.error('Error loading stats:', error);
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsub();
  }, []);

  if (!user) {
    return (
      <div className="card text-center">
        <div className="mb-4">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted mb-6">Please sign in to access your dashboard.</p>
        </div>
        <Link className="btn btn-primary" href="/auth/sign-in">Sign In</Link>
      </div>
    );
  }

  const displayName = profile?.firstName && profile?.lastName 
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.displayName || user.email?.split('@')[0] || 'Member';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">Welcome back, {displayName}!</h2>
            <p className="text-muted text-sm sm:text-base">Member since {profile?.createdAt?.toDate?.()?.toLocaleDateString?.() || 'recently'}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
            <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold" style={{color: 'var(--brand-dark)'}}>{stats.vehicles}</div>
              <div className="text-xs text-muted">Vehicles</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-green-500">{stats.activeVehicles}</div>
              <div className="text-xs text-muted">Active</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold" style={{color: 'var(--brand)'}}>{stats.requests}</div>
              <div className="text-xs text-muted">Requests</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/dashboard/vehicles" className="selectable-row">
              <div className="flex items-center space-x-3">
                <span className="text-xl sm:text-2xl">🚗</span>
                <div className="flex-1">
                  <div className="font-medium text-sm sm:text-base">Add Vehicle</div>
                  <div className="text-xs sm:text-sm text-muted">Register a new vehicle</div>
                </div>
              </div>
              <span className="chev">›</span>
            </Link>
            <Link href="/dashboard/claims" className="selectable-row">
              <div className="flex items-center space-x-3">
                <span className="text-xl sm:text-2xl">📋</span>
                <div className="flex-1">
                  <div className="font-medium text-sm sm:text-base">Submit Request</div>
                  <div className="text-xs sm:text-sm text-muted">Request assistance</div>
                </div>
              </div>
              <span className="chev">›</span>
            </Link>
            <Link href="/dashboard/profile" className="selectable-row">
              <div className="flex items-center space-x-3">
                <span className="text-xl sm:text-2xl">⚙️</span>
                <div className="flex-1">
                  <div className="font-medium text-sm sm:text-base">Update Profile</div>
                  <div className="text-xs sm:text-sm text-muted">Edit your information</div>
                </div>
              </div>
              <span className="chev">›</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Section */}
      {user?.email === 'admin@dipmembers.com' && (
        <div className="card border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">👑</span>
            <h2 className="text-xl font-semibold">Admin Access</h2>
          </div>
          <p className="text-muted mb-4">You have administrator privileges. Access the admin console to manage all users, vehicles, and requests.</p>
          <Link href="/admin" className="btn btn-success">
            <span className="mr-2">🚀</span>
            Open Admin Console
          </Link>
        </div>
      )}

      {/* Tips Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">💡 Tips & Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border" style={{backgroundColor: 'rgba(135, 206, 235, 0.1)', borderColor: 'rgba(135, 206, 235, 0.3)'}}>
            <h4 className="font-medium mb-2" style={{color: 'var(--brand-dark)'}}>Active Vehicle Benefits</h4>
            <p className="text-sm text-muted">Make sure your vehicles are marked as "Active" to receive membership benefits.</p>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <h4 className="font-medium text-green-600 mb-2">Request Process</h4>
            <p className="text-sm text-muted">Upload clear photos and provide accurate details for faster assistance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


