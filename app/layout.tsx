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
          
          {/* Minimal Footer */}
          <footer className="bg-gray-900 text-white py-2">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
                <div className="mb-1 md:mb-0">
                  DIP is a membership program, not an insurance company.
                </div>
                <div>
                  © 2025 Driver Impact Protection. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}