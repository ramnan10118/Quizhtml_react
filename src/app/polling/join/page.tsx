'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, ArrowRight, BarChart3, CheckCircle2, Radio, Vote } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Badge, cn } from '@/components/ui'
import { Header } from '@/components/layout/Header';
import { ConnectionStatus } from '@/components/layout/ConnectionStatus';
import { AnswerOption } from '@/components/quiz/AnswerOption';
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

  const connection = { isConnected, connectionMessage: isConnected ? 'Connected' : 'Connecting...' };

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <Header
        title="Live poll"
        subtitle={isMounted && teamName && isRegistered ? `Voting as ${teamName}` : 'Enter your name to join'}
      >
        <ConnectionStatus status={connection} compact />
        <Button variant="ghost" size="sm" asChild>
          <Link href="/polling" aria-label="Back to polling">
            <ArrowLeft /> <span className="hidden sm:inline">Back</span>
          </Link>
        </Button>
      </Header>

      <main className={cn('flex flex-1 flex-col items-center px-4 py-5 sm:px-6 sm:py-8', !isRegistered && 'justify-center')}>
        <div className="w-full max-w-lg space-y-4">
          {/* Registration */}
          {!isRegistered && (
            <Card className="stage-bg animate-fade-up">
              <CardHeader className="items-center text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Vote className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl sm:text-2xl">Join the poll</CardTitle>
                <CardDescription>Your name is shown to the host alongside your vote.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="participant-name">Your name</Label>
                  <Input
                    id="participant-name"
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                    placeholder="e.g. Sam"
                    className="h-12 text-lg"
                    autoComplete="off"
                    enterKeyHint="go"
                    disabled={!isConnected}
                  />
                </div>
                <Button
                  onClick={handleRegister}
                  disabled={!isConnected || !teamName.trim()}
                  className="w-full"
                  size="xl"
                >
                  {isConnected ? <>Join session <ArrowRight /></> : 'Connecting…'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Waiting for Poll */}
          {isRegistered && !currentPoll && (
            <Card className="stage-bg animate-fade-up">
              <CardContent className="flex flex-col items-center p-8 text-center">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Radio className="h-6 w-6 animate-pulse-slow" />
                </span>
                <p className="font-display text-lg font-semibold text-foreground">Welcome, {teamName}</p>
                <p className="mt-1 text-sm text-muted-foreground">Waiting for the host to open a poll.</p>
                <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:240ms]" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Poll */}
          {isRegistered && currentPoll && (
            <div className="space-y-4 animate-fade-up">
              {/* Poll Question */}
              <Card className="stage-bg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="eyebrow">Question</p>
                    <Badge variant={currentPoll.isActive ? 'live' : 'secondary'}>
                      {currentPoll.isActive ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl leading-snug sm:text-2xl">
                    {currentPoll.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vote Status */}
                  {voteSubmitted && selectedOption !== null && (
                    <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2.5 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      <span>
                        Vote recorded: <span className="font-semibold">{currentPoll.options[selectedOption]}</span>
                      </span>
                    </div>
                  )}

                  {/* Voting Options */}
                  <div className="space-y-2.5">
                    {currentPoll.options.map((option, index) => {
                      const isSelected = selectedOption === index;
                      const optionLetter = String.fromCharCode(65 + index); // A, B, C...

                      return (
                        <AnswerOption
                          key={index}
                          size="lg"
                          label={optionLetter}
                          text={option}
                          state={isSelected ? 'selected' : !canVote ? 'dimmed' : 'default'}
                          onSelect={() => handleVote(index)}
                          disabled={!canVote}
                          trailing={isSelected ? <CheckCircle2 className="h-5 w-5 text-primary" /> : undefined}
                        />
                      );
                    })}
                  </div>

                  {/* Instructions */}
                  {canVote && (
                    <p className="text-center text-xs text-muted-foreground">Tap an option to cast your vote.</p>
                  )}

                  {!currentPoll.isActive && (
                    <p className="text-center text-xs text-muted-foreground">This poll has been closed by the host.</p>
                  )}
                </CardContent>
              </Card>

              {/* Live Results */}
              {pollResults && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" /> Live results
                    </CardTitle>
                    <CardDescription className="tabular">{pollResults.totalVotes} vote{pollResults.totalVotes === 1 ? '' : 's'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pollResults.options.map((option, index) => {
                      const votes = pollResults.voteCounts[index] || 0;
                      const percentage = pollResults.totalVotes > 0
                        ? Math.round((votes / pollResults.totalVotes) * 100)
                        : 0;
                      const optionLetter = String.fromCharCode(65 + index);
                      const isUserChoice = selectedOption === index;

                      return (
                        <div key={index}>
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className={cn(
                                'flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold',
                                isUserChoice ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                              )}>
                                {optionLetter}
                              </span>
                              <span className={cn('truncate', isUserChoice ? 'font-semibold text-foreground' : 'text-foreground/90')}>{option}</span>
                              {isUserChoice && <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-primary">You</span>}
                            </div>
                            <div className="flex shrink-0 items-baseline gap-1.5 tabular">
                              <span className="font-semibold text-foreground">{votes}</span>
                              <span className="text-xs text-muted-foreground">{percentage}%</span>
                            </div>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn('h-full origin-left rounded-full transition-transform duration-700 ease-out', isUserChoice ? 'bg-primary' : 'bg-info')}
                              style={{ transform: `scaleX(${percentage / 100})` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
