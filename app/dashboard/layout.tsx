'use client';
import React from 'react';
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Simple Header */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Dashboard
                </h1>
                <p className="text-gray-600">
                  Manage your membership and vehicles
                </p>
              </div>
              
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium text-sm">Active</span>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="mt-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {tabs.map((tab) => {
                  const isActive = pathname === tab.href;
                  return (
                    <Link 
                      key={tab.href} 
                      href={tab.href}
                      className={`p-4 rounded-lg border text-center transition-colors ${
                        isActive 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{tab.icon}</div>
                      <div className="font-medium text-sm">{tab.label}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}


