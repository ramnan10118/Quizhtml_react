'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { QuestionDisplay } from '@/components/quiz/QuestionDisplay';
import { ScoreBoard } from '@/components/quiz/ScoreBoard';
import { ParticipantList } from '@/components/quiz/ParticipantList';
import { SharePanel } from '@/components/ui/SharePanel';
import { Button } from '@/components/ui/Button';
import { ModeAwareHostDashboard } from '@/components/host/ModeAwareHostDashboard';
import { useSocket } from '@/hooks/useSocket';
import { useQuizState } from '@/hooks/useQuizState';
import { QuizMode, QuizSettings, ParticipantSubmission, RevealState, LeaderboardEntry, QuizQuestion } from '@/types/quiz';
import { liveQuizzes, LiveQuiz } from '@/lib/drafts';

function HostPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket } = useSocket();
  
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
    savedSessionId,
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
  
  // Debug session ID changes
  useEffect(() => {
    console.log('🆔 CurrentSessionId changed:', currentSessionId);
    if (currentSessionId) {
      console.log('🔗 Join URL will be: /quiz/join?session=' + currentSessionId);
    } else {
      console.log('🔗 Join URL will be: /quiz/join (no session)');
    }
  }, [currentSessionId]);
  
  // Create or recover session when socket connects
  useEffect(() => {
    console.log('🔍 Session creation useEffect - Socket:', !!socket, 'CurrentSessionId:', currentSessionId, 'SavedSessionId:', savedSessionId, 'CurrentMode:', currentMode);
    
    if (socket && !currentSessionId) {
      console.log('✅ Socket connected and no current session - proceeding with session logic');
      
      // Check if this is a live quiz - if so, skip session recovery and use live quiz ID
      const liveQuizId = searchParams.get('live');
      if (liveQuizId) {
        console.log('🎯 Live quiz detected, skipping session recovery. Using live quiz ID:', liveQuizId);
        createNewSession();
        return;
      }
      
      // Get fresh saved session data (don't rely on savedSessionId from hook since it might be stale)
      const freshSavedData = typeof window !== 'undefined' ? (() => {
        try {
          const stored = localStorage.getItem('buzzer_quiz_state');
          console.log('🔍 Raw localStorage data:', stored);
          if (stored) {
            const parsed = JSON.parse(stored);
            console.log('🔍 Parsed localStorage data:', parsed);
            console.log('🔍 Session ID from storage:', parsed.sessionId);
            console.log('🔍 Timestamp age:', Date.now() - parsed.timestamp, 'ms');
            
            if (Date.now() - parsed.timestamp < 2 * 60 * 60 * 1000) {
              console.log('✅ Session data is fresh, returning session ID:', parsed.sessionId);
              return parsed.sessionId;
            } else {
              console.log('⏰ Session data is too old, removing');
              localStorage.removeItem('buzzer_quiz_state');
            }
          } else {
            console.log('📭 No data in localStorage');
          }
        } catch (e) {
          console.error('❌ Error loading saved session:', e);
          localStorage.removeItem('buzzer_quiz_state');
        }
        return null;
      })() : null;
      
      console.log('💾 Fresh saved session ID:', freshSavedData);
      
      // Check if we have a saved session to recover
      if (freshSavedData) {
        console.log('🔄 Found saved session, attempting recovery:', freshSavedData);
        
        const recoveryTimeoutId: NodeJS.Timeout | null = null;
        
        const handleSessionRecovered = (data: { sessionId: string }) => {
          console.log('✅ Session recovered successfully:', data.sessionId);
          setCurrentSessionId(data.sessionId);
          // Clear any pending new session creation timeouts
          if (recoveryTimeoutId) {
            clearTimeout(recoveryTimeoutId);
            console.log('🚫 Cleared new session creation timeout - using recovered session');
          }
        };
        
        const handleSessionNotFound = () => {
          console.log('❌ Saved session not found, creating new session');
          clearSavedState(); // Clear invalid saved state
          // Continue with creating new session
          createNewSession();
        };
        
        socket.once('session-recovered', handleSessionRecovered);
        socket.once('session-not-found', handleSessionNotFound);
        
        socket.emit('recover-session', { 
          sessionId: freshSavedData, 
          userInfo: { isHost: true } 
        });
        
        return; // Exit early, let recovery handle it
      }
      
      // No saved session, create new one
      createNewSession();
    } else {
      if (!socket) console.log('❌ No socket available');
      if (currentSessionId) {
        console.log('✅ Session already exists:', currentSessionId);
        // Set up persistence for existing session
        saveCurrentSession(currentSessionId);
      }
    }
    
    function createNewSession() {
      if (!socket) return;
      // Determine session type and mode
      const liveQuizId = searchParams.get('live');
      const isLiveQuiz = !!liveQuizId;
      const sessionMode = isLiveQuiz ? 'scheduled' : currentMode;
      const sessionId = isLiveQuiz ? liveQuizId : `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🔗 Attempting to create NEW session:', sessionId, 'Live Quiz:', isLiveQuiz, 'Mode:', sessionMode);
      
      // For live quizzes, the session ID will be set by handleSessionCreated callback
      // Don't set it immediately to avoid race conditions
      
      // Listen for session creation response
      const handleSessionCreated = (data: { sessionId: string }) => {
        console.log('✅ Session created event received:', data.sessionId);
        console.log('🎯 Setting currentSessionId to:', data.sessionId);
        setCurrentSessionId(data.sessionId);
        
        // Save session ID for recovery
        saveCurrentSession(data.sessionId);
        
        // Send questions and mode to the session
        if (questions.length > 0) {
          console.log('📋 Sending questions to session:', questions.length);
          socket.emit('update-session-questions', { 
            sessionId: data.sessionId, 
            questions: questions 
          });
        }
        socket.emit('set-quiz-mode', { 
          mode: sessionMode, 
          settings: currentSettings,
          liveQuizId: isLiveQuiz ? liveQuizId : undefined
        });
        
        socket.off('session-created', handleSessionCreated);
        console.log('✅ Session creation completed and listener removed');
      };
      
      const handleSessionError = (error: unknown) => {
        console.error('❌ Session creation failed:', error);
      };
      
      console.log('📡 Setting up event listeners...');
      socket.on('session-created', handleSessionCreated);
      socket.on('session-creation-error', handleSessionError);
      
      // Request session creation
      console.log('📤 Emitting create-session request...');
      socket.emit('create-session', {
        type: 'quiz',
        userInfo: { isHost: true },
        customSessionId: sessionId,
        initialMode: sessionMode
      });
      console.log('📤 Create-session request sent');
      
      // Fallback: If session creation doesn't work within 3 seconds, create a client-side session ID
      const timeoutId = setTimeout(() => {
        console.log('⏰ Session creation timeout - creating fallback session ID');
        setCurrentSessionId(sessionId);
        saveCurrentSession(sessionId);
      }, 3000);
    }
  }, [socket, currentSessionId, currentMode, savedSessionId, clearSavedState, saveCurrentSession]);

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
    socket.on('basic-quiz-submitted', (submission: ParticipantSubmission) => {
      console.log('Basic quiz submission received:', submission);
      setBasicSubmissions(prev => [...prev, submission]);
    });

    socket.on('submission-received', (data: { participantName: string; submissionTime: number }) => {
      console.log('Quiz submission notification:', data);
      // This is just a notification event - actual data comes from specific mode events
    });

    // Scheduled mode events
    socket.on('submission-stored', async (data: { participantName: string }) => {
      console.log('📝 Scheduled submission stored:', data);
      console.log('📝 Is live quiz?', !!currentLiveQuiz);
      console.log('📝 Current mode:', currentMode);
      
      // For live quizzes, refresh the data to get updated submissions
      if (currentLiveQuiz) {
        console.log('📝 Requesting fresh submissions for live quiz');
        try {
          // Request fresh data from server
          socket.emit('get-all-submissions');
        } catch (error) {
          console.error('Failed to refresh live quiz data:', error);
        }
      }
    });

    socket.on('all-submissions', async (data: { submissions: ParticipantSubmission[]; revealedQuestions: RevealState[] }) => {
      console.log('All scheduled submissions received:', data);
      console.log('📊 Submissions count:', data.submissions?.length || 0);
      console.log('📊 Submissions data:', data.submissions);
      setScheduledSubmissions(data.submissions);
      setRevealedQuestions(data.revealedQuestions);
      
      // Save to database if this is a live quiz
      if (currentLiveQuiz) {
        try {
          const updatedContent = {
            ...currentLiveQuiz.content,
            submissions: data.submissions,
            revealedQuestions: data.revealedQuestions
          };
          await liveQuizzes.updateContent(currentLiveQuiz.id, updatedContent);
        } catch (error) {
          console.error('Failed to save submissions to live quiz:', error);
        }
      }
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

    socket.on('leaderboard-updated', async (data: { leaderboard: Array<{ rank: number; participantName: string; score: number; submissionTime: number; questionsRevealed: number }>; visible: boolean }) => {
      console.log('Leaderboard updated:', data);
      setLeaderboard(data.leaderboard || []);
      setLeaderboardVisible(data.visible || false);
      
      // Save to database if this is a live quiz
      if (currentLiveQuiz) {
        try {
          const updatedContent = {
            ...currentLiveQuiz.content,
            leaderboard: data.leaderboard || [],
            leaderboardVisible: data.visible || false
          };
          await liveQuizzes.updateContent(currentLiveQuiz.id, updatedContent);
        } catch (error) {
          console.error('Failed to save leaderboard to live quiz:', error);
        }
      }
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
    };
  }, [socket, addTeam, removeTeam, addBuzz, currentMode, currentSettings]);

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-900 dark">
      <Header 
        title={`${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} Quiz Host`}
        subtitle={currentMode === 'buzzer' 
          ? `Question ${quizState.currentQuestion} of ${quizState.totalQuestions}` 
          : `${questions.length} questions • ${participantCount} participants`
        }
      >
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleExitQuiz}
            variant="destructive"
            size="sm"
          >
            Exit Quiz
          </Button>
        </div>
      </Header>

      <main className="flex-1 p-6 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto">
          {loadingLiveQuiz ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">🔄</div>
                <p className="text-gray-600 dark:text-gray-400">Loading live quiz...</p>
              </div>
            </div>
          ) : currentMode === 'buzzer' ? (
            // Original buzzer interface for backward compatibility
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
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
              </div>
              <div className="space-y-6">
                <ScoreBoard scores={quizState.scores} />
                <ParticipantList 
                  rankings={quizState.rankings}
                  onAddPoint={handleAddPoint}
                  onResetBuzzer={handleResetBuzzer}
                />
                <SharePanel
                  joinPath={currentSessionId ? `/quiz/join?session=${currentSessionId}` : (searchParams.get('live') ? `/quiz/join?session=${searchParams.get('live')}` : "/quiz/join")}
                  title="Invite Players"
                  description="Share with participants to join the quiz"
                />
              </div>
            </div>
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
