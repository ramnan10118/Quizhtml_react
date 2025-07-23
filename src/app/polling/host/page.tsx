'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
// import { Header } from '@/components/layout/Header';
import { SharePanel } from '@/components/ui/SharePanel';
import { PollCreator } from '@/components/polling/PollCreator';
import { PollResults } from '@/components/polling/PollResults';
import { PollControls } from '@/components/polling/PollControls';
import { usePollState } from '@/hooks/usePollState';
import { Poll, PollResults as PollResultsType, PollCreateData } from '@/types/polling';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { pollDrafts, livePolls } from '@/lib/drafts';
import { useAuth } from '@/contexts/AuthContext';

function PollingHostContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [pollResults, setPollResults] = useState<PollResultsType | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  // Draft functionality state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Poll data state for saving to drafts
  const [pollData, setPollData] = useState<PollCreateData | null>(null);
  
  // Live poll persistence
  const [currentLivePollId, setCurrentLivePollId] = useState<string | null>(null);
  const currentLivePollIdRef = useRef<string | null>(null);
  
  // Socket poll ID (different from database ID)
  const [socketPollId, setSocketPollId] = useState<string | null>(null);
  
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
      setSocketPollId(poll.id); // Store the socket server's poll ID
      setShowCreator(false);
      setShowResults(false);
    });

    socketInstance.on('poll-updated', (data: { poll: Poll; results: PollResultsType }) => {
      console.log('Poll updated:', data);
      console.log('Current live poll ID (state):', currentLivePollId);
      console.log('Current live poll ID (ref):', currentLivePollIdRef.current);
      updatePoll(data.poll);
      setPollResults(data.results);
      
      // Update database with latest vote data - use ref to get current value
      const pollIdToUpdate = currentLivePollIdRef.current;
      if (pollIdToUpdate && data.results) {
        try {
          // Convert poll results back to votes object format
          const votes: Record<string, number> = {};
          
          console.log('Raw poll results data:', data.results);
          
          // Check if voterNames exists (it's an object, not array)
          if (data.results.voterNames && typeof data.results.voterNames === 'object') {
            console.log('Processing voterNames:', data.results.voterNames);
            Object.entries(data.results.voterNames).forEach(([optionIndex, voters]) => {
              console.log(`Option ${optionIndex} voters:`, voters);
              if (Array.isArray(voters)) {
                voters.forEach(voterName => {
                  votes[voterName] = parseInt(optionIndex);
                  console.log(`Added vote: ${voterName} -> ${optionIndex}`);
                });
              }
            });
          } else {
            console.log('No voterNames found or not an object:', data.results.voterNames);
          }
          
          console.log('Saving votes to database:', votes);
          
          // Update database asynchronously
          livePolls.updateContent(pollIdToUpdate, {
            question: data.results.question,
            options: data.results.options,
            showResults: false,
            votes
          }).then(() => {
            console.log('Successfully saved votes to database');
          }).catch(error => {
            console.error('Error updating live poll content:', error);
          });
        } catch (error) {
          console.error('Error processing vote data:', error);
        }
      } else {
        console.log('No poll ID available to update database');
      }
    });

    socketInstance.on('poll-closed', (results: PollResultsType) => {
      console.log('Poll closed:', results);
      setPollResults(results); // Keep the final results visible
      closePoll(); // This just marks poll as inactive, doesn't clear results
    });

    socketInstance.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      alert(`Error: ${error.message}`);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [setCurrentPoll, updatePoll, closePoll]);

  // Load draft from URL parameter
  useEffect(() => {
    const loadDraftFromUrl = async () => {
      const draftId = searchParams.get('draft');
      if (draftId && user) {
        setErrorMessage('');
        
        try {
          const draft = await pollDrafts.getById(draftId);
          if (draft) {
            setPollData(draft.content);
            setShowCreator(true);
          } else {
            setErrorMessage('Draft not found or you do not have permission to access it.');
          }
        } catch (error) {
          console.error('Error loading draft:', error);
          setErrorMessage('Failed to load draft. Please try again.');
        }
      }
    };

    loadDraftFromUrl();
  }, [searchParams, user]);

  // Load specific live poll from URL parameter
  useEffect(() => {
    const loadSpecificLivePoll = async () => {
      const livePollId = searchParams.get('live');
      if (!livePollId || !user) return;
      
      try {
        const specificLivePoll = await livePolls.getById(livePollId);
        if (specificLivePoll) {
          setCurrentLivePollId(specificLivePoll.id);
          currentLivePollIdRef.current = specificLivePoll.id;
          
          // Create a Poll object from the LivePoll data
          const pollFromDb: Poll = {
            id: specificLivePoll.id,
            question: specificLivePoll.content.question,
            options: specificLivePoll.content.options,
            isActive: true,
            createdAt: new Date(specificLivePoll.created_at).getTime()
          };
          
          setCurrentPoll(pollFromDb);
          setShowCreator(false);
          
          // Restore existing votes data if available
          console.log('Live poll content:', specificLivePoll.content);
          if (specificLivePoll.content.votes && Object.keys(specificLivePoll.content.votes).length > 0) {
            console.log('Found existing votes:', specificLivePoll.content.votes);
            
            // Convert votes object to poll results format
            const voteCounts: number[] = new Array(specificLivePoll.content.options.length).fill(0);
            const voterNames: string[][] = specificLivePoll.content.options.map(() => []);
            let totalVotes = 0;
            
            // Process votes data
            Object.entries(specificLivePoll.content.votes).forEach(([voterName, optionIndex]) => {
              if (typeof optionIndex === 'number' && optionIndex >= 0 && optionIndex < voteCounts.length) {
                voteCounts[optionIndex]++;
                voterNames[optionIndex].push(voterName);
                totalVotes++;
              }
            });
            
            // Set poll results to restore the votes display
            const restoredResults: PollResultsType = {
              question: specificLivePoll.content.question,
              options: specificLivePoll.content.options,
              voteCounts,
              voterNames,
              totalVotes
            };
            
            console.log('Restored results:', restoredResults);
            setPollResults(restoredResults);
          } else {
            console.log('No existing votes found');
          }
        }
      } catch (error) {
        console.error('Error loading specific live poll:', error);
      }
    };

    loadSpecificLivePoll();
  }, [searchParams, user, setCurrentPoll]);

  const handleCreatePoll = async (pollData: PollCreateData) => {
    if (socket && isConnected) {
      try {
        // Create live poll in database first
        const livePoll = await livePolls.launch({
          title: `Poll: ${pollData.question.substring(0, 50)}...`,
          question: pollData.question,
          options: pollData.options
        });
        
        setCurrentLivePollId(livePoll.id);
        currentLivePollIdRef.current = livePoll.id;
        
        // Then emit to socket with the database ID
        socket.emit('create-poll', { ...pollData, id: livePoll.id });
      } catch (error) {
        console.error('Error creating live poll:', error);
        setErrorMessage('Failed to create poll. Please try again.');
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!draftName.trim()) {
      setErrorMessage('Please enter a name for your draft');
      return;
    }

    if (!pollData || !pollData.question.trim() || pollData.options.filter(opt => opt.trim()).length < 2) {
      setErrorMessage('Please create a valid poll before saving');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      await pollDrafts.save({
        title: draftName.trim(),
        question: pollData.question,
        options: pollData.options
      });
      
      setShowSaveModal(false);
      setDraftName('');
      setErrorMessage('Draft saved successfully!');
    } catch {
      setErrorMessage('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSaveModal = useCallback(() => {
    if (!pollData || !pollData.question.trim() || pollData.options.filter(opt => opt.trim()).length < 2) {
      setErrorMessage('Please create a valid poll before saving');
      return;
    }
    setErrorMessage('');
    setShowSaveModal(true);
  }, [pollData]);

  const handlePollDataChange = useCallback((newPollData: PollCreateData) => {
    setPollData(newPollData);
  }, []);

  const handleClosePoll = async () => {
    if (socket && isConnected && pollState.currentPoll) {
      // First emit to socket to close the actual poll session (original behavior)
      console.log('Closing poll with socket ID:', socketPollId);
      if (socketPollId) {
        socket.emit('close-poll', socketPollId);
      }
      
      // Update database if we have a live poll ID
      if (currentLivePollId) {
        try {
          await livePolls.close(currentLivePollId);
          setCurrentLivePollId(null);
          currentLivePollIdRef.current = null;
        } catch (error) {
          console.error('Error closing live poll in database:', error);
        }
      }
      
      // Clear socket poll ID since we're closing
      setSocketPollId(null);
      
      // Fallback: Update UI after a short delay if socket doesn't respond
      setTimeout(() => {
        if (pollState.currentPoll && pollState.currentPoll.isActive) {
          console.log('Socket did not respond, forcing UI update');
          closePoll(); // This marks poll as inactive but keeps results visible
        }
      }, 1000); // Wait 1 second for socket response
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
    setPollData(null); // Clear any existing poll data
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
                initialData={pollData}
                onDataChange={handlePollDataChange}
                onSaveDraft={handleOpenSaveModal}
                showSaveDraft={user !== null}
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

      {/* Save Draft Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Save Poll as Draft
                </h2>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setDraftName('');
                    setErrorMessage('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="draftName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Draft Name
                  </label>
                  <Input
                    id="draftName"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Enter a name for your poll draft"
                    disabled={saving}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveDraft();
                      }
                    }}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={() => {
                      setShowSaveModal(false);
                      setDraftName('');
                      setErrorMessage('');
                    }}
                    variant="outline"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveDraft}
                    disabled={saving || !draftName.trim()}
                  >
                    {saving ? (
                      <span className="flex items-center space-x-2">
                        <span className="animate-spin text-sm">🔄</span>
                        <span>Saving...</span>
                      </span>
                    ) : (
                      'Save Draft'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="fixed top-4 right-4 max-w-sm bg-white dark:bg-dark-800 border-l-4 border-blue-500 p-4 shadow-lg rounded z-50">
          <p className="text-sm text-gray-700 dark:text-gray-300">{errorMessage}</p>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}

export default function PollingHostPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">🔄</div>
        <p className="text-gray-600 dark:text-gray-400">Loading polling setup...</p>
      </div>
    </div>}>
      <PollingHostContent />
    </React.Suspense>
  );
}