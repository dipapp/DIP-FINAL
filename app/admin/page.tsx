'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { subscribeUsers, subscribeVehicles, subscribeClaims, subscribeTowEvents } from '@/lib/firebase/adminActions';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function AdminHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [towEvents, setTowEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = subscribeUsers(setUsers);
    const unsubVehicles = subscribeVehicles(setVehicles);
    const unsubClaims = subscribeClaims(setClaims);
    const unsubTowEvents = subscribeTowEvents(setTowEvents);
    
    setLoading(false);
    
    return () => {
      unsubUsers();
      unsubVehicles();
      unsubClaims();
      unsubTowEvents();
    };
  }, []);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.isActive).length,
    pendingClaims: claims.filter(c => c.status === 'pending').length,
    completedClaims: claims.filter(c => c.status === 'completed').length,
    towEvents: towEvents.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">System management and oversight</p>
          </div>
          <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
            Administrator
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalUsers}</div>
            <div className="text-gray-700 text-sm">Total Users</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{stats.activeVehicles}</div>
            <div className="text-gray-700 text-sm">Active Vehicles</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">{stats.pendingClaims}</div>
            <div className="text-gray-700 text-sm">Pending Claims</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">{stats.towEvents}</div>
            <div className="text-gray-700 text-sm">Tow Events</div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/users" className="card card-body hover:shadow-md transition-shadow group">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Manage Users</h3>
              <p className="text-gray-600 text-sm">View and manage member accounts</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link href="/admin/vehicles" className="card card-body hover:shadow-md transition-shadow group">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Manage Vehicles</h3>
              <p className="text-gray-600 text-sm">View and update vehicle records</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link href="/admin/requests" className="card card-body hover:shadow-md transition-shadow group">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Service Requests</h3>
              <p className="text-gray-600 text-sm">Manage member requests</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link href="/admin/membership" className="card card-body hover:shadow-md transition-shadow group">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Membership</h3>
              <p className="text-gray-600 text-sm">Manage memberships</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link href="/admin/towing" className="card card-body hover:shadow-md transition-shadow group">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Towing Events</h3>
              <p className="text-gray-600 text-sm">Track towing operations</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link href="/admin/settings" className="card card-body hover:shadow-md transition-shadow group">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Settings</h3>
              <p className="text-gray-600 text-sm">System configuration</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Claims</h3>
          </div>
          <div className="card-body">
            {claims.slice(0, 5).length > 0 ? (
              <div className="space-y-3">
                {claims.slice(0, 5).map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{claim.userEmail}</div>
                      <div className="text-sm text-gray-600">{claim.type}</div>
                    </div>
                    <span className={`badge ${
                      claim.status === 'pending' ? 'badge-warning' :
                      claim.status === 'completed' ? 'badge-success' : 'badge-gray'
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent claims</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Total Members</span>
                <span className="font-semibold text-gray-900">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Active Members</span>
                <span className="font-semibold text-green-600">{stats.activeUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Protected Vehicles</span>
                <span className="font-semibold text-blue-600">{stats.activeVehicles}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Pending Requests</span>
                <span className="font-semibold text-orange-600">{stats.pendingClaims}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div></div>}>
      <AdminHomeContent />
    </Suspense>
  );
}