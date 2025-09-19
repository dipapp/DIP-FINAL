'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = [
    { href: '/dashboard', label: 'Overview', icon: '🏠', gradient: 'from-cyan-400 via-blue-500 to-indigo-600', glow: 'cyan' },
    { href: '/dashboard/vehicles', label: 'Vehicles', icon: '🚗', gradient: 'from-violet-400 via-purple-500 to-fuchsia-600', glow: 'purple' },
    { href: '/dashboard/claims', label: 'Requests', icon: '📋', gradient: 'from-emerald-400 via-teal-500 to-green-600', glow: 'emerald' },
    { href: '/dashboard/profile', label: 'Profile', icon: '👤', gradient: 'from-orange-400 via-red-500 to-pink-600', glow: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-blue-900 to-slate-900"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      
      <div className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Revolutionary Header */}
        <div className="relative mb-12">
          {/* Header Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-purple-900/40 to-black/40 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
          
          <div className="relative p-8 lg:p-12">
            {/* Header Content */}
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {/* Rotating Ring */}
                  <div className="absolute -inset-4 rounded-full border-2 border-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-spin" style={{ animationDuration: '8s' }}></div>
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 opacity-20 blur-md animate-pulse"></div>
                  
                  <div className="relative w-20 h-20 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50">
                    <span className="text-3xl">👑</span>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                  </div>
                  
                  {/* Floating Particles */}
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
                  <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute top-0 left-0 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
                </div>
                
                <div>
                  <h1 className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent mb-2 tracking-tight">
                    MEMBER DASHBOARD
                  </h1>
                  <p className="text-xl text-gray-300 font-medium tracking-wide">
                    Premium Vehicle Protection Command Center
                  </p>
                </div>
              </div>
              
              {/* Holographic Status */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 rounded-2xl blur-xl animate-pulse"></div>
                <div className="relative bg-black/50 backdrop-blur-xl border border-emerald-400/30 rounded-2xl px-6 py-4 shadow-2xl shadow-emerald-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="text-emerald-300 font-black text-lg tracking-wider">SYSTEM ONLINE</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Futuristic Navigation */}
            <div className="mt-12">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {tabs.map((tab) => {
                  const isActive = pathname === tab.href;
                  return (
                    <Link 
                      key={tab.href} 
                      href={tab.href}
                      className="group relative"
                    >
                      {/* Holographic Effect */}
                      <div className={`absolute -inset-1 bg-gradient-to-r ${tab.gradient} rounded-2xl blur-lg opacity-${isActive ? '60' : '0'} group-hover:opacity-60 transition-all duration-500`}></div>
                      <div className={`absolute -inset-0.5 bg-gradient-to-r ${tab.gradient} rounded-2xl opacity-${isActive ? '100' : '0'} group-hover:opacity-100 transition-all duration-300`}></div>
                      
                      <div className={`relative bg-black/60 backdrop-blur-2xl border rounded-2xl p-6 transition-all duration-300 transform group-hover:scale-105 ${
                        isActive 
                          ? 'border-white/30 shadow-2xl' 
                          : 'border-white/10 group-hover:border-white/30 shadow-xl group-hover:shadow-2xl'
                      }`}>
                        {/* Content */}
                        <div className="text-center space-y-4">
                          <div className="relative">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-all duration-300 ${
                              isActive 
                                ? 'bg-white/20 backdrop-blur-sm shadow-2xl' 
                                : 'bg-white/10 group-hover:bg-white/20 group-hover:backdrop-blur-sm group-hover:shadow-xl'
                            }`}>
                              <span className="text-3xl">{tab.icon}</span>
                            </div>
                            
                            {/* Orbiting Particles */}
                            {isActive && (
                              <>
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                                <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                              </>
                            )}
                          </div>
                          
                          <div>
                            <h3 className={`text-xl font-black tracking-wide transition-all duration-300 ${
                              isActive 
                                ? 'text-white' 
                                : 'text-gray-300 group-hover:text-white'
                            }`}>
                              {tab.label.toUpperCase()}
                            </h3>
                          </div>
                        </div>
                        
                        {/* Scanning Line Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-1000 rounded-2xl ${
                          isActive ? 'group-hover:translate-x-full' : 'group-hover:translate-x-full'
                        }`}></div>
                        
                        {/* Active Glow */}
                        {isActive && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} opacity-20 rounded-2xl animate-pulse`}></div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Area with Holographic Frame */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-purple-900/40 to-black/40 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl"></div>
          
          <div className="relative p-8 lg:p-12">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}


