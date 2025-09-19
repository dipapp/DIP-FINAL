"use client";
import { useEffect } from 'react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-blue-900 to-slate-900"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative">
          <div className="container-app py-20 lg:py-32 text-center">
            <div className="relative mx-auto max-w-4xl">
              {/* Logo with Holographic Effect */}
              <div className="relative mb-8 group">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-all duration-1000 animate-pulse"></div>
                <div className="relative bg-black/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/dip-logo.png" 
                    alt="DIP Logo" 
                    className="h-20 w-auto mx-auto lg:h-28 drop-shadow-2xl" 
                  />
                  <div className="absolute top-4 right-4 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                  <div className="absolute bottom-4 left-4 w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-6 mb-12">
                <h1 className="text-5xl lg:text-7xl font-black bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent tracking-tight leading-tight">
                  DRIVER IMPACT
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                    PROTECTION
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl text-gray-300 font-medium max-w-3xl mx-auto leading-relaxed">
                  Experience the future of vehicle protection with <span className="text-cyan-400 font-bold">next-generation coverage</span> and <span className="text-purple-400 font-bold">lightning-fast assistance</span>
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <a
                  href="/auth/sign-up"
                  className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700 text-white font-black text-xl px-10 py-5 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-cyan-500/30 min-w-[280px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="relative flex items-center justify-center space-x-3">
                    <span>🚀</span>
                    <span>START PROTECTION</span>
                    <span>⚡</span>
                  </div>
                </a>
                <a
                  href="#features"
                  className="group relative bg-black/50 backdrop-blur-xl border border-white/30 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-300 hover:bg-white/10 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/20 min-w-[200px]"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>📖</span>
                    <span>LEARN MORE</span>
                  </span>
                </a>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                {stats.map((stat, index) => (
                  <div key={index} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                    <div className="relative bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center shadow-xl">
                      <div className="text-3xl mb-2">{stat.icon}</div>
                      <div className="text-3xl lg:text-4xl font-black text-cyan-400 mb-1">{stat.number}</div>
                      <div className="text-sm lg:text-base text-gray-300 font-medium">{stat.label}</div>
                      <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="relative py-20">
          <div className="container-app">
            <div className="text-center mb-16">
              <div className="relative inline-block mb-6">
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
                <div className="relative bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl px-8 py-4">
                  <h2 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                    NEXT-LEVEL BENEFITS
                  </h2>
                </div>
              </div>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Advanced protection technology meets unparalleled customer service
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <div key={index} className="group relative">
                  <div className={`absolute -inset-1 bg-gradient-to-r ${feature.gradient} rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500`}></div>
                  <div className={`relative bg-black/60 backdrop-blur-2xl border border-${feature.borderColor} rounded-3xl p-8 shadow-2xl shadow-${feature.glowColor} transition-all duration-300 group-hover:scale-105`}>
                    <div className="flex items-start space-x-6">
                      <div className="relative">
                        <div className={`absolute -inset-2 bg-gradient-to-r ${feature.gradient} rounded-2xl blur-md opacity-50 animate-pulse`}></div>
                        <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-2xl shadow-${feature.glowColor}`}>
                          <span className="text-2xl">{feature.icon}</span>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-white mb-3 tracking-wide">{feature.title}</h3>
                        <p className="text-gray-300 font-medium leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                    
                    {/* Scanning Line Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="relative py-20">
          <div className="container-app">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent mb-6">
                MEMBER EXPERIENCES
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                See what our protected members say about their DIP experience
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
                  <div className="relative bg-black/60 backdrop-blur-2xl border border-emerald-400/30 rounded-3xl p-8 shadow-2xl shadow-emerald-500/20">
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-xl">⭐</span>
                      ))}
                    </div>
                    <p className="text-gray-300 font-medium mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                    <div className="text-emerald-300 font-bold">— {testimonial.name}</div>
                    <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="relative py-20">
          <div className="container-app text-center">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-all duration-1000 animate-pulse"></div>
              <div className="relative bg-black/70 backdrop-blur-2xl border border-white/20 rounded-3xl p-12 shadow-2xl">
                <div className="space-y-8">
                  <h2 className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent tracking-tight">
                    READY TO ACTIVATE?
                  </h2>
                  <p className="text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto font-medium">
                    Join the future of vehicle protection today
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    <a
                      href="/auth/sign-up"
                      className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700 text-white font-black text-2xl px-12 py-6 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-cyan-500/30"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <div className="relative flex items-center space-x-4">
                        <span>⚡</span>
                        <span>ACTIVATE NOW</span>
                        <span>🚀</span>
                      </div>
                    </a>
                  </div>
                  
                  {/* Trust Indicators */}
                  <div className="flex justify-center items-center space-x-8 pt-8">
                    <div className="flex items-center space-x-2 text-emerald-300">
                      <span className="text-xl">🔒</span>
                      <span className="font-bold">Bank-Level Security</span>
                    </div>
                    <div className="flex items-center space-x-2 text-cyan-300">
                      <span className="text-xl">✓</span>
                      <span className="font-bold">Verified Protection</span>
                    </div>
                    <div className="flex items-center space-x-2 text-purple-300">
                      <span className="text-xl">⭐</span>
                      <span className="font-bold">5.0 Rating</span>
                    </div>
                  </div>
                </div>
                
                {/* Floating Particles */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-cyan-400 rounded-full animate-ping"></div>
                <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/4 -left-3 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
              </div>
            </div>
            
            {/* Copyright */}
            <p className="text-gray-500 mt-12 text-lg">
              © 2025 DIP - Driver Impact Protection. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}