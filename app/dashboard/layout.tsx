'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = [
    { href: '/dashboard', label: 'Overview', icon: '🏠', gradient: 'from-blue-500 to-indigo-600' },
    { href: '/dashboard/vehicles', label: 'Vehicles', icon: '🚗', gradient: 'from-violet-500 to-purple-600' },
    { href: '/dashboard/claims', label: 'Requests', icon: '📋', gradient: 'from-emerald-500 to-teal-600' },
    { href: '/dashboard/profile', label: 'Profile', icon: '👤', gradient: 'from-orange-500 to-red-600' },
  ];

  return (
    <div className="space-y-8 relative">
      {/* Premium Dashboard Header */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl"></div>
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-gradient-to-br from-violet-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl shadow-indigo-500/10 p-6 sm:p-8">
          {/* Header Content */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-6 lg:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-2xl">👑</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-900 bg-clip-text text-transparent tracking-tight">
                    Member Dashboard
                  </h1>
                  <p className="text-gray-600 text-lg font-medium mt-2">
                    Premium vehicle protection control center
                  </p>
                </div>
              </div>
            </div>
            
            {/* Live Status Indicator */}
            <div className="flex items-center space-x-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl px-4 py-3 shadow-lg">
              <div className="relative">
                <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-emerald-700 font-bold text-lg">System Live</span>
            </div>
          </div>
          
          {/* Premium Navigation */}
          <nav className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link 
                  key={tab.href} 
                  href={tab.href}
                  className={`group relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                    isActive ? 'shadow-2xl shadow-purple-500/25' : 'shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${tab.gradient} opacity-${isActive ? '100' : '0'} group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className={`relative bg-white/90 backdrop-blur-sm border-2 transition-all duration-300 rounded-2xl p-4 sm:p-6 ${
                    isActive 
                      ? 'border-white/50 bg-white/20' 
                      : 'border-gray-200 group-hover:border-white/50 group-hover:bg-white/20'
                  }`}>
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive 
                          ? 'bg-white/20 backdrop-blur-sm' 
                          : 'bg-gray-100 group-hover:bg-white/20 group-hover:backdrop-blur-sm'
                      }`}>
                        <span className="text-2xl">{tab.icon}</span>
                      </div>
                      <div className="text-center">
                        <h3 className={`font-bold text-lg transition-colors duration-300 ${
                          isActive 
                            ? 'text-white' 
                            : 'text-gray-900 group-hover:text-white'
                        }`}>
                          {tab.label}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl"></div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="min-h-[60vh]">
        {children}
      </div>
    </div>
  );
}


