'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    const uid = searchParams?.get('uid');
    if (!sessionId || !uid) {
      setError('Missing session details.');
      setLoading(false);
      return;
    }

    async function finalize() {
      try {
        const resp = await fetch(`/api/stripe/checkout-result?session_id=${encodeURIComponent(sessionId)}&uid=${encodeURIComponent(uid)}`);
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Failed to store subscription');
        setSubscriptionId(data.subscriptionId || null);
        setCustomerId(data.customerId || null);
        setError(null);
      } catch (e: any) {
        console.error('[billing-success] finalize error', e);
        setError(e?.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }

    finalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="card text-center">
        {loading ? (
          <>
            <div className="loading-spinner mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold mb-2">Finalizing your membership…</h1>
            <p className="text-muted">Please wait while we confirm your subscription.</p>
          </>
        ) : error ? (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold mb-2">We hit a snag</h1>
            <p className="text-muted mb-6">{error}</p>
            <div className="flex justify-center gap-3">
              <button className="btn btn-secondary" onClick={() => router.back()}>Go Back</button>
              <Link href="/dashboard" className="btn btn-primary">Return to Dashboard</Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-semibold mb-2">Membership Activated</h1>
            <p className="text-muted mb-4">Your subscription is active. You can manage your vehicles anytime.</p>
            <div className="bg-gray-50 rounded-lg p-3 text-left text-sm mb-6">
              <div className="flex items-center justify-between"><span className="text-muted">Subscription ID</span><span className="font-mono">{subscriptionId || '—'}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted">Customer ID</span><span className="font-mono">{customerId || '—'}</span></div>
            </div>
            <Link href="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
          </>
        )}
      </div>
    </div>
  );
}





