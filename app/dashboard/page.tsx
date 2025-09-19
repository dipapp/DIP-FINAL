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
      {/* Welcome Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-2">
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  Welcome back, {displayName}
                </h2>
                <p className="text-slate-600">
                  Member since {profile?.createdAt?.toDate?.()?.toLocaleDateString?.() || 'recently'}
                </p>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.vehicles}</div>
                <div className="text-slate-600 text-sm font-medium">Vehicles</div>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.activeVehicles}</div>
                <div className="text-slate-600 text-sm font-medium">Active</div>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.requests}</div>
                <div className="text-slate-600 text-sm font-medium">Requests</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              <Link href="/dashboard/vehicles" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">Add Vehicle</div>
                  <div className="text-slate-600 text-sm">Register new vehicle</div>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <Link href="/dashboard/claims" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">Submit Request</div>
                  <div className="text-slate-600 text-sm">Get assistance</div>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <Link href="/dashboard/profile" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">Update Profile</div>
                  <div className="text-slate-600 text-sm">Edit information</div>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Section */}
      {user?.email === 'admin@dipmembers.com' && (
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Administrator Access
              </h2>
              <p className="text-slate-600">
                Full system management capabilities
              </p>
            </div>
          </div>
          
          <p className="text-slate-700 mb-6 leading-relaxed">
            Access the administrative console to manage users, vehicles, and service requests across the entire platform.
          </p>
          
          <Link href="/admin" className="inline-flex items-center bg-slate-900 text-white font-semibold px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Access Admin Console
          </Link>
        </div>
      )}

      {/* Tips & Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Membership Benefits</h3>
          </div>
          <p className="text-slate-700 leading-relaxed">
            Ensure your vehicles are marked as "Active" to receive full membership benefits and comprehensive protection coverage.
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg border border-green-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Service Requests</h3>
          </div>
          <p className="text-slate-700 leading-relaxed">
            Provide clear photos and accurate details when submitting service requests for faster assistance and better service outcomes.
          </p>
        </div>
      </div>
    </div>
  );
}


