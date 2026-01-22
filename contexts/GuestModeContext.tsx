'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GuestModeContextType {
  showAuthPrompt: boolean;
  authPromptMessage: string;
  requireAuth: (message?: string) => void;
  hideAuthPrompt: () => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

export function GuestModeProvider({ children }: { children: ReactNode }) {
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState('Sign in to continue');

  const requireAuth = (message: string = 'Sign in to continue') => {
    setAuthPromptMessage(message);
    setShowAuthPrompt(true);
  };

  const hideAuthPrompt = () => {
    setShowAuthPrompt(false);
  };

  return (
    <GuestModeContext.Provider value={{ showAuthPrompt, authPromptMessage, requireAuth, hideAuthPrompt }}>
      {children}
    </GuestModeContext.Provider>
  );
}

export function useGuestMode() {
  const context = useContext(GuestModeContext);
  if (context === undefined) {
    throw new Error('useGuestMode must be used within a GuestModeProvider');
  }
  return context;
}
