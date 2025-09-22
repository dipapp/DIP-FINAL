import React from 'react'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'DIP - Driver Impact Protection',
  description: 'Professional vehicle protection services for California drivers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white font-sans antialiased">
        <div className="flex flex-col min-h-screen">
          <Navbar />
          
          <main className="flex-1">
            {children}
          </main>
          
          {/* AAA-Style Footer */}
          <footer className="bg-gray-900 text-white py-3">
            <div className="max-w-6xl mx-auto px-4">
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                {/* Brand */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/dip-logo.png" alt="DIP Logo" className="h-8 w-auto" />
                    <span className="text-xl font-bold">DIP</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Professional vehicle support services for California drivers.
                  </p>
                </div>
                
                {/* Services */}
                <div>
                  <h4 className="font-semibold mb-2">Services</h4>
                  <div className="space-y-1 text-sm text-gray-400">
                    <div>Accident Support Services</div>
                    <div>Vehicle Membership</div>
                    <div>Emergency Support</div>
                    <div>Member Benefits</div>
                  </div>
                </div>
                
                {/* Support */}
                <div>
                  <h4 className="font-semibold mb-2">Support</h4>
                  <div className="space-y-1 text-sm text-gray-400">
                    <div>24/7 Emergency</div>
                    <div>Member Support</div>
                    <div>Help Center</div>
                    <div>Contact Us</div>
                  </div>
                </div>
                
                {/* Legal */}
                <div>
                  <h4 className="font-semibold mb-2">Legal</h4>
                  <div className="space-y-1 text-sm text-gray-400">
                    <div>Terms of Service</div>
                    <div>Privacy Policy</div>
                    <div>Membership Agreement</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-8">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                  <p className="text-gray-400 text-sm">
                    DIP is a membership program, not an insurance company.
                  </p>
                  <p className="text-gray-500 text-sm">
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