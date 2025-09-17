'use client';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/client';

interface Invoice {
  id: string;
  number: string;
  status: string;
  amount_paid: number;
  amount_due: number;
  total: number;
  currency: string;
  created: number;
  due_date: number | null;
  paid_at: number | null;
  hosted_invoice_url: string;
  invoice_pdf: string;
  description: string;
  period_start: number;
  period_end: number;
  subscription: {
    id: string;
    status: string | null;
  } | null;
}

interface BillingInterfaceProps {
  vehicleId: string;
  onClose: () => void;
}

export default function BillingInterface({ vehicleId, onClose }: BillingInterfaceProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [vehicleId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        throw new Error('Please sign in to view invoices');
      }

      const response = await fetch(`/api/stripe/invoices?vehicleId=${vehicleId}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
      open: { color: 'bg-yellow-100 text-yellow-800', text: 'Open' },
      draft: { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
      void: { color: 'bg-red-100 text-red-800', text: 'Void' },
      uncollectible: { color: 'bg-red-100 text-red-800', text: 'Uncollectible' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const downloadInvoice = (invoice: Invoice) => {
    if (invoice.invoice_pdf) {
      window.open(invoice.invoice_pdf, '_blank');
    } else if (invoice.hosted_invoice_url) {
      window.open(invoice.hosted_invoice_url, '_blank');
    } else {
      alert('Invoice PDF not available');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="card w-full max-w-4xl bg-white">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your billing history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-6xl bg-white max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Billing & Invoices</h2>
            <p className="text-gray-600 mt-1">View and download your payment history</p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Invoices</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchInvoices}
                className="btn btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invoices Found</h3>
              <p className="text-gray-600">You don't have any billing history yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Invoice #{invoice.number || invoice.id.slice(-8)}
                        </h3>
                        {getStatusBadge(invoice.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-2 font-medium">
                            {formatDate(invoice.created)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Period:</span>
                          <span className="ml-2 font-medium">
                            {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                          </span>
                        </div>
                      </div>
                      
                      {invoice.description && (
                        <p className="text-sm text-gray-600 mt-2">{invoice.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => downloadInvoice(invoice)}
                        className="btn btn-secondary text-sm"
                        disabled={!invoice.invoice_pdf && !invoice.hosted_invoice_url}
                      >
                        📥 Download
                      </button>
                      {invoice.hosted_invoice_url && (
                        <button
                          onClick={() => window.open(invoice.hosted_invoice_url, '_blank')}
                          className="btn btn-primary text-sm"
                        >
                          👁️ View
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span>🔒</span>
              <span>Secure billing powered by Stripe</span>
            </div>
            <div>
              Need help? Contact <a href="mailto:support@dipmembers.com" className="text-blue-600 hover:text-blue-700">support@dipmembers.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

