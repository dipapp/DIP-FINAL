'use client';
import Link from 'next/link';

export default function ProviderSignupSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Application Submitted Successfully!
            </h1>
            <p className="text-gray-600">
              Thank you for your interest in becoming a DIP provider.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 text-left space-y-1">
              <li>• We'll review your application within 3-5 business days</li>
              <li>• Our team will verify all provided information and documents</li>
              <li>• We may contact you for additional information if needed</li>
              <li>• You'll receive an email notification once your application is reviewed</li>
              <li>• Approved providers will receive a Provider ID and can complete their account setup</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">Already Approved?</h3>
            <p className="text-sm text-green-800 mb-3">
              If you've been approved and received your Provider ID, you can complete your account setup now.
            </p>
            <Link
              href="/provider/complete-signup"
              className="inline-block bg-green-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Complete Account Setup
            </Link>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              If you have any questions about your application, please contact us at{' '}
              <a href="mailto:providers@dipmembers.com" className="text-blue-600 hover:text-blue-700">
                providers@dipmembers.com
              </a>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Home
              </Link>
              <Link
                href="/provider/signup"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Submit Another Application
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





