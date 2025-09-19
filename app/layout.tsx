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
          
          {/* Simple Footer */}
          <footer className="bg-gray-50 border-t border-gray-200 py-12 mt-16">
            <div className="container-app">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  DIP is a membership program, not an insurance company.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  © 2025 DIP. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
