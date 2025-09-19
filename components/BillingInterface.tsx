'use client';
import React, { useState, useEffect } from 'react';
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
    switch (status) {
      case 'paid':
        return <span className="badge badge-success">Paid</span>;
      case 'open':
        return <span className="badge badge-warning">Open</span>;
      case 'draft':
        return <span className="badge badge-gray">Draft</span>;
      case 'void':
        return <span className="badge badge-error">Void</span>;
      case 'uncollectible':
        return <span className="badge badge-error">Uncollectible</span>;
      default:
        return <span className="badge badge-gray">Unknown</span>;
    }
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
        <div className="card w-full max-w-4xl">
          <div className="card-body">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading billing information...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Billing & Invoices</h2>
              <p className="text-gray-600 mt-1">View and manage your payment history</p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="card-body overflow-y-auto max-h-[calc(90vh-120px)]">
          {error ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invoices Found</h3>
              <p className="text-gray-600">You don't have any billing history yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="font-semibold text-gray-900">
                          Invoice #{invoice.number || invoice.id.slice(-8)}
                        </h3>
                        {getStatusBadge(invoice.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {formatDate(invoice.created)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Period:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                          </span>
                        </div>
                      </div>
                      
                      {invoice.description && (
                        <p className="text-sm text-gray-600 mt-2">{invoice.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-4">
                      <button
                        onClick={() => downloadInvoice(invoice)}
                        className="btn btn-secondary text-sm"
                        disabled={!invoice.invoice_pdf && !invoice.hosted_invoice_url}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </button>
                      {invoice.hosted_invoice_url && (
                        <button
                          onClick={() => window.open(invoice.hosted_invoice_url, '_blank')}
                          className="btn btn-primary text-sm"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
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
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure billing powered by Stripe</span>
            </div>
            <div>
              Need help? Contact <a href="mailto:support@dipmembers.com" className="text-blue-600 hover:text-blue-700 font-medium">support@dipmembers.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}