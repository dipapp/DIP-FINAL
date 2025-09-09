'use client';
import BackButton from '@/components/BackButton';

export default function BillingHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-start">
        <BackButton />
      </div>

      <div className="card">
        <h1 className="text-2xl font-bold mb-2">Billing History</h1>
        <p className="text-muted mb-4">Your past charges and receipts will appear here.</p>
        <div className="text-center py-10">
          <div className="text-5xl mb-3">📄</div>
          <div className="font-medium mb-1">No billing records found</div>
          <div className="text-sm text-muted">Once you are charged, your invoices will show up on this page.</div>
        </div>
      </div>
    </div>
  );
}









