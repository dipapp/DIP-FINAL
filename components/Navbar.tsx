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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const isAdmin = !!user && user.email === 'admin@dipmembers.com';

  return (
    <nav className="border-b border-white/10">
      <div className="container-app py-2 flex items-center justify-between">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dip-logo.png" alt="DIP Logo" className="h-20 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <Link className={`link ${pathname === '/' ? 'opacity-60' : ''}`} href={user ? '/dashboard' : '/'} style={{ color: '#000' }}>Home</Link>
          {isAdmin && (
            <Link className={`link ${pathname?.startsWith('/admin') ? 'opacity-60' : ''}`} href="/admin" style={{ color: '#000' }}>Admin</Link>
          )}
          {user ? (
            <>
              <Link className={`link ${pathname?.startsWith('/dashboard') ? 'opacity-60' : ''}`} href="/dashboard" style={{ color: '#000' }}>Dashboard</Link>
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  await signOut(auth);
                  router.push('/');
                }}
              >Sign out</button>
            </>
          ) : (
            <>
              <Link className="btn btn-secondary" href="/auth/sign-up?tab=login">Sign in</Link>
              <Link className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6 py-2 font-medium transition-colors" href="/auth/sign-up?tab=signup">Create account</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
