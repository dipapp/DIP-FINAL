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
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isHomePage 
        ? scrolled 
          ? 'bg-black/80 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-purple-500/20' 
          : 'bg-transparent'
        : 'bg-white border-b border-gray-200 shadow-sm'
    }`}>
      <div className="container-app">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Logo with Holographic Effect */}
          <Link href="/" className="group flex items-center space-x-3">
            <div className="relative">
              {isHomePage && (
                <>
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/30 to-purple-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </>
              )}
              <div className={`relative flex items-center space-x-2 rounded-xl px-3 py-2 transition-all duration-300 ${
                isHomePage ? 'group-hover:bg-white/10 group-hover:backdrop-blur-sm' : ''
              }`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/dip-logo.png" 
                  alt="DIP Logo" 
                  className="h-10 w-auto sm:h-12 lg:h-14 transition-all duration-300 group-hover:scale-110 drop-shadow-lg" 
                />
                {isHomePage && (
                  <>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                    <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                  </>
                )}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link 
              className={`group relative font-semibold text-sm lg:text-base transition-all duration-300 px-4 py-2 rounded-xl ${
                isHomePage
                  ? `${
                      pathname === '/' 
                        ? 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/30' 
                        : 'text-white hover:text-cyan-300 hover:bg-white/10'
                    }`
                  : `${
                      pathname === '/' 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`
              }`}
              href={user ? '/dashboard' : '/'}
            >
              <span className="relative z-10">🏠 Home</span>
              {isHomePage && pathname === '/' && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 rounded-xl animate-pulse"></div>
              )}
            </Link>
            
            {isAdmin && (
              <Link 
                className={`group relative font-semibold text-sm lg:text-base transition-all duration-300 px-4 py-2 rounded-xl ${
                  isHomePage
                    ? `${
                        pathname?.startsWith('/admin') 
                          ? 'text-orange-400 bg-orange-400/10 border border-orange-400/30' 
                          : 'text-white hover:text-orange-300 hover:bg-white/10'
                      }`
                    : `${
                        pathname?.startsWith('/admin') 
                          ? 'text-orange-600 bg-orange-50' 
                          : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                      }`
                }`}
                href="/admin"
              >
                <span className="relative z-10">👑 Admin</span>
                {isHomePage && pathname?.startsWith('/admin') && (
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-red-500/20 rounded-xl animate-pulse"></div>
                )}
              </Link>
            )}
            
            {user ? (
              <>
                <Link 
                  className={`group relative font-semibold text-sm lg:text-base transition-all duration-300 px-4 py-2 rounded-xl ${
                    isHomePage
                      ? `${
                          pathname?.startsWith('/dashboard') 
                            ? 'text-purple-400 bg-purple-400/10 border border-purple-400/30' 
                            : 'text-white hover:text-purple-300 hover:bg-white/10'
                        }`
                      : `${
                          pathname?.startsWith('/dashboard') 
                            ? 'text-purple-600 bg-purple-50' 
                            : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                        }`
                  }`}
                  href="/dashboard"
                >
                  <span className="relative z-10">📊 Dashboard</span>
                  {isHomePage && pathname?.startsWith('/dashboard') && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-xl animate-pulse"></div>
                  )}
                </Link>
                
                <button
                  className={`group relative font-semibold text-sm px-6 py-3 rounded-xl border transition-all duration-300 transform hover:scale-105 ${
                    isHomePage 
                      ? 'bg-red-500/90 hover:bg-red-600/90 text-white border-red-400/50 hover:border-red-300/50 shadow-lg hover:shadow-red-500/20' 
                      : 'bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300 hover:text-red-700'
                  }`}
                  onClick={async () => {
                    await signOut(auth);
                    router.push('/');
                  }}
                >
                  <span className="flex items-center space-x-2">
                    <span>📴</span>
                    <span>Sign out</span>
                  </span>
                  {isHomePage && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>
                  )}
                </button>
              </>
            ) : (
              <>
                <Link 
                  className={`group relative font-semibold text-sm px-6 py-3 rounded-xl border transition-all duration-300 transform hover:scale-105 ${
                    isHomePage 
                      ? 'bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 backdrop-blur-sm shadow-lg' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                  href="/auth/sign-up?tab=login"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <span>🔑</span>
                    <span>Sign in</span>
                  </span>
                  {isHomePage && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>
                  )}
                </Link>
                
                <Link 
                  className={`group relative overflow-hidden font-black text-sm px-8 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-110 ${
                    isHomePage 
                      ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:shadow-xl' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-blue-500/30 hover:shadow-xl'
                  }`}
                  href="/auth/sign-up?tab=signup"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative flex items-center space-x-2">
                    <span>🚀</span>
                    <span>GET STARTED</span>
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden relative p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
              isHomePage 
                ? 'bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <svg 
              className={`w-6 h-6 transition-all duration-300 ${
                isHomePage ? 'text-white' : 'text-gray-700'
              } ${isMobileMenuOpen ? 'rotate-90' : 'rotate-0'}`} 
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
            {isHomePage && (
              <>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              </>
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className={`md:hidden border-t transition-all duration-300 ${
            isHomePage 
              ? 'border-white/20 bg-black/80 backdrop-blur-2xl' 
              : 'border-gray-200 bg-white'
          }`}>
            <div className="py-6 space-y-4 px-4">
              <Link 
                className={`group relative block px-6 py-4 font-semibold text-base rounded-xl transition-all duration-300 ${
                  isHomePage
                    ? `${
                        pathname === '/' 
                          ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30' 
                          : 'text-white hover:text-cyan-300 hover:bg-white/10 border border-transparent hover:border-white/20'
                      }`
                    : `${
                        pathname === '/' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                }`}
                href={user ? '/dashboard' : '/'}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="flex items-center space-x-3">
                  <span>🏠</span>
                  <span>Home</span>
                </span>
                {isHomePage && pathname === '/' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                )}
              </Link>
              
              {isAdmin && (
                <Link 
                  className={`group relative block px-6 py-4 font-semibold text-base rounded-xl transition-all duration-300 ${
                    isHomePage
                      ? `${
                          pathname?.startsWith('/admin') 
                            ? 'bg-orange-400/20 text-orange-300 border border-orange-400/30' 
                            : 'text-white hover:text-orange-300 hover:bg-white/10 border border-transparent hover:border-white/20'
                        }`
                      : `${
                          pathname?.startsWith('/admin') 
                            ? 'bg-orange-50 text-orange-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                  }`}
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="flex items-center space-x-3">
                    <span>👑</span>
                    <span>Admin</span>
                  </span>
                  {isHomePage && pathname?.startsWith('/admin') && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  )}
                </Link>
              )}
              
              {user ? (
                <>
                  <Link 
                    className={`group relative block px-6 py-4 font-semibold text-base rounded-xl transition-all duration-300 ${
                      isHomePage
                        ? `${
                            pathname?.startsWith('/dashboard') 
                              ? 'bg-purple-400/20 text-purple-300 border border-purple-400/30' 
                              : 'text-white hover:text-purple-300 hover:bg-white/10 border border-transparent hover:border-white/20'
                          }`
                        : `${
                            pathname?.startsWith('/dashboard') 
                              ? 'bg-purple-50 text-purple-700' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`
                    }`}
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-3">
                      <span>📊</span>
                      <span>Dashboard</span>
                    </span>
                    {isHomePage && pathname?.startsWith('/dashboard') && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    )}
                  </Link>
                  
                  <button
                    className={`group relative w-full text-left px-6 py-4 font-semibold text-base rounded-xl transition-all duration-300 ${
                      isHomePage 
                        ? 'text-red-300 hover:text-red-200 hover:bg-red-500/20 border border-red-400/30 hover:border-red-300/50' 
                        : 'text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300'
                    }`}
                    onClick={async () => {
                      await signOut(auth);
                      router.push('/');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="flex items-center space-x-3">
                      <span>📴</span>
                      <span>Sign out</span>
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    className={`group relative block px-6 py-4 font-semibold text-base rounded-xl transition-all duration-300 ${
                      isHomePage 
                        ? 'text-white hover:text-gray-200 hover:bg-white/10 border border-white/20 hover:border-white/40' 
                        : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                    href="/auth/sign-up?tab=login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="flex items-center space-x-3">
                      <span>🔑</span>
                      <span>Sign in</span>
                    </span>
                  </Link>
                  
                  <Link 
                    className={`group relative overflow-hidden block px-6 py-4 font-black text-base rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                      isHomePage 
                        ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-blue-500/30'
                    }`}
                    href="/auth/sign-up?tab=signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative flex items-center space-x-3">
                      <span>🚀</span>
                      <span>GET STARTED</span>
                    </span>
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
