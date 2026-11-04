'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Hash, ListChecks, LogOut, Radio, Users, Zap } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { ConnectionStatus } from '@/components/layout/ConnectionStatus';
import { QuestionDisplay } from '@/components/quiz/QuestionDisplay';
import { ScoreBoard } from '@/components/quiz/ScoreBoard';
import { ParticipantList } from '@/components/quiz/ParticipantList';
import { SharePanel } from '@/components/ui/SharePanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModeAwareHostDashboard } from '@/components/host/ModeAwareHostDashboard';
import { useSocket } from '@/hooks/useSocket';
import { useQuizState } from '@/hooks/useQuizState';
import { QuizMode, QuizSettings, ParticipantSubmission, RevealState, LeaderboardEntry, QuizQuestion } from '@/types/quiz';
import { liveQuizzes, LiveQuiz } from '@/lib/drafts';

// Host session saved by useQuizState (sessionId + hostToken), if still fresh.
function readStoredHostSession(): { sessionId: string; hostToken?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('buzzer_quiz_state');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.sessionId || Date.now() - (parsed.timestamp || 0) > 2 * 60 * 60 * 1000) {
      localStorage.removeItem('buzzer_quiz_state');
      return null;
    }
    return { sessionId: parsed.sessionId, hostToken: parsed.hostToken };
  } catch {
    localStorage.removeItem('buzzer_quiz_state');
    return null;
  }
}

function HostPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket, connectionStatus } = useSocket();

  // Debug session ID changes - moved after currentSessionId declaration
  const {
    quizState,
    addTeam,
    removeTeam,
    addBuzz,
    resetBuzzer,
    updateScore,
    changeQuestion,
    clearSavedState,
    saveCurrentSession,
  } = useQuizState(true);

  // Load selected quiz mode and settings from sessionStorage
  const [currentMode, setCurrentMode] = useState<QuizMode>('buzzer');
  const [currentSettings, setCurrentSettings] = useState<QuizSettings>({
    mode: 'buzzer',
    timeLimit: undefined,
    allowRetakes: false,
    showCorrectAnswers: true,
    passingScore: undefined
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  
  // Buzzer mode specific state
  const [revealedAnswer, setRevealedAnswer] = useState<number | null>(null);
  const [highlightedOption, setHighlightedOption] = useState<number | null>(null);
  
  // Basic/Scheduled mode specific state
  const [participants] = useState<Array<{ name: string; socketId: string }>>([]);
  const [basicSubmissions, setBasicSubmissions] = useState<ParticipantSubmission[]>([]);
  const [scheduledSubmissions, setScheduledSubmissions] = useState<ParticipantSubmission[]>([]);
  const [revealedQuestions, setRevealedQuestions] = useState<RevealState[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);

  // Live quiz state
  const [currentLiveQuiz, setCurrentLiveQuiz] = useState<LiveQuiz | null>(null);
  const [loadingLiveQuiz, setLoadingLiveQuiz] = useState(false);
  
  // Session state for all quiz types
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const creatingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Latest persisted content for the live quiz, so concurrent socket handlers
  // merge into one object instead of overwriting each other's fields.
  const liveQuizIdRef = useRef<string | null>(null);
  const contentRef = useRef<LiveQuiz['content'] | null>(null);
  const persistLiveQuiz = useCallback(async (partial: Partial<LiveQuiz['content']>) => {
    if (!liveQuizIdRef.current || !contentRef.current) return;
    contentRef.current = { ...contentRef.current, ...partial };
    try {
      await liveQuizzes.updateContent(liveQuizIdRef.current, contentRef.current);
    } catch (err) {
      console.error('Failed to save live quiz progress:', err);
    }
  }, []);
  
  // Debug session ID changes
  useEffect(() => {
    console.log('🆔 CurrentSessionId changed:', currentSessionId);
    if (currentSessionId) {
      console.log('🔗 Join URL will be: /quiz/join?session=' + currentSessionId);
    } else {
      console.log('🔗 Join URL will be: /quiz/join (no session)');
    }
  }, [currentSessionId]);
  
  // Create or recover the server session once the socket is available.
  // Exactly one create/recover request is in flight at a time (creatingRef),
  // listeners are removed on every outcome, and the host token returned by the
  // server is persisted so a reload can reclaim the session.
  useEffect(() => {
    if (!socket || currentSessionId || creatingRef.current) return;

    const liveQuizId = searchParams.get('live');
    const stored = readStoredHostSession();
    const sessionMode: QuizMode = liveQuizId ? 'scheduled' : currentMode;

    const cleanup = () => {
      socket.off('session-created', onCreated);
      socket.off('session-creation-error', onCreateError);
      socket.off('session-recovered', onRecovered);
      socket.off('session-not-found', onNotFound);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      creatingRef.current = false;
    };

    const onSessionReady = (sessionId: string, hostToken?: string) => {
      cleanup();
      setCurrentSessionId(sessionId);
      saveCurrentSession(sessionId, hostToken);
      if (questions.length > 0) {
        socket.emit('update-session-questions', { sessionId, questions });
      }
      socket.emit('set-quiz-mode', { mode: sessionMode, settings: currentSettings });
    };

    const onCreated = (data: { sessionId: string; hostToken?: string }) => onSessionReady(data.sessionId, data.hostToken);
    const onRecovered = (data: { sessionId: string; sessionData?: { hostToken?: string } }) =>
      onSessionReady(data.sessionId, data.sessionData?.hostToken);
    const onCreateError = (data: { error: string }) => {
      cleanup();
      setSessionError(data.error || 'Could not start a session');
    };
    const onNotFound = () => {
      cleanup();
      clearSavedState();
      createNew();
    };

    const armTimeout = () => {
      timeoutRef.current = setTimeout(() => {
        cleanup();
        setSessionError('The server did not respond. Check your connection and reload.');
      }, 8000);
    };

    const createNew = () => {
      creatingRef.current = true;
      const sessionId = liveQuizId || `quiz_${crypto.randomUUID()}`;
      const hostToken = stored?.sessionId === sessionId ? stored.hostToken : undefined;
      socket.on('session-created', onCreated);
      socket.on('session-creation-error', onCreateError);
      socket.emit('create-session', {
        type: 'quiz',
        userInfo: { isHost: true, hostToken },
        customSessionId: sessionId,
        initialMode: sessionMode
      });
      armTimeout();
    };

    setSessionError(null);

    // A live quiz always uses its database id as the session id.
    if (liveQuizId) {
      createNew();
      return;
    }

    if (stored?.sessionId) {
      creatingRef.current = true;
      socket.on('session-recovered', onRecovered);
      socket.on('session-not-found', onNotFound);
      socket.emit('recover-session', {
        sessionId: stored.sessionId,
        userInfo: { isHost: true, hostToken: stored.hostToken }
      });
      armTimeout();
      return;
    }

    createNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, currentSessionId, currentMode]);

  // Load mode and settings on component mount
  useEffect(() => {
    const loadQuizData = async () => {
      const liveQuizId = searchParams.get('live');
      
      if (liveQuizId) {
        // Load live quiz data
        setLoadingLiveQuiz(true);
        try {
          const liveQuiz = await liveQuizzes.getById(liveQuizId);
          if (liveQuiz) {
            console.log('📝 Loading live quiz:', liveQuiz);
            setCurrentLiveQuiz(liveQuiz);
            liveQuizIdRef.current = liveQuiz.id;
            contentRef.current = liveQuiz.content;
            setCurrentMode('scheduled'); // Live quizzes use scheduled mode
            setCurrentSettings({ mode: 'scheduled', ...liveQuiz.content.settings });
            setQuestions(liveQuiz.content.questions);
            setRevealedQuestions(liveQuiz.content.revealedQuestions);
            setScheduledSubmissions(liveQuiz.content.submissions || []);
            setLeaderboard(liveQuiz.content.leaderboard || []);
            setLeaderboardVisible(liveQuiz.content.leaderboardVisible);
          } else {
            console.error('Live quiz not found');
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Failed to load live quiz:', error);
          router.push('/dashboard');
        } finally {
          setLoadingLiveQuiz(false);
        }
      } else {
        // Load from sessionStorage (regular quiz)
        const savedMode = sessionStorage.getItem('selectedQuizMode') as QuizMode;
        const savedSettings = sessionStorage.getItem('selectedQuizSettings');
        const customQuestions = sessionStorage.getItem('customQuestions');
        
        if (savedMode) {
          setCurrentMode(savedMode);
        }
        
        if (savedSettings) {
          try {
            setCurrentSettings(JSON.parse(savedSettings));
          } catch (e) {
            console.error('Error parsing quiz settings:', e);
          }
        }
        
        if (customQuestions) {
          try {
            const parsedQuestions = JSON.parse(customQuestions);
            setQuestions(parsedQuestions);
            // Initialize revealed questions state for scheduled mode
            if (savedMode === 'scheduled') {
              setRevealedQuestions(parsedQuestions.map((_: QuizQuestion, index: number) => ({
                questionIndex: index,
                isRevealed: false,
                revealedAt: undefined
              })));
            }
          } catch (e) {
            console.error('Error parsing custom questions:', e);
          }
        } else if (savedMode === 'scheduled') {
          // Initialize with empty revealed questions - questions will be loaded later
          setRevealedQuestions([]); // Will be set when questions are loaded
        }
      }
    };
    
    loadQuizData();
  }, [searchParams, router]);

  // Send questions to session when they become available
  useEffect(() => {
    if (socket && currentSessionId && questions.length > 0) {
      console.log('📋 Sending questions to existing session:', currentSessionId, questions.length);
      socket.emit('update-session-questions', {
        sessionId: currentSessionId,
        questions: questions
      });
    }
  }, [socket, currentSessionId, questions]);

  // Removed duplicate session creation logic - using simplified version above

  useEffect(() => {
    if (!socket) return;

    // Note: Questions and mode are now sent via separate useEffect above
    // This ensures live quiz questions from database are used, not sessionStorage

    // Socket event listeners
    socket.on('register-team', (data) => {
      addTeam(data.socketId, data.teamName);
    });

    socket.on('disconnect-team', (socketId) => {
      removeTeam(socketId);
    });

    socket.on('buzz', (data) => {
      console.log('🔥 Host received buzz event:', data);
      addBuzz({
        teamName: data.teamName,
        timestamp: data.timestamp,
        rank: data.rank,
      });
    });

    // Basic mode events
    socket.on('basic-quiz-submitted', (data) => {
      // Server sends the host a bare submission; the submitter gets { submission, ... }.
      const submission: ParticipantSubmission = 'submission' in data ? data.submission : data;
      setBasicSubmissions(prev => [
        ...prev.filter(p => p.participantName.trim().toLowerCase() !== submission.participantName.trim().toLowerCase()),
        submission
      ]);
    });

    socket.on('submission-received', (data: { participantName: string; submissionTime: number }) => {
      console.log('Quiz submission notification:', data);
      // This is just a notification event - actual data comes from specific mode events
    });

    // Scheduled mode events
    socket.on('submission-stored', async (data: { participantName: string }) => {
      console.log('📝 Scheduled submission stored:', data);
      // Refresh submissions so the host view and the saved copy stay current
      if (liveQuizIdRef.current || currentMode === 'scheduled') {
        console.log('📝 Requesting fresh submissions for live quiz');
        try {
          // Request fresh data from server
          socket.emit('get-all-submissions');
        } catch (error) {
          console.error('Failed to refresh live quiz data:', error);
        }
      }
    });

    socket.on('all-submissions', (data: { submissions: ParticipantSubmission[]; revealedQuestions: RevealState[] }) => {
      // If the server was restarted it has fewer submissions / no reveals than
      // the database copy; never let an emptier server state erase saved progress.
      const saved = contentRef.current;
      const submissions = data.submissions.length > 0 ? data.submissions : (saved?.submissions ?? []);
      const revealed = (data.revealedQuestions || []).map((q, i) => ({
        ...q,
        isRevealed: q.isRevealed || !!saved?.revealedQuestions?.[i]?.isRevealed
      }));
      setScheduledSubmissions(submissions);
      if (revealed.length > 0) setRevealedQuestions(revealed);
      persistLiveQuiz({ submissions, revealedQuestions: revealed.length > 0 ? revealed : saved?.revealedQuestions });
    });

    socket.on('results-summary', (data: { submissions: ParticipantSubmission[] }) => {
      console.log('Basic quiz results summary received:', data);
      setBasicSubmissions(data.submissions);
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

    socket.on('leaderboard-updated', (data: { leaderboard: LeaderboardEntry[]; visible: boolean }) => {
      setLeaderboard(data.leaderboard || []);
      setLeaderboardVisible(data.visible || false);
      if ((data.leaderboard || []).length > 0 || data.visible) {
        persistLiveQuiz({ leaderboard: data.leaderboard || [], leaderboardVisible: data.visible || false });
      }
    });

    socket.on('error', (data: { message: string }) => {
      setSocketError(data?.message || 'Something went wrong');
    });

    return () => {
      socket.off('register-team');
      socket.off('disconnect-team');
      socket.off('buzz');
      socket.off('basic-quiz-submitted');
      socket.off('submission-received');
      socket.off('submission-stored');
      socket.off('all-submissions');
      socket.off('results-summary');
      socket.off('question-revealed');
      socket.off('all-questions-revealed');
      socket.off('leaderboard-updated');
      socket.off('error');
    };
  }, [socket, addTeam, removeTeam, addBuzz, currentMode, persistLiveQuiz]);

  // Request initial data when mode changes
  useEffect(() => {
    if (socket && currentMode) {
      // Small delay to ensure mode is set on server
      setTimeout(() => {
        if (currentMode === 'basic') {
          socket.emit('get-results-summary');
        } else if (currentMode === 'scheduled') {
          socket.emit('get-all-submissions');
          socket.emit('get-leaderboard-status');
        }
      }, 500);
    }
  }, [socket, currentMode]);

  // Initialize revealed questions when mode changes to scheduled
  useEffect(() => {
    if (currentMode === 'scheduled' && questions.length > 0 && revealedQuestions.length === 0) {
      setRevealedQuestions(questions.map((_: QuizQuestion, index: number) => ({
        questionIndex: index,
        isRevealed: false,
        revealedAt: undefined
      })));
    }
  }, [currentMode, questions, revealedQuestions.length]);

  const handleQuestionChange = (direction: 'next' | 'prev') => {
    const newQuestionNumber = changeQuestion(direction);
    setRevealedAnswer(null);
    setHighlightedOption(null);

    if (socket) {
      socket.emit('question-change', { questionNumber: newQuestionNumber });
    }
  };

  const handleRevealAnswer = () => {
    if (!quizState.currentQuestionData) return;

    const correctIndex = quizState.currentQuestionData?.correct;
    if (correctIndex === undefined) return;
    let cycleCount = 0;
    let currentIndex = 0;
    let speed = 100;

    const cycle = () => {
      setHighlightedOption(currentIndex);
      currentIndex = (currentIndex + 1) % 4;
      cycleCount++;

      if (cycleCount < 8) {
        setTimeout(cycle, speed);
      } else if (cycleCount < 12) {
        speed += 50;
        setTimeout(cycle, speed);
      } else if (currentIndex !== correctIndex) {
        setTimeout(cycle, speed);
      } else {
        setHighlightedOption(null);
        setRevealedAnswer(correctIndex);
        
        // Only emit final answer to participants (no animation)
        if (socket) {
          socket.emit('answer-revealed', { revealedAnswer: correctIndex });
        }
      }
    };

    cycle();
  };

  const handleResetBuzzer = () => {
    resetBuzzer();
    if (socket) {
      socket.emit('reset-buzzer');
    }
  };

  const handleAddPoint = (teamName: string) => {
    updateScore(teamName, 1);
    if (socket) {
      socket.emit('trigger-celebration', { teamName });
    }
  };

  const handleExitQuiz = () => {
    if (confirm('Are you sure you want to exit the quiz? This will end the session for all participants.')) {
      if (socket) {
        socket.emit('host-exit-quiz');
      }
      // Clear custom questions from storage
      sessionStorage.removeItem('customQuestions');
      // Clear saved quiz state
      clearSavedState();
      // Redirect to mode selection
      router.push('/mode');
    }
  };

  // Add handlers for new modes
  const handleSettingsUpdate = (settings: Partial<QuizSettings>) => {
    setCurrentSettings(prev => ({ ...prev, ...settings }));
  };

  const handleRevealQuestion = async (questionIndex: number) => {
    console.log('Revealing question:', questionIndex);
    
    // Update local state
    const newRevealedQuestions = revealedQuestions.map((q, index) => 
      index === questionIndex 
        ? { ...q, isRevealed: true, revealedAt: Date.now() }
        : q
    );
    setRevealedQuestions(newRevealedQuestions);
    
    // Update live quiz database if this is a live quiz
    if (currentLiveQuiz) {
      try {
        await liveQuizzes.updateRevealedQuestions(currentLiveQuiz.id, newRevealedQuestions);
      } catch (error) {
        console.error('Failed to update live quiz:', error);
      }
    }
    
    if (socket) {
      socket.emit('reveal-question', { questionIndex });
    }
  };

  const handleRevealAll = async () => {
    console.log('Revealing all questions');
    
    // Update local state
    const newRevealedQuestions = revealedQuestions.map(q => ({ 
      ...q, 
      isRevealed: true, 
      revealedAt: Date.now() 
    }));
    setRevealedQuestions(newRevealedQuestions);
    
    // Update live quiz database if this is a live quiz
    if (currentLiveQuiz) {
      try {
        await liveQuizzes.updateRevealedQuestions(currentLiveQuiz.id, newRevealedQuestions);
      } catch (error) {
        console.error('Failed to update live quiz:', error);
      }
    }
    
    if (socket) {
      socket.emit('reveal-all');
    }
  };

  const handleToggleLeaderboardVisibility = () => {
    const newVisibility = !leaderboardVisible;
    setLeaderboardVisible(newVisibility);
    if (socket) {
      socket.emit('toggle-leaderboard-visibility', { visible: newVisibility });
    }
  };

  const handleSendAnnouncement = (message: string) => {
    console.log('Sending announcement:', message);
    if (socket) {
      socket.emit('send-announcement', { message });
    }
  };

  const handleRefreshData = () => {
    console.log('Refreshing data');
    if (socket) {
      if (currentMode === 'basic') {
        socket.emit('get-results-summary');
      } else if (currentMode === 'scheduled') {
        socket.emit('get-all-submissions');
        socket.emit('get-leaderboard-status');
      }
    }
  };


  // Calculate participant and submission counts
  const participantCount = currentMode === 'buzzer' ? quizState.teams.size : participants.length;
  const submissionCount = currentMode === 'basic' ? basicSubmissions.length : 
                         currentMode === 'scheduled' ? scheduledSubmissions.length : 0;

  // Convert scores to the format expected by ResultsTab
  const teamScores = Array.from(quizState.scores.entries()).map(([teamName, score]) => ({
    teamName,
    score
  }));

  // ---- Presentation-only derived values ----
  const modeLabel = currentMode === 'buzzer' ? 'Buzzer' : currentMode === 'basic' ? 'Self-paced' : 'Scheduled reveal';
  const joinPath = currentSessionId ? `/quiz/join?session=${currentSessionId}` : (searchParams.get('live') ? `/quiz/join?session=${searchParams.get('live')}` : "/quiz/join");
  const sessionLabel = currentSessionId ?? searchParams.get('live') ?? null;
  const statusChip = (icon: React.ReactNode, label: React.ReactNode, title?: string) => (
    <span
      title={title}
      className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground [&_svg]:size-3.5 [&_svg]:shrink-0"
    >
      {icon}
      <span className="truncate text-foreground">{label}</span>
    </span>
  );

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <Header
        title={currentLiveQuiz?.title ? currentLiveQuiz.title : `${modeLabel} quiz · host`}
        subtitle={currentMode === 'buzzer'
          ? `Question ${quizState.currentQuestion} of ${quizState.totalQuestions}`
          : `${questions.length} questions · ${participantCount} participants`
        }
      >
        <ConnectionStatus status={connectionStatus} compact />
        <Button onClick={handleExitQuiz} variant="destructive" size="sm" aria-label="Exit quiz">
          <LogOut /> <span className="hidden sm:inline">Exit quiz</span>
        </Button>
      </Header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-6">
        {sessionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{sessionError}</AlertDescription>
          </Alert>
        )}
        {socketError && (
          <Alert variant="warning" className="mb-4" onClick={() => setSocketError(null)}>
            <AlertDescription>{socketError}</AlertDescription>
          </Alert>
        )}
        {/* Session status strip */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Badge variant="live" className="h-8 px-3">Live session</Badge>
          {statusChip(<Zap />, modeLabel, 'Quiz mode')}
          {sessionLabel && statusChip(<Hash />, sessionLabel, 'Session ID')}
          {statusChip(<Users />, `${participantCount} participant${participantCount === 1 ? '' : 's'}`)}
          {currentMode === 'buzzer'
            ? statusChip(<ListChecks />, `Question ${quizState.currentQuestion} / ${quizState.totalQuestions}`)
            : statusChip(<ListChecks />, `${submissionCount} submission${submissionCount === 1 ? '' : 's'}`)}
        </div>

        {loadingLiveQuiz ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" label="Loading live quiz..." className="flex-col gap-3" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Stage / dashboard */}
            <div className="space-y-6 lg:col-span-8">
              {currentMode === 'buzzer' ? (
                // Original buzzer interface for backward compatibility
                <>
                  <QuestionDisplay
                    questionNumber={quizState.currentQuestion}
                    totalQuestions={quizState.totalQuestions}
                    question={quizState.currentQuestionData}
                    isHost={true}
                    revealedAnswer={revealedAnswer}
                    highlightedOption={highlightedOption}
                    onQuestionChange={handleQuestionChange}
                    onRevealAnswer={handleRevealAnswer}
                  />
                  <ParticipantList
                    rankings={quizState.rankings}
                    onAddPoint={handleAddPoint}
                    onResetBuzzer={handleResetBuzzer}
                  />
                </>
              ) : (
                // New mode-aware dashboard for basic and scheduled modes
                <ModeAwareHostDashboard
                  mode={currentMode}
                  settings={currentSettings}
                  questions={questions}
                  basicSubmissions={basicSubmissions}
                  scheduledSubmissions={scheduledSubmissions}
                  revealedQuestions={revealedQuestions}
                  leaderboard={leaderboard}
                  leaderboardVisible={leaderboardVisible}
                  participants={participants}
                  scores={teamScores}
                  participantCount={participantCount}
                  submissionCount={submissionCount}
                  currentSessionId={currentSessionId}
                  searchParams={searchParams}
                  onSettingsUpdate={handleSettingsUpdate}
                  onRevealQuestion={handleRevealQuestion}
                  onRevealAll={handleRevealAll}
                  onToggleLeaderboardVisibility={handleToggleLeaderboardVisibility}
                  onSendAnnouncement={handleSendAnnouncement}
                  onRefreshData={handleRefreshData}
                />
              )}
            </div>

            {/* Right rail: scores + invite */}
            <aside className="space-y-6 lg:col-span-4">
              {currentMode === 'buzzer' && <ScoreBoard scores={quizState.scores} />}
              <SharePanel
                joinPath={joinPath}
                title="Invite participants"
                description="Scan the code or share the link to join this session."
              />
              {currentMode !== 'buzzer' && (
                <Card>
                  <CardContent className="p-4">
                    <p className="eyebrow mb-2 flex items-center gap-1.5"><Radio className="h-3.5 w-3.5" /> How this mode works</p>
                    <p className="text-sm text-muted-foreground">
                      {currentMode === 'basic'
                        ? 'Participants answer every question at their own pace and submit once. Results arrive here as they finish.'
                        : 'Participants submit all answers first. Use the Control tab to reveal questions one at a time, in batches, or all at once.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default function HostPage() {
  return (
    <Suspense fallback={null}>
      <HostPageContent />
    </Suspense>
  );
}
