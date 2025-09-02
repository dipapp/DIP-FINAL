'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SupportBubble from '@/components/SupportBubble';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = [
    { href: '/dashboard', label: 'Overview', icon: '🏠' },
    { href: '/dashboard/vehicles', label: 'Vehicles', icon: '🚗' },
    { href: '/dashboard/claims', label: 'Requests', icon: '📋' },
    { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="space-y-8">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black">Member Dashboard</h1>
            <p className="text-black mt-1">Manage your vehicles, requests, and profile</p>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-black">Live</span>
          </div>
        </div>
        
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link 
              key={tab.href} 
              href={tab.href}
              className={`nav-tab flex items-center space-x-2 ${pathname === tab.href ? 'active' : ''}`}
              style={{color: pathname === tab.href ? 'var(--brand-dark)' : '#000000'}}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="min-h-[60vh]">
        {children}
      </div>
      
      {/* Support Bubble */}
      <SupportBubble />
    </div>
  );
}


