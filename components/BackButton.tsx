'use client';
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
        return `group relative bg-transparent hover:bg-white/10 text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 transition-all duration-300 transform hover:scale-105`;
      
      case 'holographic':
        return `group relative overflow-hidden bg-black/60 backdrop-blur-2xl border border-cyan-400/30 text-cyan-300 hover:text-white shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 transform hover:scale-105`;
      
      default:
        return `group relative bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105`;
    }
  };

  return (
    <button 
      onClick={handleBack}
      className={`inline-flex items-center justify-center space-x-3 px-6 py-3 rounded-xl font-semibold text-sm ${getVariantClasses()} ${className}`}
    >
      {/* Holographic Effects */}
      {variant === 'holographic' && (
        <>
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-xl"></div>
          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></div>
        </>
      )}
      
      {/* Icon */}
      <div className={`relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
        variant === 'holographic' 
          ? 'bg-cyan-400/20 group-hover:bg-cyan-400/30' 
          : variant === 'ghost'
            ? 'bg-gray-100 group-hover:bg-gray-200'
            : 'bg-gray-100 group-hover:bg-blue-100'
      }`}>
        <svg 
          className={`w-4 h-4 transform group-hover:-translate-x-0.5 transition-all duration-300 ${
            variant === 'holographic' ? 'text-cyan-400' : 'text-gray-600 group-hover:text-blue-600'
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
      
      {/* Text */}
      <span className="relative z-10 tracking-wide">
        {children || 'Back'}
      </span>
      
      {/* Hover Indicator */}
      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
        variant === 'holographic' 
          ? 'bg-purple-400 opacity-0 group-hover:opacity-100' 
          : 'bg-blue-400 opacity-0 group-hover:opacity-100'
      }`}></div>
    </button>
  );
}

