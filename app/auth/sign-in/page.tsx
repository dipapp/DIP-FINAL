'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignInPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth/sign-up?tab=login');
  }, [router]);
  return null;
}
