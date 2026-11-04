'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { AlertTriangle, CheckCircle2, LayoutDashboard, Plus, Save, Vote, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Spinner, LoadingScreen } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AppShell } from '@/components/layout/AppShell';
import { ConnectionStatus } from '@/components/layout/ConnectionStatus';
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
            votes: new Map(), // Initialize empty votes Map
            isActive: true,
            showResults: specificLivePoll.content.showResults || false,
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
              pollId: specificLivePoll.id,
              question: specificLivePoll.content.question,
              options: specificLivePoll.content.options,
              voteCounts,
              voterNames: voterNames.reduce((acc, voters, index) => {
                acc[index] = voters;
                return acc;
              }, {} as Record<number, string[]>),
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

  // ---- Presentation-only helpers ----
  const closeSaveModal = () => {
    setShowSaveModal(false);
    setDraftName('');
    setErrorMessage('');
  };
  const isSuccessMessage = errorMessage.includes('successfully');
  const steps = [
    { n: 1, title: 'Create a poll', body: 'Write your question and add 2–6 answer options.' },
    { n: 2, title: 'Share the link', body: 'Participants join at /polling/join on any device.' },
    { n: 3, title: 'Watch results', body: 'See votes land in real time and reveal them when you choose.' },
  ];

  return (
    <ProtectedRoute>
      <AppShell
        nav={[
          { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
          { href: '/polling/host', label: 'Polls', icon: <Vote />, prefix: true },
        ]}
        actions={<ConnectionStatus status={{ isConnected, connectionMessage: isConnected ? 'Connected' : 'Connecting...' }} compact />}
        eyebrow="Live polling"
        title={currentPoll ? 'Poll in progress' : showCreator ? 'Create a poll' : 'Host a polling session'}
        subtitle={currentPoll ? 'Control results visibility and close the poll when you are done.' : 'Ask the room a question and watch the answers come in.'}
        headingActions={
          showCreator && !currentPoll ? (
            <Button onClick={() => setShowCreator(false)} variant="ghost" size="sm">
              <X /> Cancel
            </Button>
          ) : !currentPoll ? (
            <Button onClick={handleNewPoll} disabled={!isConnected}>
              <Plus /> New poll
            </Button>
          ) : undefined
        }
      >
        {/* Welcome Section */}
        {!currentPoll && !showCreator && (
          <div className="space-y-8">
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={<Vote />}
                  title="No poll running"
                  description="Create your first poll to open the session. Participants can join as soon as it is live."
                  action={
                    <Button onClick={handleNewPoll} size="lg" disabled={!isConnected}>
                      {isConnected ? <Plus /> : <Spinner size="sm" />}
                      {isConnected ? 'Create your first poll' : 'Connecting…'}
                    </Button>
                  }
                />
              </CardContent>
            </Card>

            {/* Instructions */}
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.n} className="rounded-xl border border-border bg-card p-5 shadow-card animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 font-display text-sm font-bold text-primary tabular">
                    {s.n}
                  </span>
                  <h3 className="font-display text-base font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Poll Creator */}
        {showCreator && (
          <div className="mx-auto max-w-3xl animate-fade-up">
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Middle: Poll Results */}
            <div className="lg:col-span-8 lg:order-2">
              {pollResults ? (
                <PollResults
                  results={pollResults}
                  showParticipants={showResults}
                />
              ) : (
                <Card className="stage-bg">
                  <CardContent className="p-6 sm:p-8">
                    <p className="eyebrow mb-2">Question</p>
                    <h3 className="font-display text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                      {currentPoll.question}
                    </h3>
                    <ul className="mt-5 space-y-2">
                      {currentPoll.options.map((opt, i) => (
                        <li key={i} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm">
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted font-display text-xs font-bold text-muted-foreground">
                            {String.fromCharCode(65 + i)}
                          </span>
                          {opt}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                      <Spinner size="sm" /> Waiting for the first vote. Share the link from the invite panel.
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Left: Poll Controls */}
            <div className="space-y-6 lg:col-span-4 lg:order-1">
              <PollControls
                currentPoll={currentPoll}
                onClosePoll={handleClosePoll}
                onToggleResults={handleToggleResults}
                onNewPoll={handleNewPoll}
                showResults={showResults}
                totalVotes={pollResults?.totalVotes || 0}
              />
              {/* Right: Share Panel */}
              <SharePanel
                joinPath="/polling/join"
                title="Invite voters"
                description="Share with participants to join the poll."
              />
            </div>
          </div>
        )}
      </AppShell>

      {/* Save Draft Modal */}
      <Dialog open={showSaveModal} onOpenChange={(open) => { if (!open) closeSaveModal(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save poll as draft</DialogTitle>
            <DialogDescription>Give the draft a name so you can find it on your dashboard.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="draftName">Draft name</Label>
            <Input
              id="draftName"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="e.g. Icebreaker: favourite season"
              disabled={saving}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveDraft();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button onClick={closeSaveModal} variant="outline" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveDraft} disabled={saving || !draftName.trim()}>
              {saving ? <Spinner size="sm" /> : <Save />}
              {saving ? 'Saving…' : 'Save draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Message */}
      {errorMessage && (
        <div
          role="status"
          className={`fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border bg-card p-4 shadow-raised animate-fade-up ${
            isSuccessMessage ? 'border-success/40' : 'border-destructive/40'
          }`}
        >
          {isSuccessMessage ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
          <p className="text-sm text-foreground">{errorMessage}</p>
        </div>
      )}
    </ProtectedRoute>
  );
}

export default function PollingHostPage() {
  return (
    <React.Suspense fallback={<LoadingScreen label="Loading polling setup..." />}>
      <PollingHostContent />
    </React.Suspense>
  );
}
