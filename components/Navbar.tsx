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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container-app">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/dip-logo.png" 
              alt="DIP Logo" 
              className="h-10 w-auto sm:h-12" 
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link 
              className={`font-medium text-sm lg:text-base transition-colors px-3 py-2 rounded-lg ${
                pathname === '/' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
              href={user ? '/dashboard' : '/'}
            >
              Home
            </Link>
            
            {isAdmin && (
              <Link 
                className={`font-medium text-sm lg:text-base transition-colors px-3 py-2 rounded-lg ${
                  pathname?.startsWith('/admin') 
                    ? 'text-orange-600 bg-orange-50' 
                    : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                }`}
                href="/admin"
              >
                Admin
              </Link>
            )}
            
            {user ? (
              <>
                <Link 
                  className={`font-medium text-sm lg:text-base transition-colors px-3 py-2 rounded-lg ${
                    pathname?.startsWith('/dashboard') 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                  }`}
                  href="/dashboard"
                >
                  Dashboard
                </Link>
                
                <button
                  className="font-medium text-sm px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
                  className="font-medium text-sm px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                  href="/auth/sign-up?tab=login"
                >
                  Sign in
                </Link>
                
                <Link 
                  className="font-semibold text-sm px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  href="/auth/sign-up?tab=signup"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
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
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="py-4 space-y-2 px-4">
              <Link 
                className={`block px-4 py-3 font-medium text-base rounded-lg transition-colors ${
                  pathname === '/' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                href={user ? '/dashboard' : '/'}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              
              {isAdmin && (
                <Link 
                  className={`block px-4 py-3 font-medium text-base rounded-lg transition-colors ${
                    pathname?.startsWith('/admin') 
                      ? 'bg-orange-50 text-orange-700' 
                      : 'text-gray-700 hover:bg-gray-50'
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
                    className={`block px-4 py-3 font-medium text-base rounded-lg transition-colors ${
                      pathname?.startsWith('/dashboard') 
                        ? 'bg-purple-50 text-purple-700' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  
                  <button
                    className="w-full text-left px-4 py-3 font-medium text-base text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    className="block px-4 py-3 font-medium text-base text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    href="/auth/sign-up?tab=login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  
                  <Link 
                    className="block px-4 py-3 font-semibold text-base bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                    href="/auth/sign-up?tab=signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
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
