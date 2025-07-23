'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Header } from '@/components/layout/Header';
// import { PollDisplay } from '@/components/polling/PollDisplay';
import { usePollState } from '@/hooks/usePollState';
import { Poll, PollResults } from '@/types/polling';

export default function PollingJoinPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [pollResults, setPollResults] = useState<PollResults | null>(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const {
    pollState,
    setCurrentPoll,
    updatePoll,
    setVoteStatus,
    // getPollResults
  } = usePollState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedTeamName = localStorage.getItem('teamName');
    if (savedTeamName) {
      setTeamName(savedTeamName);
    }
  }, []);

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
      console.log('New poll created:', poll);
      setCurrentPoll(poll);
      setVoteSubmitted(false);
      setSelectedOption(null);
      setPollResults(null);
      setVoteStatus(false);
    });

    socketInstance.on('poll-updated', (data: { poll: Poll; results: PollResults }) => {
      console.log('Poll updated:', data);
      updatePoll(data.poll);
      if (data.poll.showResults) {
        setPollResults(data.results);
      } else {
        setPollResults(null);
      }
    });

    socketInstance.on('poll-closed', (results: PollResults) => {
      console.log('Poll closed:', results);
      setPollResults(results);
      setVoteStatus(false);
    });

    socketInstance.on('vote-cast', (data: { pollId: string; teamName: string; optionIndex: number }) => {
      console.log('Vote confirmed:', data);
      setVoteSubmitted(true);
      setSelectedOption(data.optionIndex);
      setVoteStatus(true);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    });

    socketInstance.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      alert(`Error: ${error.message}`);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [setCurrentPoll, updatePoll, setVoteStatus]);

  const handleRegister = () => {
    if (!teamName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (socket && isConnected) {
      localStorage.setItem('teamName', teamName);
      socket.emit('register-participant', { teamName });
      setIsRegistered(true);
    }
  };

  const handleVote = (optionIndex: number) => {
    if (socket && isConnected && pollState.currentPoll && !voteSubmitted) {
      socket.emit('cast-vote', { optionIndex });
    }
  };

  const currentPoll = pollState.currentPoll;
  const canVote = currentPoll?.isActive && !voteSubmitted && isRegistered;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-900 dark">
      <Header 
        title="Join Polling Session" 
        subtitle={isMounted && teamName ? `Participant: ${teamName}` : 'Enter your name to join'}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
          <Link href="/polling">
            <Button variant="outline" size="sm">
              ← Back to Polling
            </Button>
          </Link>
        </div>
      </Header>
      
      <main className="flex-1 p-6 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-4xl mx-auto">
          {/* Registration */}
          {!isRegistered && (
            <Card className="bg-white/10 dark:bg-dark-800/50 backdrop-blur border-white/20 dark:border-dark-600 max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100 text-center text-xl">
                  🙋‍♀️ Join Polling Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 dark:bg-dark-700 border border-gray-300 dark:border-dark-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={!isConnected}
                  />
                </div>
                <Button
                  onClick={handleRegister}
                  disabled={!isConnected || !teamName.trim()}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3"
                >
                  {isConnected ? '🗳️ Join Session' : 'Connecting...'}
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Your name will be visible to the host when viewing results
                </p>
              </CardContent>
            </Card>
          )}

          {/* Waiting for Poll */}
          {isRegistered && !currentPoll && (
            <div className="text-center">
              <div className="bg-white/10 dark:bg-dark-800/50 backdrop-blur border border-gray-200 dark:border-dark-600 rounded-lg p-8 max-w-md mx-auto">
                <div className="text-4xl mb-4">⏳</div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Welcome, {teamName}!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Waiting for the host to create a poll...
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce animation-delay-100" />
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce animation-delay-200" />
                </div>
              </div>
            </div>
          )}

          {/* Active Poll */}
          {isRegistered && currentPoll && (
            <div className="space-y-6">
              {/* Poll Question */}
              <Card className="bg-white/10 dark:bg-dark-800/50 backdrop-blur border-gray-200 dark:border-dark-600">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-900 dark:text-gray-100 text-xl">
                      🗳️ Live Poll
                    </CardTitle>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      currentPoll.isActive 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700'
                        : 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                    }`}>
                      {currentPoll.isActive ? 'Active' : 'Closed'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 leading-relaxed">
                    {currentPoll.question}
                  </h3>

                  {/* Vote Status */}
                  {voteSubmitted && selectedOption !== null && (
                    <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                        <span>✅</span>
                        <span className="font-medium">
                          Vote submitted! You selected: {currentPoll.options[selectedOption]}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Voting Options */}
                  <div className="grid gap-3">
                    {currentPoll.options.map((option, index) => {
                      const isSelected = selectedOption === index;
                      const optionLetter = String.fromCharCode(65 + index); // A, B, C...
                      
                      return (
                        <Button
                          key={index}
                          onClick={() => handleVote(index)}
                          disabled={!canVote}
                          className={`
                            w-full p-4 text-left justify-start h-auto
                            ${isSelected 
                              ? 'bg-green-600 hover:bg-green-700 border-2 border-green-400' 
                              : 'bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 border border-gray-200 dark:border-dark-600'
                            }
                            ${!canVote ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          <div className="flex items-center space-x-4 w-full">
                            <div className={`
                              flex items-center justify-center w-8 h-8 rounded-full font-semibold
                              ${isSelected 
                                ? 'bg-white dark:bg-gray-900 text-green-600 dark:text-green-400' 
                                : 'bg-gray-100 dark:bg-dark-600 text-gray-900 dark:text-gray-100'
                              }
                            `}>
                              {optionLetter}
                            </div>
                            <span className="text-gray-900 dark:text-gray-100 font-medium flex-1">
                              {option}
                            </span>
                            {isSelected && (
                              <span className="text-gray-900 dark:text-gray-100">✓</span>
                            )}
                          </div>
                        </Button>
                      );
                    })}
                  </div>

                  {/* Instructions */}
                  {canVote && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
                      Tap an option to cast your vote
                    </p>
                  )}
                  
                  {!currentPoll.isActive && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
                      This poll has been closed by the host
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Live Results */}
              {pollResults && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
                    📊 Live Results
                  </h3>
                  <Card className="bg-white/10 dark:bg-dark-800/50 backdrop-blur border-gray-200 dark:border-dark-600">
                    <CardContent className="space-y-4">
                      {pollResults.options.map((option, index) => {
                        const votes = pollResults.voteCounts[index] || 0;
                        const percentage = pollResults.totalVotes > 0 
                          ? Math.round((votes / pollResults.totalVotes) * 100) 
                          : 0;
                        const optionLetter = String.fromCharCode(65 + index);
                        const isUserChoice = selectedOption === index;

                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`
                                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                                  ${isUserChoice ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}
                                `}>
                                  {optionLetter}
                                </span>
                                <span className="text-gray-900 dark:text-gray-100 font-medium">{option}</span>
                                {isUserChoice && <span className="text-green-400 dark:text-green-300">← Your vote</span>}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-900 dark:text-gray-100 font-semibold">{votes}</span>
                                <span className="text-gray-500 dark:text-gray-400 text-sm">{percentage}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-1000 ${
                                  isUserChoice ? 'bg-green-500' : 'bg-cyan-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                        Total votes: {pollResults.totalVotes}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}