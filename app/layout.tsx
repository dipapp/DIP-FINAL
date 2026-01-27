'use client';
import React from 'react'
import './globals.css'
import Navbar from '@/components/Navbar'
import { GuestModeProvider, useGuestMode } from '@/contexts/GuestModeContext'
import AuthPromptModal from '@/components/AuthPromptModal'

function AppContent({ children }: { children: React.ReactNode }) {
  const { showAuthPrompt, authPromptMessage, hideAuthPrompt } = useGuestMode();

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-1">
          {children}
        </main>
        
        {/* Balanced Footer */}
        <footer className="bg-gray-900 text-white py-4">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6 mb-4">
              {/* Brand */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/dip-logo.png" alt="DIP Logo" className="h-6 w-auto" />
                    <span className="text-[8px] font-semibold text-gray-400 tracking-wide">MEMBERS™</span>
                  </div>
                  <span className="text-sm font-bold text-gray-500">Digital Car Wallet</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Your digital wallet & automotive marketplace.
                </p>
              </div>
              
              {/* Marketplace */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">Marketplace</h4>
                <div className="space-y-1 text-sm text-gray-400">
                  <div>Buy & Sell Vehicles</div>
                  <div>Auto Parts & Accessories</div>
                  <div>Vehicle Services</div>
                  <div>Member Listings</div>
                </div>
              </div>
              
              {/* Support */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">Support</h4>
                <div className="space-y-1 text-sm">
                  <a href="mailto:support@dipmembers.com" className="text-gray-400 hover:text-white transition-colors block">
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-3">
              <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
                <div className="mb-1 md:mb-0">
                  John 3:16
                </div>
                <div>
                  © 2025-2026 DIP. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Auth Prompt Modal */}
      <AuthPromptModal 
        isOpen={showAuthPrompt} 
        onClose={hideAuthPrompt}
        message={authPromptMessage}
      />
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <title>Car Marketplace & Digital Wallet</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white font-sans antialiased">
        <GuestModeProvider>
          <AppContent>{children}</AppContent>
        </GuestModeProvider>
      </body>
    </html>
  );
}