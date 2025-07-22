'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
// import { Header } from '@/components/layout/Header';
import { SharePanel } from '@/components/ui/SharePanel';
import { PollCreator } from '@/components/polling/PollCreator';
import { PollResults } from '@/components/polling/PollResults';
import { PollControls } from '@/components/polling/PollControls';
import { usePollState } from '@/hooks/usePollState';
import { Poll, PollResults as PollResultsType, PollCreateData } from '@/types/polling';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function PollingHostPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [pollResults, setPollResults] = useState<PollResultsType | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  const {
    pollState,
    setCurrentPoll,
    updatePoll,
    closePoll,
    // resetPollState,
    // getPollResults
  } = usePollState(true);

  useEffect(() => {
    const socketInstance = io({
      path: '/socket.io/',
    });

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    // Poll event listeners
    socketInstance.on('poll-created', (poll: Poll) => {
      console.log('Poll created:', poll);
      setCurrentPoll(poll);
      setShowCreator(false);
      setShowResults(false);
    });

    socketInstance.on('poll-updated', (data: { poll: Poll; results: PollResultsType }) => {
      console.log('Poll updated:', data);
      updatePoll(data.poll);
      setPollResults(data.results);
    });

    socketInstance.on('poll-closed', (results: PollResultsType) => {
      console.log('Poll closed:', results);
      setPollResults(results);
      closePoll();
    });

    socketInstance.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      alert(`Error: ${error.message}`);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [setCurrentPoll, updatePoll, closePoll]);

  const handleCreatePoll = (pollData: PollCreateData) => {
    if (socket && isConnected) {
      socket.emit('create-poll', pollData);
    }
  };

  const handleClosePoll = () => {
    if (socket && isConnected && pollState.currentPoll) {
      socket.emit('close-poll', pollState.currentPoll.id);
    }
  };

  const handleToggleResults = () => {
    if (socket && isConnected && pollState.currentPoll) {
      socket.emit('toggle-results', pollState.currentPoll.id);
      setShowResults(!showResults);
    }
  };

  const handleNewPoll = () => {
    setShowCreator(true);
    setShowResults(false);
    setPollResults(null);
  };

  const currentPoll = pollState.currentPoll;
  // const hasActivePoll = currentPoll?.isActive;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 dark">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/mode" className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300">
              Quiz Buzzer
            </Link>
            <div className="text-gray-400 dark:text-gray-600">→</div>
            <span className="text-gray-600 dark:text-gray-400">Polling Host</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          {!currentPoll && !showCreator && (
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Host Live Polling Session
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Create engaging polls and see real-time audience responses
              </p>
              <Button
                onClick={handleNewPoll}
                size="lg"
                disabled={!isConnected}
              >
                Create Your First Poll
              </Button>
            </div>
          )}

          {/* Poll Creator */}
          {showCreator && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Poll</h2>
                <Button
                  onClick={() => setShowCreator(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
              <PollCreator
                onCreatePoll={handleCreatePoll}
                isCreating={!isConnected}
              />
            </div>
          )}

          {/* Active Poll Section */}
          {currentPoll && (
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Left: Poll Controls */}
              <div className="lg:col-span-1">
                <PollControls
                  currentPoll={currentPoll}
                  onClosePoll={handleClosePoll}
                  onToggleResults={handleToggleResults}
                  onNewPoll={handleNewPoll}
                  showResults={showResults}
                  totalVotes={pollResults?.totalVotes || 0}
                />
              </div>

              {/* Middle: Poll Results */}
              <div className="lg:col-span-2">
                {pollResults ? (
                  <PollResults
                    results={pollResults}
                    showParticipants={showResults}
                  />
                ) : (
                  <Card className="p-8 text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Waiting for votes...
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Use the share panel on the right to invite participants to join your poll
                    </p>
                  </Card>
                )}
              </div>

              {/* Right: Share Panel */}
              <div className="lg:col-span-1">
                <SharePanel
                  joinPath="/polling/join"
                  title="Invite Voters"
                  description="Share with participants to join the poll"
                />
              </div>
            </div>
          )}

          {/* Instructions */}
          {!currentPoll && !showCreator && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/5 dark:bg-dark-800/50 rounded-lg p-6 backdrop-blur border border-gray-200 dark:border-dark-700">
                <div className="text-3xl mb-4">1️⃣</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Create Poll</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Write your question and add 2-6 answer options for participants to choose from
                </p>
              </div>
              <div className="bg-white/5 dark:bg-dark-800/50 rounded-lg p-6 backdrop-blur border border-gray-200 dark:border-dark-700">
                <div className="text-3xl mb-4">2️⃣</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Share Link</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Participants join at /polling/join to vote on your live polls
                </p>
              </div>
              <div className="bg-white/5 dark:bg-dark-800/50 rounded-lg p-6 backdrop-blur border border-gray-200 dark:border-dark-700">
                <div className="text-3xl mb-4">3️⃣</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">View Results</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Watch real-time results and control when to show them to participants
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      </div>
    </ProtectedRoute>
  );
}