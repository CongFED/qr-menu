'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// Session Types
// ============================================

export interface CustomerSession {
  sessionId: string;
  customerName: string;
  tableNumber: number;
  tableId: string;
  tableName: string;
}

interface SessionContextType {
  session: CustomerSession | null;
  setSession: (data: Omit<CustomerSession, 'sessionId'> & { sessionId?: string }) => void;
  clearSession: () => void;
  isReady: boolean;
  sessionTerminated: boolean;
  resetSessionTerminated: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// ============================================
// Session Provider
// ============================================

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<CustomerSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [sessionTerminated, setSessionTerminated] = useState(false);

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

  const clearSession = useCallback(() => {
    setSessionState(null);
    try {
      localStorage.removeItem('qrmenu-session');
      localStorage.removeItem('qrmenu-cart');
    } catch {}
  }, []);

  const setSession = useCallback((data: Omit<CustomerSession, 'sessionId'> & { sessionId?: string }) => {
    const newSession: CustomerSession & { createdAt: number } = {
      customerName: data.customerName,
      tableNumber: data.tableNumber,
      tableId: data.tableId,
      tableName: data.tableName,
      sessionId: data.sessionId || uuidv4(),
      createdAt: Date.now(),
    };
    setSessionState(newSession);
    setSessionTerminated(false);
    try {
      localStorage.setItem('qrmenu-session', JSON.stringify(newSession));
    } catch {}
  }, []);

  const resetSessionTerminated = useCallback(() => {
    setSessionTerminated(false);
  }, []);

  // Listen for realtime checkout / session termination via SSE
  useEffect(() => {
    if (!session) return;

    let esSession: EventSource | null = null;
    let esTable: EventSource | null = null;

    try {
      esSession = new EventSource(`/api/sse/orders?channel=session-${session.sessionId}`);
      esSession.addEventListener('session_completed', () => {
        setSessionTerminated(true);
        clearSession();
      });

      esTable = new EventSource(`/api/sse/orders?channel=table-${session.tableNumber}`);
      esTable.addEventListener('session_completed', () => {
        setSessionTerminated(true);
        clearSession();
      });
    } catch (err) {
      console.warn('Could not establish SSE for customer session', err);
    }

    return () => {
      esSession?.close();
      esTable?.close();
    };
  }, [session, clearSession]);

  return (
    <SessionContext.Provider
      value={{
        session,
        setSession,
        clearSession,
        isReady,
        sessionTerminated,
        resetSessionTerminated,
      }}
    >
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
