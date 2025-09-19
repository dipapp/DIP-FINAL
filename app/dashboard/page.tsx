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
    <div className="space-y-6">
      {/* Clean Welcome Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-xl text-white">👋</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}!</h2>
              <p className="text-gray-500">Member since {profile?.createdAt?.toDate?.()?.toLocaleDateString?.() || 'recently'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.vehicles}</div>
              <div className="text-sm text-blue-700 font-medium">Vehicles</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">{stats.activeVehicles}</div>
              <div className="text-sm text-emerald-700 font-medium">Active</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{stats.requests}</div>
              <div className="text-sm text-purple-700 font-medium">Requests</div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-sm text-white">⚡</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
          </div>
          
          <div className="space-y-3">
            <Link href="/dashboard/vehicles" className="group flex items-center space-x-3 p-3 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
              <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center transition-colors duration-200">
                <span className="text-lg">🚗</span>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Add Vehicle</div>
                <div className="text-sm text-gray-500">Register new vehicle</div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link href="/dashboard/claims" className="group flex items-center space-x-3 p-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200">
              <div className="w-10 h-10 bg-emerald-100 group-hover:bg-emerald-200 rounded-lg flex items-center justify-center transition-colors duration-200">
                <span className="text-lg">📋</span>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Submit Request</div>
                <div className="text-sm text-gray-500">Get assistance</div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link href="/dashboard/profile" className="group flex items-center space-x-3 p-3 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200">
              <div className="w-10 h-10 bg-orange-100 group-hover:bg-orange-200 rounded-lg flex items-center justify-center transition-colors duration-200">
                <span className="text-lg">⚙️</span>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Update Profile</div>
                <div className="text-sm text-gray-500">Edit information</div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Section */}
      {user?.email === 'admin@dipmembers.com' && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-xl text-white">👑</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Admin Access</h2>
              <p className="text-gray-600">Administrator privileges</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">
            Access the admin console to manage users, vehicles, and requests.
          </p>
          
          <Link href="/admin" className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200">
            <span>🚀</span>
            <span>Open Admin Console</span>
          </Link>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-sm text-white">💡</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Tips & Information</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-xs text-white">✨</span>
              </div>
              <h4 className="font-bold text-blue-800">Active Vehicle Benefits</h4>
            </div>
            <p className="text-blue-700 text-sm leading-relaxed">
              Ensure your vehicles are marked as "Active" to receive full membership benefits.
            </p>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-xs text-white">⚡</span>
              </div>
              <h4 className="font-bold text-emerald-800">Request Process</h4>
            </div>
            <p className="text-emerald-700 text-sm leading-relaxed">
              Upload clear photos and provide accurate details for faster assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


