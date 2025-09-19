"use client";
import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

const features = [
  {
    icon: '🛡️',
    title: 'Complete Protection',
    description: 'Comprehensive coverage for all your driving needs with 24/7 support',
    gradient: 'from-emerald-400 via-teal-500 to-green-600',
    glowColor: 'emerald-500/20',
    borderColor: 'emerald-400/30',
  },
  {
    icon: '⚡',
    title: 'Lightning Fast Response',
    description: 'Get assistance in minutes with our cutting-edge dispatch system',
    gradient: 'from-yellow-400 via-orange-500 to-red-600',
    glowColor: 'orange-500/20',
    borderColor: 'orange-400/30',
  },
  {
    icon: '💎',
    title: 'Premium Membership',
    description: 'Just $20/month for unlimited peace of mind and premium benefits',
    gradient: 'from-purple-400 via-violet-500 to-indigo-600',
    glowColor: 'purple-500/20',
    borderColor: 'purple-400/30',
  },
  {
    icon: '🌐',
    title: 'Nationwide Coverage',
    description: 'Coast-to-coast protection with our certified partner network',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    glowColor: 'cyan-500/20',
    borderColor: 'cyan-400/30',
  },
];

const stats = [
  { number: '50K+', label: 'Protected Members', icon: '👥' },
  { number: '99.9%', label: 'Response Rate', icon: '⚡' },
  { number: '24/7', label: 'Support Available', icon: '🌙' },
  { number: '5.0', label: 'Customer Rating', icon: '⭐' },
];

const testimonials = [
  { name: 'Sarah M.', text: 'DIP saved me during a roadside emergency. Quick response and professional service!', rating: 5 },
  { name: 'Mike K.', text: 'Best $20 I spend each month. The peace of mind is invaluable.', rating: 5 },
  { name: 'Jennifer L.', text: 'Amazing coverage and support. Highly recommend to all drivers.', rating: 5 },
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
        {/* Hero Section */}
        <div className="relative">
          <div className="container-app py-12 lg:py-16 text-center">
            <div className="relative mx-auto max-w-2xl">
              {/* Simple Logo */}
              <div className="mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/dip-logo.png" 
                  alt="DIP Logo" 
                  className="h-16 w-auto mx-auto lg:h-20" 
                />
              </div>

              {/* Main Headline */}
              <div className="space-y-4 mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                  Driver Impact Protection
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Comprehensive vehicle protection with fast, reliable assistance when you need it most
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
                <a
                  href="/auth/sign-up"
                  className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </a>
                <a
                  href="#features"
                  className="border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Learn More
                </a>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="relative py-12">
          <div className="container-app">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                Why Choose DIP?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Comprehensive protection with reliable service
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {features.map((feature, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="relative py-12">
          <div className="container-app">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                What Our Members Say
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Real experiences from DIP members
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center space-x-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-500 text-lg">⭐</span>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed italic">"{testimonial.text}"</p>
                  <div className="text-gray-900 font-semibold">— {testimonial.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="relative py-12">
          <div className="container-app text-center">
            <div className="bg-gray-50 rounded-xl p-8 max-w-2xl mx-auto">
              <div className="space-y-6">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Ready to Get Started?
                </h2>
                <p className="text-lg text-gray-600">
                  Join thousands of protected drivers today
                </p>
                <a
                  href="/auth/sign-up"
                  className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Your Membership
                </a>
                
                {/* Trust Indicators */}
                <div className="flex justify-center items-center space-x-6 pt-4 text-sm">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <span>🔒</span>
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <span>✓</span>
                    <span>Verified</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <span>⭐</span>
                    <span>5.0 Rating</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Copyright */}
            <p className="text-gray-500 mt-8 text-sm">
              © 2025 DIP - Driver Impact Protection. All rights reserved.
            </p>
          </div>
        </div>
    </div>
  );
}