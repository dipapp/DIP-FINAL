'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <nav className="border-b border-white/10">
      <div className="container-app py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold">Dip<span className="text-blue-500">Members</span></Link>
        <div className="flex items-center gap-4">
          <Link className={`link ${pathname === '/' ? 'opacity-60' : ''}`} href="/">Home</Link>
          {user ? (
            <>
              <Link className={`link ${pathname?.startsWith('/dashboard') ? 'opacity-60' : ''}`} href="/dashboard">Dashboard</Link>
              <button className="btn btn-secondary" onClick={() => signOut(auth)}>Sign out</button>
            </>
          ) : (
            <>
              <Link className="btn btn-secondary" href="/auth/sign-in">Sign in</Link>
              <Link className="btn btn-primary" href="/auth/sign-up">Create account</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
