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
    <div className="min-h-0 bg-white text-gray-900 px-4 py-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Logo Section */}
        <div className="text-center space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/dip-logo.png" 
            alt="DIP Logo" 
            className="h-10 w-auto mx-auto" 
          />
          <h2 className="text-lg font-light text-gray-900">driver impact protection</h2>
          <p className="text-base text-gray-700">
            Drive with confidence knowing you're protected
          </p>
        </div>

        {/* Features Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-center text-gray-900">Why Choose DIP?</h2>
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center space-x-2"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-base"
                  style={{ backgroundColor: feature.bgColor, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm leading-tight">{feature.title}</h3>
                  <p className="text-[11px] text-gray-600 leading-tight">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="space-y-3 text-center">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">Ready to get started?</h2>
            <p className="text-sm text-gray-600">
              Join thousands of drivers who trust DIP
            </p>
          </div>

          <a
            href="/auth/sign-up"
            className="block w-full bg-blue-500 text-white rounded-xl py-3 px-6 font-semibold hover:bg-blue-600 transition-colors"
          >
            Get Started →
          </a>

          {/* Trust Indicators */}
          <div className="flex justify-center space-x-6 pt-2">
            {trustIndicators.map((indicator, index) => (
              <div key={index} className="text-center">
                <div className="text-base mb-0.5">{indicator.icon}</div>
                <div className="text-[10px] text-gray-600">{indicator.text}</div>
              </div>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-[10px] text-gray-500 pt-4">
            © 2025 dip. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}