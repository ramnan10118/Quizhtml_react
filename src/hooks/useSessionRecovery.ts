import { useState, useCallback, useEffect } from 'react';
import { SessionData, SessionRecoveryRequest } from '@/types/quiz';
import { Socket } from 'socket.io-client';

export interface SessionRecoveryState {
  sessionId: string | null;
  isRecovering: boolean;
  isRecovered: boolean;
  sessionData: SessionData | null;
  error: string | null;
  userInfo: Record<string, unknown> | null;
}

const STORAGE_KEY = 'quiz_session_data';

export function useSessionRecovery(socket: Socket | null) {
  const [recoveryState, setRecoveryState] = useState<SessionRecoveryState>({
    sessionId: null,
    isRecovering: false,
    isRecovered: false,
    sessionData: null,
    error: null,
    userInfo: null
  });

  const [hasStoredSession, setHasStoredSession] = useState(false);

  // Save session data to localStorage
  const saveSessionData = useCallback((sessionId: string, userInfo?: Record<string, unknown>) => {
    // Check if we're in the browser (not SSR)
    if (typeof window === 'undefined') {
      return;
    }
    
    const data = {
      sessionId,
      userInfo,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setRecoveryState(prev => ({
      ...prev,
      sessionId,
      userInfo: userInfo || null
    }));
    setHasStoredSession(true);
  }, []);

  // Get session data from localStorage
  const getStoredSessionData = useCallback(() => {
    // Check if we're in the browser (not SSR)
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Check if session is not too old (2 hours)
        if (Date.now() - data.timestamp < 2 * 60 * 60 * 1000) {
          return data;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error reading stored session data:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return null;
  }, []);

  // Clear session data
  const clearSessionData = useCallback(() => {
    // Check if we're in the browser (not SSR)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setRecoveryState({
      sessionId: null,
      isRecovering: false,
      isRecovered: false,
      sessionData: null,
      error: null,
      userInfo: null
    });
    setHasStoredSession(false);
  }, []);

  // Attempt to recover session
  const recoverSession = useCallback((sessionId?: string, userInfo?: Record<string, unknown>) => {
    if (!socket) {
      console.warn('Socket not available for session recovery');
      return;
    }

    const storedData = getStoredSessionData();
    const targetSessionId = sessionId || storedData?.sessionId;
    const targetUserInfo = userInfo || storedData?.userInfo;

    if (!targetSessionId) {
      console.log('No session to recover');
      return;
    }

    console.log('Attempting to recover session:', targetSessionId);
    
    setRecoveryState(prev => ({
      ...prev,
      isRecovering: true,
      error: null,
      sessionId: targetSessionId,
      userInfo: targetUserInfo || null
    }));

    const recoveryRequest: SessionRecoveryRequest = {
      sessionId: targetSessionId,
      userInfo: targetUserInfo
    };

    socket.emit('recover-session', recoveryRequest);
  }, [socket, getStoredSessionData]);

  // Create a new session
  const createSession = useCallback((type: 'quiz' | 'poll' = 'quiz', userInfo?: Record<string, unknown>) => {
    if (!socket) {
      console.warn('Socket not available for creating session');
      return;
    }

    console.log('Creating new session:', type);
    
    setRecoveryState(prev => ({
      ...prev,
      isRecovering: true,
      error: null
    }));

    socket.emit('create-session', { type, userInfo });
  }, [socket]);

  // Join an existing session
  const joinSession = useCallback((sessionId: string, teamName: string) => {
    if (!socket) {
      console.warn('Socket not available for joining session');
      return;
    }

    console.log('Joining session:', sessionId, 'as', teamName);
    
    setRecoveryState(prev => ({
      ...prev,
      isRecovering: true,
      error: null,
      sessionId,
      userInfo: { teamName }
    }));

    socket.emit('join-session', { sessionId, teamName });
  }, [socket]);

  // Auto recovery on page load
  const attemptAutoRecovery = useCallback(() => {
    const storedData = getStoredSessionData();
    if (storedData?.sessionId) {
      console.log('Found stored session, attempting auto-recovery:', storedData.sessionId);
      recoverSession();
    }
  }, [getStoredSessionData, recoverSession]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleSessionRecovered = (data: { sessionId: string; sessionData: SessionData }) => {
      console.log('Session recovered successfully:', data.sessionId);
      setRecoveryState(prev => ({
        ...prev,
        isRecovering: false,
        isRecovered: true,
        sessionData: data.sessionData,
        error: null
      }));
      
      // Update stored data
      saveSessionData(data.sessionId, data.sessionData.userInfo);
    };

    const handleSessionCreated = (data: { sessionId: string; sessionData: SessionData }) => {
      console.log('Session created successfully:', data.sessionId);
      setRecoveryState(prev => ({
        ...prev,
        isRecovering: false,
        isRecovered: true,
        sessionData: data.sessionData,
        error: null
      }));
      
      // Save new session
      saveSessionData(data.sessionId);
    };

    const handleSessionJoined = (data: { sessionId: string; sessionData: SessionData }) => {
      console.log('Session joined successfully:', data.sessionId);
      setRecoveryState(prev => ({
        ...prev,
        isRecovering: false,
        isRecovered: true,
        sessionData: data.sessionData,
        error: null
      }));
      
      // Save session data
      saveSessionData(data.sessionId, { teamName: data.sessionData.teamName });
    };

    const handleSessionNotFound = (data: { sessionId: string }) => {
      console.log('Session not found:', data.sessionId);
      setRecoveryState(prev => ({
        ...prev,
        isRecovering: false,
        isRecovered: false,
        error: `Session ${data.sessionId} not found or expired`
      }));
      
      // Clear invalid session data
      clearSessionData();
    };

    const handleParticipantJoined = (data: { socketId: string; teamName: string }) => {
      console.log('Participant joined:', data.teamName);
      // You can update UI to show new participant
    };

    const handleParticipantDisconnected = (data: { socketId: string; teamName: string }) => {
      console.log('Participant disconnected:', data.teamName);
      // You can update UI to show participant as disconnected
    };

    // Register event listeners
    socket.on('session-recovered', handleSessionRecovered);
    socket.on('session-created', handleSessionCreated);
    socket.on('session-joined', handleSessionJoined);
    socket.on('session-not-found', handleSessionNotFound);
    socket.on('participant-joined', handleParticipantJoined);
    socket.on('participant-disconnected', handleParticipantDisconnected);

    // Cleanup
    return () => {
      socket.off('session-recovered', handleSessionRecovered);
      socket.off('session-created', handleSessionCreated);
      socket.off('session-joined', handleSessionJoined);
      socket.off('session-not-found', handleSessionNotFound);
      socket.off('participant-joined', handleParticipantJoined);
      socket.off('participant-disconnected', handleParticipantDisconnected);
    };
  }, [socket, saveSessionData, clearSessionData]);

  // Check for stored session on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = getStoredSessionData();
      setHasStoredSession(!!stored);
    }
  }, [getStoredSessionData]);

  return {
    ...recoveryState,
    recoverSession,
    createSession,
    joinSession,
    attemptAutoRecovery,
    saveSessionData,
    clearSessionData,
    hasStoredSession
  };
}