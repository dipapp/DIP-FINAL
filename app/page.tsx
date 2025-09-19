"use client";
import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

const features = [
  {
    icon: 'shield-check',
    title: 'Comprehensive Protection',
    description: 'Complete vehicle protection coverage with 24/7 professional support and assistance.',
  },
  {
    icon: 'clock',
    title: 'Rapid Response',
    description: 'Quick professional assistance when you need it most, available nationwide.',
  },
  {
    icon: 'star',
    title: 'Premium Service',
    description: 'Affordable monthly membership providing premium benefits and peace of mind.',
  },
  {
    icon: 'globe',
    title: 'National Network',
    description: 'Extensive network of certified professionals across all 50 states.',
  },
];

const stats = [
  { number: '50,000+', label: 'Protected Members' },
  { number: '99.9%', label: 'Response Rate' },
  { number: '24/7', label: 'Support Available' },
  { number: '4.9/5', label: 'Customer Rating' },
];

const testimonials = [
  { name: 'Sarah Mitchell', company: 'Business Owner', text: 'DIP provided exceptional service during my roadside emergency. Professional, quick, and reliable.' },
  { name: 'Michael Rodriguez', company: 'IT Manager', text: 'Outstanding value for comprehensive coverage. The peace of mind is worth every penny.' },
  { name: 'Jennifer Chen', company: 'Marketing Director', text: 'Professional service and nationwide coverage. Highly recommend for all drivers.' },
];

const IconComponent = ({ name }: { name: string }) => {
  const iconMap: { [key: string]: JSX.Element } = {
    'shield-check': (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    'clock': (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'star': (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    'globe': (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  };
  return iconMap[name] || <div></div>;
};

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace('/dashboard');
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/dip-logo.png" 
                alt="DIP Logo" 
                className="h-16 w-auto mx-auto" 
              />
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              Professional Vehicle
              <span className="text-slate-600 block">Protection Services</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Comprehensive coverage and professional assistance for California drivers. 
              Join thousands of members who trust DIP for reliable vehicle protection.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <a
                href="/auth/sign-up"
                className="bg-slate-900 text-white font-semibold px-8 py-4 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
              >
                Start Your Membership
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="#about"
                className="border-2 border-slate-900 text-slate-900 font-semibold px-8 py-4 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Learn More
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{stat.number}</div>
                  <div className="text-slate-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Professionals Choose DIP
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive vehicle protection services designed for California's professional community
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700">
                  <IconComponent name={feature.icon} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Trusted by Professionals
            </h2>
            <p className="text-xl text-slate-600">
              See what our members say about their DIP experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg p-8 shadow-sm border border-slate-200">
                <div className="mb-6">
                  <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 32 32">
                    <path d="M10 8c-1.2 0-2 0.8-2 2v6c0 1.2 0.8 2 2 2h2l-2 4h2l2-4h2c1.2 0 2-0.8 2-2v-6c0-1.2-0.8-2-2-2h-6zM20 8c-1.2 0-2 0.8-2 2v6c0 1.2 0.8 2 2 2h2l-2 4h2l2-4h2c1.2 0 2-0.8 2-2v-6c0-1.2-0.8-2-2-2h-6z" />
                  </svg>
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed">{testimonial.text}</p>
                <div className="border-t border-slate-200 pt-4">
                  <div className="font-semibold text-slate-900">{testimonial.name}</div>
                  <div className="text-slate-600 text-sm">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Protected?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of California professionals who trust DIP for their vehicle protection needs.
          </p>
          <a
            href="/auth/sign-up"
            className="bg-white text-slate-900 font-semibold px-8 py-4 rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center"
          >
            Start Your Membership
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center space-x-8 mt-12 text-slate-400">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure & Verified</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Licensed & Insured</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span>4.9/5 Rating</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}