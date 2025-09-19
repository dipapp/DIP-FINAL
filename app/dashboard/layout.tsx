'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = [
    { href: '/dashboard', label: 'Overview', icon: '🏠', color: 'blue' },
    { href: '/dashboard/vehicles', label: 'Vehicles', icon: '🚗', color: 'purple' },
    { href: '/dashboard/claims', label: 'Requests', icon: '📋', color: 'emerald' },
    { href: '/dashboard/profile', label: 'Profile', icon: '👤', color: 'orange' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Clean Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-xl text-white">🏠</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Member Dashboard</h1>
              <p className="text-gray-500">Manage your vehicles and protection</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Live</span>
          </div>
        </div>
        
        {/* Clean Navigation */}
        <nav className="flex space-x-1 mt-6 bg-gray-50 rounded-xl p-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Content */}
      <div>
        {children}
      </div>
    </div>
  );
}


