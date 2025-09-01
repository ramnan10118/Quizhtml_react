'use client';

import React, { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { SessionRecovery } from '@/components/SessionRecovery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SessionTestPage() {
  const {
    sessionId,
    sessionData,
    isRecovering,
    isRecovered,
    error,
    hasStoredSession,
    createSession,
    joinSession,
    recoverSession,
    clearSession,
    attemptAutoRecovery
  } = useSession();

  const [teamName, setTeamName] = useState('');
  const [sessionIdInput, setSessionIdInput] = useState('');

  const handleCreateSession = () => {
    createSession('quiz', { teamName: 'Host', isHost: true });
  };

  const handleJoinSession = () => {
    if (sessionIdInput && teamName) {
      joinSession(sessionIdInput, teamName);
    }
  };

  const handleManualRecovery = () => {
    if (sessionIdInput) {
      recoverSession(sessionIdInput, { teamName });
    } else {
      attemptAutoRecovery();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Recovery Test Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Session Status */}
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">Current Session Status:</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Session ID:</strong> {sessionId || &ldquo;None&rdquo;}</p>
                <p><strong>Has Stored Session:</strong> {hasStoredSession ? &ldquo;Yes&rdquo; : &ldquo;No&rdquo;}</p>
                <p><strong>Is Recovering:</strong> {isRecovering ? &ldquo;Yes&rdquo; : &ldquo;No&rdquo;}</p>
                <p><strong>Is Recovered:</strong> {isRecovered ? &ldquo;Yes&rdquo; : &ldquo;No&rdquo;}</p>
                <p><strong>Error:</strong> {error || &ldquo;None&rdquo;}</p>
                <p><strong>Session Type:</strong> {sessionData?.type || &ldquo;None&rdquo;}</p>
                <p><strong>Current Question:</strong> {sessionData?.currentQuestion || &ldquo;N/A&rdquo;}</p>
                <p><strong>Team Count:</strong> {sessionData?.teams?.length || 0}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Session Controls:</h3>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleCreateSession} disabled={isRecovering}>
                    Create New Session
                  </Button>
                  <Button onClick={attemptAutoRecovery} disabled={isRecovering || !hasStoredSession}>
                    Auto Recovery
                  </Button>
                  <Button onClick={clearSession} variant="destructive">
                    Clear Session
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Join/Recover Session:</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Your team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                  <Input
                    placeholder="Session ID (optional for recovery)"
                    value={sessionIdInput}
                    onChange={(e) => setSessionIdInput(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleJoinSession} disabled={!teamName || !sessionIdInput || isRecovering}>
                    Join Session
                  </Button>
                  <Button onClick={handleManualRecovery} disabled={isRecovering}>
                    Manual Recovery
                  </Button>
                </div>
              </div>
            </div>

            {/* Session Data Display */}
            {sessionData && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">Session Data:</h3>
                <pre className="text-xs overflow-auto max-h-40 bg-white dark:bg-gray-800 p-2 rounded">
                  {JSON.stringify(sessionData, null, 2)}
                </pre>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">Test Instructions:</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Click "Create New Session" to start a new quiz session</li>
                <li>Note the Session ID that appears</li>
                <li>Refresh the page (F5 or Cmd+R)</li>
                <li>The session should automatically recover</li>
                <li>Try opening a new tab and use "Join Session" with the same Session ID</li>
                <li>Refresh the joined tab to test participant recovery</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Session Recovery Modal */}
        <SessionRecovery 
          onSkipRecovery={() => console.log('Skipped recovery')}
          onRetryRecovery={() => console.log('Retrying recovery')}
        />
      </div>
    </div>
  );
}