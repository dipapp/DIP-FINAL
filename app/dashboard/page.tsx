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
      {/* Holographic Welcome Matrix */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Welcome Hologram */}
        <div className="lg:col-span-2 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
          <div className="relative bg-black/60 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl shadow-cyan-500/20">
            <div className="flex items-center space-x-6 mb-8">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl blur-md opacity-50 animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50">
                  <span className="text-2xl">👋</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
              </div>
              
              <div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent mb-2">
                  WELCOME BACK, {displayName.toUpperCase()}
                </h2>
                <p className="text-cyan-300 font-medium text-lg tracking-wide">
                  Member since {profile?.createdAt?.toDate?.()?.toLocaleDateString?.() || 'recently'}
                </p>
              </div>
            </div>
            
            {/* Holographic Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="group/stat relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover/stat:opacity-40 transition-all duration-300"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-400/30 rounded-2xl p-6 text-center shadow-xl shadow-cyan-500/20">
                  <div className="text-4xl font-black text-cyan-400 mb-2 tracking-wider">{stats.vehicles}</div>
                  <div className="text-cyan-300 font-bold text-sm tracking-widest uppercase">VEHICLES</div>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="group/stat relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur opacity-20 group-hover/stat:opacity-40 transition-all duration-300"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-emerald-400/30 rounded-2xl p-6 text-center shadow-xl shadow-emerald-500/20">
                  <div className="text-4xl font-black text-emerald-400 mb-2 tracking-wider">{stats.activeVehicles}</div>
                  <div className="text-emerald-300 font-bold text-sm tracking-widest uppercase">ACTIVE</div>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="group/stat relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl blur opacity-20 group-hover/stat:opacity-40 transition-all duration-300"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-purple-400/30 rounded-2xl p-6 text-center shadow-xl shadow-purple-500/20">
                  <div className="text-4xl font-black text-purple-400 mb-2 tracking-wider">{stats.requests}</div>
                  <div className="text-purple-300 font-bold text-sm tracking-widest uppercase">REQUESTS</div>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Command Center */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
          <div className="relative bg-black/60 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl shadow-emerald-500/20">
            <div className="flex items-center space-x-4 mb-8">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl blur-sm opacity-50 animate-pulse"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-xl shadow-emerald-500/50">
                  <span className="text-xl">⚡</span>
                </div>
              </div>
              <h3 className="text-2xl font-black bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent tracking-wide">
                COMMAND CENTER
              </h3>
            </div>
            
            <div className="space-y-4">
              <Link href="/dashboard/vehicles" className="group/action relative block">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl blur opacity-0 group-hover/action:opacity-30 transition-all duration-300"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-violet-400/30 rounded-2xl p-4 transition-all duration-300 group-hover/action:border-violet-400/60 shadow-lg group-hover/action:shadow-xl group-hover/action:shadow-violet-500/20">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <span className="text-xl">🚗</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-violet-400 rounded-full animate-ping opacity-0 group-hover/action:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-black text-white tracking-wide">ADD VEHICLE</div>
                      <div className="text-violet-300 font-medium">Register new vehicle</div>
                    </div>
                    <div className="text-violet-400 group-hover/action:text-white transition-colors duration-300">
                      <svg className="w-6 h-6 transform group-hover/action:translate-x-1 group-hover/action:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/dashboard/claims" className="group/action relative block">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur opacity-0 group-hover/action:opacity-30 transition-all duration-300"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-emerald-400/30 rounded-2xl p-4 transition-all duration-300 group-hover/action:border-emerald-400/60 shadow-lg group-hover/action:shadow-xl group-hover/action:shadow-emerald-500/20">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <span className="text-xl">📋</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-0 group-hover/action:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-black text-white tracking-wide">SUBMIT REQUEST</div>
                      <div className="text-emerald-300 font-medium">Get assistance</div>
                    </div>
                    <div className="text-emerald-400 group-hover/action:text-white transition-colors duration-300">
                      <svg className="w-6 h-6 transform group-hover/action:translate-x-1 group-hover/action:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/dashboard/profile" className="group/action relative block">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl blur opacity-0 group-hover/action:opacity-30 transition-all duration-300"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-orange-400/30 rounded-2xl p-4 transition-all duration-300 group-hover/action:border-orange-400/60 shadow-lg group-hover/action:shadow-xl group-hover/action:shadow-orange-500/20">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <span className="text-xl">⚙️</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-ping opacity-0 group-hover/action:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-black text-white tracking-wide">UPDATE PROFILE</div>
                      <div className="text-orange-300 font-medium">Edit information</div>
                    </div>
                    <div className="text-orange-400 group-hover/action:text-white transition-colors duration-300">
                      <svg className="w-6 h-6 transform group-hover/action:translate-x-1 group-hover/action:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Command Terminal */}
      {user?.email === 'admin@dipmembers.com' && (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 rounded-3xl blur-lg opacity-40 group-hover:opacity-60 transition-all duration-500"></div>
          <div className="relative bg-black/70 backdrop-blur-2xl border border-yellow-400/30 rounded-3xl p-8 shadow-2xl shadow-yellow-500/20">
            <div className="flex items-center space-x-6 mb-6">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur-md opacity-60 animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/50">
                  <span className="text-2xl">👑</span>
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
              </div>
              
              <div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-white via-yellow-200 to-orange-200 bg-clip-text text-transparent tracking-wide">
                  ADMIN TERMINAL
                </h2>
                <p className="text-yellow-300 font-medium text-lg">
                  Administrator privileges activated
                </p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 text-lg leading-relaxed">
              Access the admin console to manage all users, vehicles, and requests with full system control.
            </p>
            
            <Link href="/admin" className="group/admin relative overflow-hidden inline-flex items-center justify-center px-10 py-5 text-xl font-black text-white rounded-2xl shadow-2xl transform transition-all duration-300 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 hover:shadow-2xl hover:shadow-orange-500/30 hover:scale-110">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/admin:translate-x-full transition-transform duration-1000"></div>
              <span className="mr-4 text-2xl">🚀</span>
              <span className="relative tracking-wider">LAUNCH ADMIN CONSOLE</span>
              <span className="ml-4 text-2xl">⚡</span>
            </Link>
          </div>
        </div>
      )}

      {/* Intelligence Hub */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
        <div className="relative bg-black/60 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl shadow-indigo-500/20">
          <div className="flex items-center space-x-4 mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-xl blur-sm opacity-50 animate-pulse"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-500/50">
                <span className="text-xl">💡</span>
              </div>
            </div>
            <h3 className="text-3xl font-black bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent tracking-wide">
              INTELLIGENCE HUB
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group/tip relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover/tip:opacity-40 transition-all duration-300"></div>
              <div className="relative bg-black/40 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-6 shadow-xl shadow-blue-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <span className="text-lg">✨</span>
                  </div>
                  <h4 className="text-xl font-black text-blue-300 tracking-wide">ACTIVE BENEFITS</h4>
                </div>
                <p className="text-blue-200 font-medium leading-relaxed">
                  Ensure your vehicles are marked as "Active" to receive full membership benefits and premium protection coverage.
                </p>
                <div className="absolute top-3 right-3 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <div className="group/tip relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur opacity-20 group-hover/tip:opacity-40 transition-all duration-300"></div>
              <div className="relative bg-black/40 backdrop-blur-xl border border-emerald-400/30 rounded-2xl p-6 shadow-xl shadow-emerald-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <span className="text-lg">⚡</span>
                  </div>
                  <h4 className="text-xl font-black text-emerald-300 tracking-wide">REQUEST PROTOCOL</h4>
                </div>
                <p className="text-emerald-200 font-medium leading-relaxed">
                  Upload clear photos and provide accurate details for faster assistance and premium service experience.
                </p>
                <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


