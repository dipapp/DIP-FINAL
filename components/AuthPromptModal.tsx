'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export default function AuthPromptModal({ isOpen, onClose, message }: AuthPromptModalProps) {
  const router = useRouter();

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Dismiss handle */}
        <div className="flex justify-center pt-3">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Logo Section */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sign in / Sign up
            </h2>
            <p className="text-gray-600">
              {message}
            </p>
          </div>

          {/* Auth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => {
                onClose();
                router.push('/auth/sign-up');
              }}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Create Account
            </button>
            
            <button
              onClick={() => {
                onClose();
                router.push('/auth/sign-in');
              }}
              className="w-full py-3 px-4 bg-white text-blue-600 font-semibold rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition-all"
            >
              Sign In
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-2 px-4 text-gray-600 font-medium hover:text-gray-900 transition-colors"
            >
              Continue Browsing
            </button>
          </div>

          {/* Terms */}
          <p className="text-xs text-gray-500 leading-relaxed">
            By continuing, you agree to DIP's{' '}
            <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
