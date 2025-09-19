'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BackButton from '@/components/BackButton';

function ManageSubscriptionPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('active');

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        throw new Error('Failed to create portal session');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton />
      </div>

      {/* Subscription Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Membership Subscription</h2>
          <p className="text-gray-600 mt-1">Manage your DIP membership and billing</p>
        </div>
        
        <div className="card-body">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-blue-900">DIP Membership</h4>
                    <p className="text-blue-700">Complete vehicle protection</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">$20</div>
                    <div className="text-blue-600 text-sm">per month</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-blue-700">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    24/7 Roadside Assistance
                  </div>
                  <div className="flex items-center text-blue-700">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Vehicle Protection Coverage
                  </div>
                  <div className="flex items-center text-blue-700">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Member Support
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-700">Membership Status</span>
                  <span className="badge badge-success">Active</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-700">Billing Status</span>
                  <span className="badge badge-success">Current</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-700">Next Billing Date</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-700">Payment Method</span>
                  <span className="text-gray-900 font-medium">•••• 4242</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Management */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Billing Management</h3>
          <p className="text-gray-600 mt-1">Update payment methods and view billing history</p>
        </div>
        
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="loading-spinner mr-2"></div>
                  Loading...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Manage Billing
                </>
              )}
            </button>
            
            <button className="btn btn-secondary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Invoice
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Secure Billing</h4>
                <p className="text-blue-700 text-sm">
                  All payments are processed securely through Stripe. Your payment information is never stored on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManageSubscriptionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div></div>}>
      <ManageSubscriptionPageContent />
    </Suspense>
  );
}