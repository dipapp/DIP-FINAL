'use client';
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
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container-app">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/dip-logo.png" 
              alt="DIP Logo" 
              className="h-12 w-auto sm:h-16 lg:h-20" 
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link 
              className={`link text-sm lg:text-base transition-colors ${pathname === '/' ? 'opacity-60' : ''}`} 
              href={user ? '/dashboard' : '/'} 
              style={{ color: '#000' }}
            >
              Home
            </Link>
            {isAdmin && (
              <Link 
                className={`link text-sm lg:text-base transition-colors ${pathname?.startsWith('/admin') ? 'opacity-60' : ''}`} 
                href="/admin" 
                style={{ color: '#000' }}
              >
                Admin
              </Link>
            )}
            {user ? (
              <>
                <Link 
                  className={`link text-sm lg:text-base transition-colors ${pathname?.startsWith('/dashboard') ? 'opacity-60' : ''}`} 
                  href="/dashboard" 
                  style={{ color: '#000' }}
                >
                  Dashboard
                </Link>
                <button
                  className="btn btn-secondary text-sm px-4 py-2"
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
                  className="btn btn-secondary text-sm px-4 py-2" 
                  href="/auth/sign-up?tab=login"
                >
                  Sign in
                </Link>
                <Link 
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors" 
                  href="/auth/sign-up?tab=signup"
                >
                  Create account
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
            <div className="py-4 space-y-3">
              <Link 
                className={`block px-4 py-2 text-sm font-medium transition-colors ${pathname === '/' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                href={user ? '/dashboard' : '/'}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              {isAdmin && (
                <Link 
                  className={`block px-4 py-2 text-sm font-medium transition-colors ${pathname?.startsWith('/admin') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              {user ? (
                <>
                  <Link 
                    className={`block px-4 py-2 text-sm font-medium transition-colors ${pathname?.startsWith('/dashboard') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
                    className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    href="/auth/sign-up?tab=login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link 
                    className="block px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg mx-4 hover:bg-blue-600 transition-colors"
                    href="/auth/sign-up?tab=signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Create account
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
