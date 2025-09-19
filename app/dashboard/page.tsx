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
    <div className="space-y-8">
      {/* Premium Welcome Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Welcome Card */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl"></div>
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
          
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl shadow-blue-500/10 p-6 sm:p-8">
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-xl">👋</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Welcome back, {displayName}!
                  </h2>
                  <p className="text-gray-600 font-medium">
                    Member since {profile?.createdAt?.toDate?.()?.toLocaleDateString?.() || 'recently'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl p-4 text-center shadow-lg">
                  <div className="text-3xl font-black text-blue-600 mb-2">{stats.vehicles}</div>
                  <div className="text-sm font-bold text-blue-800">Vehicles</div>
                </div>
              </div>
              
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 rounded-2xl p-4 text-center shadow-lg">
                  <div className="text-3xl font-black text-emerald-600 mb-2">{stats.activeVehicles}</div>
                  <div className="text-sm font-bold text-emerald-800">Active</div>
                </div>
              </div>
              
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-100 rounded-2xl p-4 text-center shadow-lg">
                  <div className="text-3xl font-black text-purple-600 mb-2">{stats.requests}</div>
                  <div className="text-sm font-bold text-purple-800">Requests</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl"></div>
          <div className="absolute -top-6 -left-6 w-28 h-28 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl shadow-emerald-500/10 p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">⚡</span>
              </div>
              <h3 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Quick Actions
              </h3>
            </div>
            
            <div className="space-y-4">
              <Link href="/dashboard/vehicles" className="group relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-105 block">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-white/90 backdrop-blur-sm border-2 border-gray-200 group-hover:border-white/50 group-hover:bg-white/20 transition-all duration-300 rounded-2xl p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300">
                      <span className="text-2xl">🚗</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-900 group-hover:text-white transition-colors duration-300">
                        Add Vehicle
                      </div>
                      <div className="text-gray-600 group-hover:text-white/80 transition-colors duration-300">
                        Register a new vehicle
                      </div>
                    </div>
                    <div className="text-violet-500 group-hover:text-white transition-colors duration-300">
                      <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl"></div>
              </Link>
              
              <Link href="/dashboard/claims" className="group relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-105 block">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-white/90 backdrop-blur-sm border-2 border-gray-200 group-hover:border-white/50 group-hover:bg-white/20 transition-all duration-300 rounded-2xl p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-900 group-hover:text-white transition-colors duration-300">
                        Submit Request
                      </div>
                      <div className="text-gray-600 group-hover:text-white/80 transition-colors duration-300">
                        Request assistance
                      </div>
                    </div>
                    <div className="text-emerald-500 group-hover:text-white transition-colors duration-300">
                      <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl"></div>
              </Link>
              
              <Link href="/dashboard/profile" className="group relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-105 block">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-white/90 backdrop-blur-sm border-2 border-gray-200 group-hover:border-white/50 group-hover:bg-white/20 transition-all duration-300 rounded-2xl p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300">
                      <span className="text-2xl">⚙️</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-900 group-hover:text-white transition-colors duration-300">
                        Update Profile
                      </div>
                      <div className="text-gray-600 group-hover:text-white/80 transition-colors duration-300">
                        Edit your information
                      </div>
                    </div>
                    <div className="text-orange-500 group-hover:text-white transition-colors duration-300">
                      <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl"></div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Admin Section */}
      {user?.email === 'admin@dipmembers.com' && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-3xl"></div>
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-2xl animate-pulse"></div>
          
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl shadow-yellow-500/10 p-6 sm:p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-3xl">👑</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full animate-ping"></div>
              </div>
              <div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                  Admin Access
                </h2>
                <p className="text-gray-600 font-medium">
                  Administrator privileges activated
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6 text-lg">
              You have administrator privileges. Access the admin console to manage all users, vehicles, and requests.
            </p>
            
            <Link href="/admin" className="group relative overflow-hidden inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white rounded-2xl shadow-xl transform transition-all duration-300 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 hover:shadow-2xl hover:shadow-orange-500/25 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="mr-3 text-2xl">🚀</span>
              <span className="relative">Open Admin Console</span>
            </Link>
          </div>
        </div>
      )}

      {/* Premium Tips Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 rounded-3xl"></div>
        <div className="absolute -top-6 -left-6 w-28 h-28 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl shadow-cyan-500/10 p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">💡</span>
            </div>
            <h3 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Tips & Information
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-xl">✨</span>
                  </div>
                  <h4 className="text-xl font-black text-blue-800">Active Vehicle Benefits</h4>
                </div>
                <p className="text-blue-700 font-medium leading-relaxed">
                  Make sure your vehicles are marked as "Active" to receive full membership benefits and premium protection.
                </p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-xl">⚡</span>
                  </div>
                  <h4 className="text-xl font-black text-emerald-800">Request Process</h4>
                </div>
                <p className="text-emerald-700 font-medium leading-relaxed">
                  Upload clear photos and provide accurate details for faster assistance and premium service experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


