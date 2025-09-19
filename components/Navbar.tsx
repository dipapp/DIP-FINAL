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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const isAdmin = !!user && user.email === 'admin@dipmembers.com';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - AAA Style */}
          <Link href="/" className="flex items-center space-x-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/dip-logo.png" 
              alt="DIP Logo" 
              className="h-10 w-auto" 
            />
            <div className="text-2xl font-bold text-blue-600">DIP</div>
          </Link>

          {/* Desktop Navigation - AAA Style */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              className={`font-medium transition-colors hover:text-blue-600 ${
                pathname === '/' ? 'text-blue-600' : 'text-gray-700'
              }`}
              href={user ? '/dashboard' : '/'}
            >
              Home
            </Link>
            
            {user && (
              <Link 
                className={`font-medium transition-colors hover:text-blue-600 ${
                  pathname?.startsWith('/dashboard') ? 'text-blue-600' : 'text-gray-700'
                }`}
                href="/dashboard"
              >
                My Account
              </Link>
            )}
            
            {isAdmin && (
              <Link 
                className={`font-medium transition-colors hover:text-blue-600 ${
                  pathname?.startsWith('/admin') ? 'text-blue-600' : 'text-gray-700'
                }`}
                href="/admin"
              >
                Admin
              </Link>
            )}
            
            {user ? (
              <button
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={async () => {
                  await signOut(auth);
                  router.push('/');
                }}
              >
                Sign Out
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  href="/auth/sign-up?tab=login"
                >
                  Sign In
                </Link>
                <Link 
                  className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  href="/auth/sign-up?tab=signup"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className={`block py-2 font-medium transition-colors hover:text-blue-600 ${
                  pathname === '/' ? 'text-blue-600' : 'text-gray-700'
                }`}
                href={user ? '/dashboard' : '/'}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              
              {user && (
                <Link 
                  className={`block py-2 font-medium transition-colors hover:text-blue-600 ${
                    pathname?.startsWith('/dashboard') ? 'text-blue-600' : 'text-gray-700'
                  }`}
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Account
                </Link>
              )}
              
              {isAdmin && (
                <Link 
                  className={`block py-2 font-medium transition-colors hover:text-blue-600 ${
                    pathname?.startsWith('/admin') ? 'text-blue-600' : 'text-gray-700'
                  }`}
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              
              {user ? (
                <button
                  className="block w-full text-left py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  onClick={async () => {
                    await signOut(auth);
                    router.push('/');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </button>
              ) : (
                <div className="space-y-2 pt-2">
                  <Link 
                    className="block py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                    href="/auth/sign-up?tab=login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    className="block bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                    href="/auth/sign-up?tab=signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}