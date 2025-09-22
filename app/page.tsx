"use client";
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

const services = [
  {
    title: 'Accident Support Services',
    description: 'Professional assistance when accidents occur to help you get back on the road',
    icon: (
      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: 'Vehicle Membership',
    description: 'Add your vehicles to your membership for comprehensive support services',
    icon: (
      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  {
    title: 'Member Benefits',
    description: 'Exclusive discounts and services for DIP members',
    icon: (
      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    )
  }
];

// Hero slide data
const heroSlides = [
  {
    id: 1,
    title: "Drive with Confidence.",
    subtitle: "We've Got Your Back.",
    description: "Join over 50,000 California drivers who trust DIP for comprehensive vehicle support services and accident assistance.",
    cta: "Join DIP Today",
    ctaSecondary: "Learn More",
    visual: "shield",
    bgGradient: "from-blue-600 via-blue-700 to-blue-800",
    accentColor: "blue"
  },
  {
    id: 2,
    title: "Accident Roadside Support",
    subtitle: "Assisted When It Matters Most.",
    description: "When accidents happen, our certified technicians provide immediate support services to get you safely off the road and back on track.",
    cta: "Get Support Now",
    ctaSecondary: "See Benefits",
    visual: "roadside",
    bgGradient: "from-blue-600 via-blue-700 to-blue-800",
    accentColor: "blue"
  },
  {
    id: 3,
    title: "Save Thousands on Repairs",
    subtitle: "Your Deductible, Supported.",
    description: "Accidents happen. When they do, DIP provides deductible assistance so you can focus on getting back on the road, not the bills.",
    cta: "Start Saving",
    ctaSecondary: "View Benefits",
    visual: "money",
    bgGradient: "from-blue-600 via-blue-700 to-blue-800",
    accentColor: "blue"
  }
];

export default function HomePage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace('/dashboard');
    });
    return () => unsub();
  }, [router]);

  // Ensure page starts at top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentSlideData = heroSlides[currentSlide];

  const getVisualIcon = (visual: string, accentColor: string) => {
    const getAccentClasses = (color: string) => {
      switch (color) {
        case 'blue': return 'bg-blue-400/30 border-blue-300';
        case 'indigo': return 'bg-indigo-400/30 border-indigo-300';
        case 'slate': return 'bg-slate-400/30 border-slate-300';
        default: return 'bg-white/20 border-white/30';
      }
    };

    switch (visual) {
      case 'shield':
        return (
          <div className="relative animate-pulse">
            <div className={`w-32 h-32 ${getAccentClasses(accentColor)} border-2 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-1000 hover:scale-110 hover:rotate-12`}>
              <svg className="w-16 h-16 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-yellow-900 font-bold text-sm">✓</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-shimmer"></div>
          </div>
        );
      case 'roadside':
        return (
          <div className={`w-32 h-32 ${getAccentClasses(accentColor)} border-2 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-1000 hover:scale-110 animate-pulse`}>
            <svg className="w-16 h-16 text-white drop-shadow-lg animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
      case 'money':
        return (
          <div className={`w-32 h-32 ${getAccentClasses(accentColor)} border-2 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-1000 hover:scale-110 animate-pulse`}>
            <svg className="w-16 h-16 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sliding Hero Section */}
      <section className={`bg-gradient-to-br ${currentSlideData.bgGradient} text-white relative overflow-hidden transition-all duration-1000 ease-in-out`}>
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-float"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-20 left-32 w-12 h-12 bg-white rounded-full animate-float-slow"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 py-12 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="transform transition-all duration-1000 ease-out" key={currentSlide}>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight animate-slide-in-left">
                {currentSlideData.title}
                <br />
                <span className="opacity-80 text-2xl lg:text-3xl">{currentSlideData.subtitle}</span>
              </h1>
              <p className="text-lg opacity-90 mb-6 leading-relaxed animate-slide-in-left animation-delay-200">
                {currentSlideData.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 animate-slide-in-left animation-delay-400">
                <a
                  href="/auth/sign-up"
                  className="bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 hover:scale-105 transition-all duration-300 text-center shadow-lg"
                >
                  {currentSlideData.cta}
                </a>
                <button
                  onClick={() => {
                    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="border-2 border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:text-gray-900 hover:scale-105 transition-all duration-300 text-center"
                >
                  {currentSlideData.ctaSecondary}
                </button>
              </div>
            </div>
            <div className="text-center animate-slide-in-right" key={`icon-${currentSlide}`}>
              {getVisualIcon(currentSlideData.visual, currentSlideData.accentColor)}
            </div>
          </div>
        </div>
        
        {/* Enhanced Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`relative transition-all duration-500 ${
                index === currentSlide 
                  ? 'w-8 h-3 bg-white rounded-full scale-110' 
                  : 'w-3 h-3 bg-white/50 rounded-full hover:bg-white/75 hover:scale-110'
              }`}
            >
              {index === currentSlide && (
                <div className="absolute inset-0 bg-white rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Services Section - AAA Style */}
      <section id="services" className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Membership Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need for peace of mind on the road
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 text-blue-600">
                    {service.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Why Choose DIP?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm">24/7 Support</h3>
                    <p className="text-gray-600 text-sm">Round-the-clock assistance whenever you need help</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm">Affordable Membership</h3>
                    <p className="text-gray-600 text-sm">Just $20/month for comprehensive support services</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm">Trusted Network</h3>
                    <p className="text-gray-600 text-sm">Certified service providers across California</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">50,000+</div>
                <div className="text-gray-700 font-medium mb-4">Happy Members</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">99.9%</div>
                    <div className="text-gray-600 text-xs">Response Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">4.9/5</div>
                    <div className="text-gray-600 text-xs">Member Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">
            Ready to Join DIP?
          </h2>
          <p className="text-lg text-blue-100 mb-6">
            Get started with your membership today and drive with confidence.
          </p>
          <a
            href="/auth/sign-up"
            className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 hover:scale-105 transition-all duration-300 inline-block shadow-lg"
          >
            Start Your Membership
          </a>
        </div>
      </section>
    </div>
  );
}