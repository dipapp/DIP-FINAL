'use client';
import { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import { subscribeMyProfile } from '@/lib/firebase/memberActions';

type Invoice = {
  id: string;
  created: string | null;
  status: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string | null;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
};

export default function BillingHistoryPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amountCents: number | null | undefined, currency: string | null) => {
    const amount = (amountCents ?? 0) / 100;
    const code = (currency || 'usd').toUpperCase();
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(amount);
    } catch {
      return `$${amount.toFixed(2)} ${code}`;
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  useEffect(() => {
    const unsub = subscribeMyProfile((p) => setUid(p?.uid ?? null));
    return () => { try { (unsub as any)?.(); } catch {} };
  }, []);

  useEffect(() => {
    async function load() {
      if (!uid) { setInvoices([]); setLoading(false); return; }
      try {
        const resp = await fetch(`/api/billing/history?uid=${encodeURIComponent(uid)}`);
        const data = await resp.json();
        if (resp.ok) setInvoices(data.invoices || []);
      } finally { setLoading(false); }
    }
    load();
  }, [uid]);

  return (
    <div className="space-y-6">
      <div className="flex justify-start">
        <BackButton />
      </div>

      <div className="card">
        <h1 className="text-2xl font-bold mb-2">Invoices</h1>

        {loading ? (
          <div className="text-center py-10">
            <div className="loading-spinner mx-auto mb-3"></div>
            <div className="text-sm text-muted">Loading billing records…</div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">📄</div>
            <div className="font-medium mb-1">No billing records found</div>
            <div className="text-sm text-muted">Once you are charged, your invoices will show on this page.</div>
          </div>
        ) : (
          <div className="divide-y">
            {invoices.map((inv) => (
              <div key={inv.id} className="py-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium truncate">Invoice • {formatDate(inv.created)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-medium">{formatCurrency(inv.amount_paid || inv.amount_due, inv.currency)}</div>
                  {inv.hosted_invoice_url && (
                    <a className="link" href={inv.hosted_invoice_url} target="_blank" rel="noreferrer">View</a>
                  )}
                  {inv.invoice_pdf && (
                    <a className="link" href={inv.invoice_pdf} target="_blank" rel="noreferrer">PDF</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}









