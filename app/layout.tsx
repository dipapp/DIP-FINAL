import React from 'react'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Dip Members',
  description: 'Membership for California drivers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white font-sans antialiased">
        <div className="relative">
          <Navbar />
          
          {/* Dynamic Main Content */}
          <main className="relative">
            {children}
          </main>
          
          {/* Professional Footer */}
          <footer className="bg-slate-900 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                {/* Brand */}
                <div className="md:col-span-1">
                  <div className="flex items-center space-x-3 mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/dip-logo.png" alt="DIP Logo" className="h-8 w-auto" />
                    <span className="text-xl font-bold">DIP</span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Professional vehicle protection services for California drivers.
                  </p>
                </div>
                
                {/* Services */}
                <div>
                  <h4 className="font-semibold mb-4">Services</h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div>Vehicle Protection</div>
                    <div>Roadside Assistance</div>
                    <div>Emergency Support</div>
                    <div>Claims Processing</div>
                  </div>
                </div>
                
                {/* Support */}
                <div>
                  <h4 className="font-semibold mb-4">Support</h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div>24/7 Emergency Line</div>
                    <div>Member Support</div>
                    <div>Online Resources</div>
                    <div>Documentation</div>
                  </div>
                </div>
                
                {/* Contact */}
                <div>
                  <h4 className="font-semibold mb-4">Contact</h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div>support@dipmembers.com</div>
                    <div>California, USA</div>
                    <div>License #ABC123</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-slate-800 pt-8">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                  <p className="text-slate-400 text-sm">
                    DIP is a membership program, not an insurance company.
                  </p>
                  <p className="text-slate-500 text-sm">
                    © 2025 Driver Impact Protection. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
