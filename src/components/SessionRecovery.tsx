'use client';

import React from 'react';
import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-raised animate-fade-up">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            {isRecovering ? <Spinner size="md" /> : <History className="h-5 w-5" />}
          </div>
          <CardTitle>
            {isRecovering ? 'Restoring session' : error ? 'Could not restore session' : 'Session found'}
          </CardTitle>
          <CardDescription>
            {isRecovering && 'We found your previous session and are restoring your progress.'}
            {!isRecovering && error && 'The session may have expired or the quiz may have ended.'}
            {!isRecovering && hasStoredSession && !error && 'Pick up where you left off, or start fresh.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!isRecovering && (
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              {error ? (
                <>
                  <Button onClick={handleRetry} variant="outline">Try again</Button>
                  <Button onClick={handleSkip}>Start new session</Button>
                </>
              ) : (
                <>
                  <Button onClick={attemptAutoRecovery}>Continue session</Button>
                  <Button onClick={handleSkip} variant="outline">Start fresh</Button>
                </>
              )}
            </div>
          )}

          {isRecovering && (
            <p className="text-xs text-muted-foreground">This should only take a moment.</p>
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="rounded-xl border border-border bg-card p-5 shadow-raised">
        <Spinner size="sm" label="Restoring your session..." />
      </div>
    </div>
  );
}

// Hook to check if session recovery UI should be shown
export function useShowSessionRecovery() {
  const { showRecoveryUI } = useSessionStatus();
  return showRecoveryUI;
}
