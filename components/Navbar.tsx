'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = !!user && user.email === 'admin@dipmembers.com';
  const isHomePage = pathname === '/';
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/dip-logo.png" 
              alt="DIP Logo" 
              className="h-8 w-auto" 
            />
            <span className="text-xl font-bold text-slate-900">DIP</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              className={`font-medium transition-colors ${
                pathname === '/' 
                  ? 'text-slate-900 border-b-2 border-slate-900 pb-1' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              href={user ? '/dashboard' : '/'}
            >
              Home
            </Link>
            
            {isAdmin && (
              <Link 
                className={`font-medium transition-colors ${
                  pathname?.startsWith('/admin') 
                    ? 'text-slate-900 border-b-2 border-slate-900 pb-1' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                href="/admin"
              >
                Admin
              </Link>
            )}
            
            {user ? (
              <>
                <Link 
                  className={`font-medium transition-colors ${
                    pathname?.startsWith('/dashboard') 
                      ? 'text-slate-900 border-b-2 border-slate-900 pb-1' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  href="/dashboard"
                >
                  Dashboard
                </Link>
                
                <button
                  className="font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  onClick={async () => {
                    await signOut(auth);
                    router.push('/');
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link 
                  className="font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  href="/auth/sign-up?tab=login"
                >
                  Sign in
                </Link>
                
                <Link 
                  className="bg-slate-900 text-white font-medium px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                  href="/auth/sign-up?tab=signup"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="py-6 space-y-1 px-4">
              <Link 
                className={`block px-3 py-2 font-medium rounded-lg transition-colors ${
                  pathname === '/' 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                href={user ? '/dashboard' : '/'}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              
              {isAdmin && (
                <Link 
                  className={`block px-3 py-2 font-medium rounded-lg transition-colors ${
                    pathname?.startsWith('/admin') 
                      ? 'bg-slate-900 text-white' 
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              
              {user ? (
                <>
                  <Link 
                    className={`block px-3 py-2 font-medium rounded-lg transition-colors ${
                      pathname?.startsWith('/dashboard') 
                        ? 'bg-slate-900 text-white' 
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  
                  <button
                    className="w-full text-left px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={async () => {
                      await signOut(auth);
                      router.push('/');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    className="block px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    href="/auth/sign-up?tab=login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  
                  <Link 
                    className="block px-3 py-2 font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors mt-4"
                    href="/auth/sign-up?tab=signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
