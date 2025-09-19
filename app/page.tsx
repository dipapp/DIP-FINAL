"use client";
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

const features = [
  {
    icon: '🛡️',
    title: 'Complete Support',
    description: 'Full assistance when unexpected incidents occur',
    color: '#10b981', // green
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  {
    icon: '💵',
    title: 'Just $20/month',
    description: 'Affordable monthly membership that provides peace of mind',
    color: '#3b82f6', // blue
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  {
    icon: '⚡',
    title: 'Instant Support & Roadside Assistance',
    description: 'Get help in minutes with our streamlined process',
    color: '#f59e0b', // orange/amber
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  {
    icon: '✅',
    title: 'Trusted Partner Network',
    description: 'Quality service at our certified partner locations',
    color: '#8b5cf6', // purple
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
];

const trustIndicators = [
  { icon: '🔒', text: 'Secure' },
  { icon: '✓', text: 'Verified' },
  { icon: '⭐', text: '5.0 Rating' },
];

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace('/dashboard');
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-lg mx-auto px-4 py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Logo Section */}
          <div className="text-center space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/dip-logo.png" 
              alt="DIP Logo" 
              className="h-12 w-auto mx-auto sm:h-16" 
            />
            <h2 className="text-lg sm:text-xl font-light text-gray-900">driver impact protection</h2>
            <p className="text-sm sm:text-base text-gray-700 max-w-md mx-auto">
              Drive with confidence knowing you're protected
            </p>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-center text-gray-900">Why Choose DIP?</h2>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 flex items-start space-x-3"
                >
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg flex-shrink-0"
                    style={{ backgroundColor: feature.bgColor, color: feature.color }}
                  >
                    {feature.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base leading-tight mb-1">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ready to get started?</h2>
              <p className="text-sm sm:text-base text-gray-600">
                Join thousands of drivers who trust DIP
              </p>
            </div>

            <a
              href="/auth/sign-up"
              className="block w-full bg-blue-500 text-white rounded-xl py-3 sm:py-4 px-6 font-semibold hover:bg-blue-600 transition-colors text-sm sm:text-base"
            >
              Get Started →
            </a>

            {/* Trust Indicators */}
            <div className="flex justify-center space-x-6 sm:space-x-8 pt-2">
              {trustIndicators.map((indicator, index) => (
                <div key={index} className="text-center">
                  <div className="text-base sm:text-lg mb-1">{indicator.icon}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{indicator.text}</div>
                </div>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-xs sm:text-sm text-gray-500 pt-4">
              © 2025 dip. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}