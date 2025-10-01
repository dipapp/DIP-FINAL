'use client';
import React, { useEffect, useState } from 'react';
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
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access your DIP account.</p>
        </div>
        <Link className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors" href="/auth/sign-up?tab=login">
          Sign In
        </Link>
      </div>
    );
  }

  const displayName = profile?.firstName && profile?.lastName 
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.displayName || user.email?.split('@')[0] || 'Member';

  return (
    <div className="space-y-5">
      {/* Welcome Section - AAA Style */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Welcome back, {displayName}
            </h2>
            <p className="text-gray-600 text-sm">
              Member since {profile?.createdAt?.toDate?.()?.toLocaleDateString?.() || 'recently'}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Active Member
            </div>
          </div>
        </div>
        
        {/* Account Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.vehicles}</div>
            <div className="text-gray-700 text-sm font-medium">Vehicles</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">{stats.activeVehicles}</div>
            <div className="text-gray-700 text-sm font-medium">Protected</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700 mb-1">{stats.requests}</div>
            <div className="text-gray-700 text-sm font-medium">Requests</div>
          </div>
        </div>
      </div>

      {/* Quick Actions - AAA Style */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Manage Your Vehicles
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Add vehicles to your account to ensure they're covered under your DIP membership services.
          </p>
          <Link 
            href="/dashboard/vehicles" 
            className="inline-flex items-center bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Vehicle
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Accident Assistance
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Been in an accident? Get immediate help with emergency contacts and file your claim.
          </p>
          <Link 
            href="/dashboard/accident" 
            className="inline-flex items-center bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            I'm in an Accident
          </Link>
        </div>
      </div>

      {/* Admin Access */}
      {user?.email === 'admin@dipmembers.com' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Administrator Access
              </h3>
              <p className="text-gray-600 text-sm">
                Manage users, vehicles, and service requests across the platform.
              </p>
            </div>
            <Link 
              href="/admin" 
              className="bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
            >
              Admin Console
            </Link>
          </div>
        </div>
      )}

      {/* Member Tips */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Keep Vehicles Active</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Ensure your vehicles are marked as "Active" in your account to receive full membership benefits and support services.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Emergency Preparedness</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                In case of an accident, stay calm and use the emergency workflow to get immediate help and file your claim efficiently.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}