'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// Session Types
// ============================================

interface CustomerSession {
  sessionId: string;
  customerName: string;
  tableNumber: number;
  tableId: string;
  tableName: string;
}

interface SessionContextType {
  session: CustomerSession | null;
  setSession: (data: Omit<CustomerSession, 'sessionId'>) => void;
  clearSession: () => void;
  isReady: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// ============================================
// Session Provider
// ============================================

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<CustomerSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('qrmenu-session');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if session is still valid (less than 8 hours old)
        if (parsed.createdAt && Date.now() - parsed.createdAt < 8 * 60 * 60 * 1000) {
          setSessionState(parsed);
        } else {
          localStorage.removeItem('qrmenu-session');
        }
      }
    } catch {}
    setIsReady(true);
  }, []);

  const setSession = useCallback((data: Omit<CustomerSession, 'sessionId'>) => {
    const newSession: CustomerSession & { createdAt: number } = {
      ...data,
      sessionId: uuidv4(),
      createdAt: Date.now(),
    };
    setSessionState(newSession);
    localStorage.setItem('qrmenu-session', JSON.stringify(newSession));
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(null);
    localStorage.removeItem('qrmenu-session');
    localStorage.removeItem('qrmenu-cart');
  }, []);

  return (
    <SessionContext.Provider value={{ session, setSession, clearSession, isReady }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useCustomerSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useCustomerSession must be used within SessionProvider');
  }
  return context;
}
