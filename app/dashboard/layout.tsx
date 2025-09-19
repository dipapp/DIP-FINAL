'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = [
    { href: '/dashboard', label: 'Overview', icon: '🏠' },
    { href: '/dashboard/vehicles', label: 'Vehicles', icon: '🚗' },
    { href: '/dashboard/claims', label: 'Requests', icon: '📋' },
    { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">Member Dashboard</h1>
            <p className="text-black mt-1 text-sm sm:text-base">Manage your vehicles, requests, and profile</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-black">Live</span>
          </div>
        </div>
        
        <nav className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
          {tabs.map((tab) => (
            <Link 
              key={tab.href} 
              href={tab.href}
              className={`nav-tab flex items-center justify-center sm:justify-start space-x-2 text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-3 ${pathname === tab.href ? 'active' : ''}`}
              style={{color: pathname === tab.href ? 'var(--brand-dark)' : '#000000'}}
            >
              <span className="text-base sm:text-lg">{tab.icon}</span>
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="min-h-[50vh] sm:min-h-[60vh]">
        {children}
      </div>
    </div>
  );
}


