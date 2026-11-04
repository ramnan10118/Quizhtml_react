'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useSessionRecovery } from '@/hooks/useSessionRecovery';
// import { useSocket } from '@/hooks/useSocket';
import SocketClient from '@/lib/socket-client';
import { SessionData } from '@/types/quiz';

interface SessionContextType {
  // Session state
  sessionId: string | null;
  sessionData: SessionData | null;
  isRecovering: boolean;
  isRecovered: boolean;
  hasStoredSession: boolean;
  error: string | null;
  
  // Session actions
  createSession: (type?: 'quiz' | 'poll', userInfo?: Record<string, unknown>) => void;
  joinSession: (sessionId: string, teamName: string) => void;
  recoverSession: (sessionId?: string, userInfo?: Record<string, unknown>) => void;
  clearSession: () => void;
  
  // Auto recovery
  attemptAutoRecovery: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // The socket is created in an effect so it only ever runs in the browser
  // (never during server rendering or prerender) and only once per mount.
  const [socket, setSocket] = useState<Socket | null>(null);
  const attemptAutoRecoveryRef = useRef<() => void>(() => {});

  useEffect(() => {
    const socketClient = SocketClient.getInstance();
    const s = socketClient.connect(undefined, {
      autoRecovery: true,
      sessionRecoveryCallback: () => {
        console.log('Socket reconnected, attempting session recovery...');
        attemptAutoRecoveryRef.current();
      }
    });
    setSocket(s as unknown as Socket);
  }, []);

  // Use session recovery hook
  const {
    sessionId,
    sessionData,
    isRecovering,
    isRecovered,
    error,
    hasStoredSession,
    recoverSession,
    createSession,
    joinSession,
    attemptAutoRecovery,
    clearSessionData
  } = useSessionRecovery(socket);

  useEffect(() => {
    attemptAutoRecoveryRef.current = attemptAutoRecovery;
  }, [attemptAutoRecovery]);

  // Set mounted flag to prevent SSR issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-recovery on first load (only after component is mounted) - but only if session has meaningful data
  useEffect(() => {
    if (!isMounted) return;
    
    if (!isInitialized) {
      setIsInitialized(true);
      // Only auto-recover if we have a stored session, but don't force it
      if (socket && hasStoredSession) {
        console.log('Found stored session, but not forcing auto-recovery');
        // Let individual pages decide if they want to recover
      }
    }
  }, [isMounted, isInitialized, socket, hasStoredSession]);

  // Handle page visibility changes (user returns to tab) - only after mounted
  useEffect(() => {
    if (!isMounted) return;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && hasStoredSession && !isRecovered) {
        console.log('Page became visible, attempting session recovery');
        attemptAutoRecovery();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isMounted, hasStoredSession, isRecovered, attemptAutoRecovery]);

  const contextValue: SessionContextType = {
    // Session state
    sessionId,
    sessionData,
    isRecovering,
    isRecovered,
    hasStoredSession,
    error,
    
    // Session actions
    createSession,
    joinSession,
    recoverSession,
    clearSession: clearSessionData,
    
    // Auto recovery
    attemptAutoRecovery
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

// Hook to get session recovery status for UI
export function useSessionStatus() {
  const { isRecovering, isRecovered, error, hasStoredSession } = useSession();
  
  return {
    isRecovering,
    isRecovered,
    error,
    hasStoredSession,
    showRecoveryUI: isRecovering || (hasStoredSession && !isRecovered && !error)
  };
}