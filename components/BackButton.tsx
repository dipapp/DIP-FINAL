'use client';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface BackButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'ghost' | 'holographic';
}

export default function BackButton({ className = '', children, variant = 'default' }: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // Fallback to dashboard if no history
      router.push('/dashboard');
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'ghost':
        return `group relative bg-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 transition-colors`;
      
      case 'holographic':
        return `group relative bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 transition-colors`;
      
      default:
        return `group relative bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm transition-colors`;
    }
  };

  return (
    <button 
      onClick={handleBack}
      className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm ${getVariantClasses()} ${className}`}
    >
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <span>{children || 'Back'}</span>
    </button>
  );
}

