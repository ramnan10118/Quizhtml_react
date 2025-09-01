'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSession, useSessionStatus } from '@/contexts/SessionContext';

interface SessionRecoveryProps {
  onSkipRecovery?: () => void;
  onRetryRecovery?: () => void;
}

export function SessionRecovery({ onSkipRecovery, onRetryRecovery }: SessionRecoveryProps) {
  const { attemptAutoRecovery, clearSession } = useSession();
  const { isRecovering, error, hasStoredSession } = useSessionStatus();

  const handleRetry = () => {
    onRetryRecovery?.();
    attemptAutoRecovery();
  };

  const handleSkip = () => {
    clearSession();
    onSkipRecovery?.();
  };

  if (!hasStoredSession && !isRecovering) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {isRecovering ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                Restoring Session...
              </>
            ) : error ? (
              "Session Recovery Failed"
            ) : (
              "Session Found"
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {isRecovering && (
            <p className="text-gray-600 dark:text-gray-400">
              We found your previous session and are restoring your progress...
            </p>
          )}
          
          {error && (
            <div className="space-y-2">
              <p className="text-red-600 dark:text-red-400">
                {error}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The session may have expired or the quiz may have ended.
              </p>
            </div>
          )}
          
          {!isRecovering && hasStoredSession && !error && (
            <p className="text-gray-600 dark:text-gray-400">
              We found your previous session. Would you like to continue where you left off?
            </p>
          )}
          
          {!isRecovering && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {error ? (
                <>
                  <Button onClick={handleRetry} variant="outline">
                    Try Again
                  </Button>
                  <Button onClick={handleSkip}>
                    Start New Session
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={attemptAutoRecovery}>
                    Continue Session
                  </Button>
                  <Button onClick={handleSkip} variant="outline">
                    Start Fresh
                  </Button>
                </>
              )}
            </div>
          )}
          
          {isRecovering && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              This should only take a moment...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Simple loading overlay for when recovery is happening
export function SessionRecoveryOverlay() {
  const { isRecovering } = useSessionStatus();
  
  if (!isRecovering) return null;
  
  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="text-sm font-medium">Restoring your session...</span>
        </div>
      </div>
    </div>
  );
}

// Hook to check if session recovery UI should be shown
export function useShowSessionRecovery() {
  const { showRecoveryUI } = useSessionStatus();
  return showRecoveryUI;
}