'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth/sign-up?tab=login');
  }, [router]);
  return null;
}
