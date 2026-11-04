'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LogOut, Radio, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Button, Label, cn } from '@/components/ui'
import { Header } from '@/components/layout/Header';
import { ConnectionStatus } from '@/components/layout/ConnectionStatus';
import { QuestionDisplay } from '@/components/quiz/QuestionDisplay';
import { BuzzerButton } from '@/components/quiz/BuzzerButton';
import { BasicQuizInterface } from '@/components/quiz/BasicQuizInterface';
import { ScheduledQuizInterface } from '@/components/quiz/ScheduledQuizInterface';
import { useSocket } from '@/hooks/useSocket';
import { useQuizState } from '@/hooks/useQuizState';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { QuizMode, QuizQuestion, PublicQuizQuestion, QuizSettings, RevealState, LeaderboardEntry } from '@/types/quiz';
import confetti from 'canvas-confetti';

export default function JoinPage() {
  const router = useRouter();
  const { socket, connectionStatus } = useSocket();
  const {
    quizState,
    updateCurrentQuestion,
    setSinglePlayerBuzzState,
  } = useQuizState(false);

  const [teamName, setTeamName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [inputName, setInputName] = useState('');
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [revealedAnswer, setRevealedAnswer] = useState<number | null>(null);
  
  // Quiz mode detection (to be received from host)
  const [quizMode, setQuizMode] = useState<QuizMode>('buzzer');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizSettings, setQuizSettings] = useState<{ timeLimit?: number }>({});
  
  // Submission states
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  
  // Scheduled mode specific state
  const [revealedQuestions, setRevealedQuestions] = useState<RevealState[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [announcements, setAnnouncements] = useState<Array<{ message: string; timestamp: number }>>([]);
  
  const { success, error, connectionChange } = useHapticFeedback();
  
  // Debug canBuzz state changes
  useEffect(() => {
    console.log('🎯 CanBuzz state changed:', quizState.canBuzz);
  }, [quizState.canBuzz]);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('quiz-mode-set', (data: { mode: QuizMode; settings: QuizSettings; questions?: PublicQuizQuestion[] }) => {
      setQuizMode(data.mode);
      setQuizSettings(data.settings || {});
      const receivedQuestions = (data.questions || []) as QuizQuestion[];
      setQuestions(receivedQuestions);
      
      // Initialize revealed questions state for scheduled mode
      if (data.mode === 'scheduled' && receivedQuestions.length > 0) {
        setRevealedQuestions(receivedQuestions.map((_: QuizQuestion, index: number) => ({
          questionIndex: index,
          isRevealed: false,
          revealedAt: undefined
        })));
      }
      
      console.log('Quiz mode set to:', data.mode);
    });

    socket.on('question-change', (data) => {
      updateCurrentQuestion(data.questionNumber, data.questionData);
      setSinglePlayerBuzzState(true);
      setRevealedAnswer(null);
      connectionChange();
    });

    socket.on('buzz', (data) => {
      if (data.socketId === socket.id) {
        // Current user buzzed
        setSinglePlayerBuzzState(false);
        success();
        
        // Celebration effect
        setIsCelebrating(true);
        setTimeout(() => setIsCelebrating(false), 2000);
      } else {
        // Someone else buzzed - check if max responses reached
        if (data.totalResponses >= 3) {
          setSinglePlayerBuzzState(false);
          error();
        }
      }
    });

    socket.on('reset-buzzer', () => {
      setSinglePlayerBuzzState(true);
      setIsCelebrating(false);
      connectionChange();
    });

    socket.on('answer-revealed', (data: { revealedAnswer: number }) => {
      if (data.revealedAnswer !== undefined && data.revealedAnswer !== null) {
        setRevealedAnswer(data.revealedAnswer);
      }
    });

    socket.on('celebrate', () => {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4CAF50', '#1565c0', '#ff4e50', '#ff9966']
      });

      // Show point gained message
      const pointMsg = document.createElement('div');
      pointMsg.className = 'point-gained';
      pointMsg.textContent = '+1 Point!';
      document.body.appendChild(pointMsg);

      // Celebration background
      setIsCelebrating(true);

      // Remove elements after animation
      setTimeout(() => {
        if (document.body.contains(pointMsg)) {
          document.body.removeChild(pointMsg);
        }
        setIsCelebrating(false);
      }, 2000);
    });

    // Handle quiz ended by host
    socket.on('quiz-ended', (data: { message: string }) => {
      alert(data.message);
      // Clear participant data
      setTeamName('');
      setIsRegistered(false);
      setInputName('');
      setSinglePlayerBuzzState(false);
      // Redirect to mode selection
      router.push('/mode');
    });

    // Basic mode events
    socket.on('submission-received', (data: { participantName: string; submissionTime: number }) => {
      console.log('Basic quiz submission confirmed:', data);
    });

    // Scheduled mode events
    socket.on('submission-stored', (data: { participantName: string }) => {
      console.log('Scheduled submission confirmed:', data);
    });

    socket.on('question-revealed', (data: { questionIndex: number; correctAnswer: number }) => {
      console.log('Question revealed:', data);
      setRevealedQuestions(prev => 
        prev.map((q, index) => 
          index === data.questionIndex 
            ? { ...q, isRevealed: true, revealedAt: Date.now() }
            : q
        )
      );
    });

    socket.on('all-questions-revealed', (data: { leaderboard: LeaderboardEntry[] }) => {
      console.log('All questions revealed:', data);
      setRevealedQuestions(prev => 
        prev.map(q => ({ ...q, isRevealed: true, revealedAt: Date.now() }))
      );
      setLeaderboard(data.leaderboard);
    });

    socket.on('leaderboard-updated', (data: { leaderboard: Array<{ rank: number; participantName: string; score: number; submissionTime: number; questionsRevealed: number }>; visible: boolean }) => {
      console.log('Leaderboard updated for participant:', data);
      setLeaderboard(data.leaderboard);
      setLeaderboardVisible(data.visible);
    });

    socket.on('announcement', (data: { message: string; timestamp: number }) => {
      console.log('Announcement received:', data);
      setAnnouncements(prev => [...prev, data]);
    });


    // Request current question on connection (only for legacy mode)
    // NOTE: This is now handled in handleRegisterTeam when session join succeeds
    // No automatic registration should happen in useEffect to avoid double-registration

    return () => {
      socket.off('quiz-mode-set');
      socket.off('question-change');
      socket.off('buzz');
      socket.off('reset-buzzer');
      socket.off('answer-revealed');
      socket.off('celebrate');
      socket.off('quiz-ended');
      socket.off('submission-received');
      socket.off('submission-stored');
      socket.off('question-revealed');
      socket.off('all-questions-revealed');
      socket.off('leaderboard-updated');
      socket.off('announcement');
    };
  }, [socket, updateCurrentQuestion, setSinglePlayerBuzzState, success, error, connectionChange, isRegistered, teamName, router]);

  const handleRegisterTeam = () => {
    const name = inputName.trim();
    if (!name) {
      error();
      return;
    }

    if (socket) {
      setTeamName(name);
      setIsRegistered(true);
      
      // Check if we have a specific session ID to join
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session');
      
      if (sessionId) {
        console.log('🎯 Joining specific session:', sessionId);
        // Use new session-specific joining
        socket.emit('join-quiz-session', { sessionId, teamName: name });
        
        // Listen for session join confirmation
        socket.on('session-joined-successfully', (data) => {
          console.log('✅ Successfully joined session:', data);
          socket.emit('request-question-number');
        });
        
        socket.on('session-join-failed', (data) => {
          console.error('❌ Failed to join session:', data);
          alert(`Failed to join quiz: ${data.error}`);
          setIsRegistered(false);
          setTeamName('');
        });
      } else {
        console.log('🔄 Using legacy join method');
        // Fall back to legacy method
        socket.emit('register-team', { teamName: name });
        socket.emit('request-question-number');
      }
      
      success();
    }
  };

  const handleBuzz = () => {
    console.log('🔥 Buzz button clicked! Socket:', !!socket, 'Connected:', socket?.connected, 'CanBuzz:', quizState.canBuzz, 'TeamName:', teamName);
    
    if (socket && socket.connected && quizState.canBuzz && teamName) {
      console.log('📤 Sending buzz event...');
      socket.emit('buzz', {
        teamName,
        timestamp: Date.now()
      });
      
      // Provide immediate feedback even if server response is delayed
      success();
      setSinglePlayerBuzzState(false);
      setIsCelebrating(true);
      setTimeout(() => setIsCelebrating(false), 1000);
      
    } else {
      console.log('❌ Buzz blocked - Socket:', !!socket, 'Connected:', socket?.connected, 'CanBuzz:', quizState.canBuzz, 'TeamName:', teamName);
      if (!socket?.connected) {
        console.log('⚠️ Socket not connected, attempting to reconnect...');
        error(); // Provide haptic feedback for connection issues
      }
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRegisterTeam();
    }
  };

  const handleExitQuiz = () => {
    if (confirm('Are you sure you want to exit the quiz?')) {
      // Clear participant data
      setTeamName('');
      setIsRegistered(false);
      setInputName('');
      setIsQuizSubmitted(false);
      setSinglePlayerBuzzState(false);
      
      // Clear scheduled mode state
      setRevealedQuestions([]);
      setLeaderboard([]);
      setLeaderboardVisible(false);
      setAnnouncements([]);
      
      // Disconnect from socket gracefully
      if (socket) {
        socket.disconnect();
      }
      
      // Redirect to mode selection
      router.push('/mode');
    }
  };

  // ---- Presentation-only derived values ----
  const modeLabel = quizMode === 'buzzer' ? 'Buzzer' : quizMode === 'basic' ? 'Self-paced' : 'Scheduled';
  const buzzerLayout = isRegistered && quizMode === 'buzzer';

  return (
    <div className={cn('app-bg flex min-h-screen flex-col', isCelebrating && 'celebrating')}>
      <Header
        title={`${modeLabel} quiz`}
        subtitle={isMounted && teamName ? `Team ${teamName}` : 'Join the session'}
      >
        <ConnectionStatus status={connectionStatus} compact />
        {isRegistered && teamName && (
          <Button onClick={handleExitQuiz} variant="ghost" size="sm" aria-label="Exit quiz">
            <LogOut /> <span className="hidden sm:inline">Exit</span>
          </Button>
        )}
      </Header>

      <main
        className={cn(
          'flex flex-1 flex-col items-center px-4 py-5 sm:px-6 sm:py-8',
          !isRegistered && 'justify-center',
          buzzerLayout ? 'pb-[19rem]' : 'pb-10'
        )}
      >
        <div className="w-full max-w-lg space-y-4">
          {!isRegistered ? (
            /* Registration Form */
            <Card className="stage-bg animate-fade-up">
              <CardHeader className="items-center text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl sm:text-2xl">Join the {modeLabel.toLowerCase()} quiz</CardTitle>
                <CardDescription>
                  {quizMode === 'buzzer'
                    ? 'Pick a team name. You will get a big buzzer once you are in.'
                    : 'Enter your name to receive the questions on this device.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">{quizMode === 'buzzer' ? 'Team name' : 'Your name'}</Label>
                  <Input
                    id="team-name"
                    type="text"
                    placeholder={quizMode === 'buzzer' ? 'e.g. The Night Owls' : 'e.g. Priya'}
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-12 text-lg"
                    autoComplete="off"
                    enterKeyHint="go"
                    autoFocus
                  />
                </div>
                <Button
                  onClick={handleRegisterTeam}
                  className="w-full"
                  size="xl"
                  disabled={!inputName.trim()}
                >
                  Join quiz <ArrowRight />
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {connectionStatus.isConnected ? 'Connected to the session server.' : 'Connecting to the session server…'}
                </p>
              </CardContent>
            </Card>
          ) : (
            /* Mode-specific interfaces */
            <>
              {quizMode === 'buzzer' && (
                <>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-card">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-success animate-live-dot" />
                      <span className="truncate">
                        Playing as <span className="font-semibold text-foreground">{teamName}</span>
                      </span>
                    </span>
                    <span className={cn('shrink-0 text-xs font-semibold', quizState.canBuzz ? 'text-success' : 'text-muted-foreground')}>
                      {quizState.canBuzz ? 'Buzzer armed' : 'Buzzer locked'}
                    </span>
                  </div>

                  {quizState.currentQuestionData ? (
                    <QuestionDisplay
                      questionNumber={quizState.currentQuestion}
                      question={quizState.currentQuestionData}
                      isHost={false}
                      revealedAnswer={revealedAnswer}
                      className="animate-fade-up"
                    />
                  ) : (
                    <Card className="stage-bg animate-fade-up">
                      <CardContent className="flex flex-col items-center p-8 text-center">
                        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                          <Radio className="h-6 w-6 animate-pulse-slow" />
                        </span>
                        <p className="font-display text-lg font-semibold text-foreground">You&apos;re in</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Waiting for the host to start the first question.
                        </p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Keep this screen open and get ready to buzz.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {quizMode === 'basic' && (
                <BasicQuizInterface
                  questions={questions}
                  participantName={teamName}
                  onComplete={(answers) => {
                    console.log('Basic quiz completed:', answers);
                    setIsQuizSubmitted(true);
                    if (socket) {
                      socket.emit('submit-basic-quiz', {
                        participantName: teamName,
                        answers: answers
                      });
                    }
                  }}
                  timeLimit={quizSettings.timeLimit}
                  className="w-full"
                />
              )}
              
              {quizMode === 'scheduled' && (
                <ScheduledQuizInterface
                  questions={questions}
                  participantName={teamName}
                  revealedQuestions={revealedQuestions}
                  leaderboard={leaderboard}
                  leaderboardVisible={leaderboardVisible}
                  announcements={announcements}
                  onSubmitAnswers={(answers) => {
                    console.log('Scheduled quiz submitted:', answers);
                    setIsQuizSubmitted(true);
                    if (socket) {
                      socket.emit('submit-answers', {
                        participantName: teamName,
                        answers: answers
                      });
                    }
                  }}
                  isSubmitted={isQuizSubmitted}
                  className="w-full"
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Buzzer Button - only for buzzer mode */}
      {isRegistered && quizMode === 'buzzer' && (
        <BuzzerButton
          onBuzz={handleBuzz}
          disabled={!quizState.canBuzz}
          canBuzz={quizState.canBuzz}
        />
      )}
    </div>
  );
}