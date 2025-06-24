'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { PollCreator } from '@/components/polling/PollCreator';
import { PollResults } from '@/components/polling/PollResults';
import { PollControls } from '@/components/polling/PollControls';
import { usePollState } from '@/hooks/usePollState';
import { Poll, PollResults as PollResultsType, PollCreateData } from '@/types/polling';

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
    resetPollState,
    getPollResults
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
  const hasActivePoll = currentPoll?.isActive;

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        title="Polling Host Console" 
        subtitle={isConnected ? "Connected - Ready to create polls" : "Connecting..."}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-white/80">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
          <Link href="/polling">
            <Button variant="outline" size="sm">
              ← Back to Polling
            </Button>
          </Link>
        </div>
      </Header>
      
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          {!currentPoll && !showCreator && (
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                🗳️ Host Live Polling Session
              </h1>
              <p className="text-xl text-slate-300 mb-8">
                Create engaging polls and see real-time audience responses
              </p>
              <Button
                onClick={handleNewPoll}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
                disabled={!isConnected}
              >
                📊 Create Your First Poll
              </Button>
            </div>
          )}

          {/* Poll Creator */}
          {showCreator && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Create New Poll</h2>
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
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Poll Controls */}
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

              {/* Poll Results */}
              <div className="lg:col-span-2">
                {pollResults ? (
                  <PollResults
                    results={pollResults}
                    showParticipants={showResults}
                  />
                ) : (
                  <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-8 text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Waiting for votes...
                    </h3>
                    <p className="text-slate-300">
                      Share the polling link with participants to start collecting responses
                    </p>
                    <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-400 mb-2">Participant Link:</p>
                      <code className="text-cyan-300 text-sm">
                        {typeof window !== 'undefined' ? `${window.location.origin}/polling/join` : '/polling/join'}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!currentPoll && !showCreator && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">1️⃣</div>
                <h3 className="text-lg font-semibold text-white mb-2">Create Poll</h3>
                <p className="text-slate-400 text-sm">
                  Write your question and add 2-6 answer options for participants to choose from
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">2️⃣</div>
                <h3 className="text-lg font-semibold text-white mb-2">Share Link</h3>
                <p className="text-slate-400 text-sm">
                  Participants join at /polling/join to vote on your live polls
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">3️⃣</div>
                <h3 className="text-lg font-semibold text-white mb-2">View Results</h3>
                <p className="text-slate-400 text-sm">
                  Watch real-time results and control when to show them to participants
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}