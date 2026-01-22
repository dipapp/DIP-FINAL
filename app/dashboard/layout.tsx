'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = [
    { 
      href: '/dashboard/marketplace', 
      label: 'Marketplace', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      href: '/dashboard/vehicles', 
      label: 'Wallet', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    { 
      href: '/dashboard/add-vehicle', 
      label: 'Add Vehicle', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    { 
      href: '/dashboard/accident', 
      label: 'Coupons', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      )
    },
    { 
      href: '/dashboard/profile', 
      label: 'Account', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="relative bg-white border-b border-gray-200 shadow-sm">
        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">
              My DIP Account
            </h1>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href || (pathname === '/dashboard' && tab.href === '/dashboard/marketplace');
                return (
                  <Link 
                    key={tab.href} 
                    href={tab.href}
                    className={`group relative flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-900 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                    )}
                    {tab.icon}
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
        
      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {children}
      </div>
    </div>
  );
}