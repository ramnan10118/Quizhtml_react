'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { ConnectionStatus } from '@/components/layout/ConnectionStatus';
import { QuestionDisplay } from '@/components/quiz/QuestionDisplay';
import { ScoreBoard } from '@/components/quiz/ScoreBoard';
import { ParticipantList } from '@/components/quiz/ParticipantList';
import { SharePanel } from '@/components/ui/SharePanel';
import { Button } from '@/components/ui/Button';
import { ModeAwareHostDashboard } from '@/components/host/ModeAwareHostDashboard';
import { useSocket } from '@/hooks/useSocket';
import { useQuizState } from '@/hooks/useQuizState';
import { QuizMode, QuizSettings, QUIZ_QUESTIONS, ParticipantSubmission, RevealState, LeaderboardEntry } from '@/types/quiz';

export default function HostPage() {
  const router = useRouter();
  const { socket, connectionStatus } = useSocket();
  const {
    quizState,
    addTeam,
    removeTeam,
    addBuzz,
    resetBuzzer,
    updateScore,
    changeQuestion,
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
  const [questions, setQuestions] = useState(QUIZ_QUESTIONS);
  
  // Buzzer mode specific state
  const [revealedAnswer, setRevealedAnswer] = useState<number | null>(null);
  const [highlightedOption, setHighlightedOption] = useState<number | null>(null);
  
  // Basic/Scheduled mode specific state
  const [participants] = useState<Array<{ name: string; socketId: string }>>([]);
  const [basicSubmissions, setBasicSubmissions] = useState<ParticipantSubmission[]>([]);
  const [scheduledSubmissions, setScheduledSubmissions] = useState<ParticipantSubmission[]>([]);
  const [revealedQuestions] = useState<RevealState[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);

  // Load mode and settings on component mount
  useEffect(() => {
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
        setQuestions(JSON.parse(customQuestions));
      } catch (e) {
        console.error('Error parsing custom questions:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Send custom questions and quiz mode to server on connection
    const customQuestions = sessionStorage.getItem('customQuestions');
    if (customQuestions) {
      try {
        const questions = JSON.parse(customQuestions);
        socket.emit('set-custom-questions', { questions });
      } catch (e) {
        console.error('Error parsing custom questions:', e);
      }
    }

    // Send quiz mode and settings to server
    socket.emit('set-quiz-mode', { 
      mode: currentMode, 
      settings: currentSettings
    });

    // Socket event listeners
    socket.on('register-team', (data) => {
      addTeam(data.socketId, data.teamName);
    });

    socket.on('disconnect-team', (socketId) => {
      removeTeam(socketId);
    });

    socket.on('buzz', (data) => {
      addBuzz({
        teamName: data.teamName,
        timestamp: data.timestamp,
        rank: data.rank,
      });
    });

    // Basic mode events
    socket.on('submission-received', (data: { participantName: string; submissionTime: number }) => {
      console.log('Basic quiz submission received:', data);
      // For now, just update count - we'll get the full submission data from another event
    });

    // Scheduled mode events
    socket.on('submission-received', (data: { participantName: string; submissionTime: number }) => {
      console.log('Scheduled submission received:', data);
      // For now, just update count - we'll get the full submission data from another event
    });

    socket.on('leaderboard-updated', (data: { leaderboard: Array<{ rank: number; participantName: string; score: number; submissionTime: number; questionsRevealed: number }>; visible: boolean }) => {
      console.log('Leaderboard updated:', data);
      setLeaderboard(data.leaderboard || []);
      setLeaderboardVisible(data.visible || false);
    });

    return () => {
      socket.off('register-team');
      socket.off('disconnect-team');
      socket.off('buzz');
      socket.off('submission-received');
      socket.off('leaderboard-updated');
    };
  }, [socket, addTeam, removeTeam, addBuzz, currentMode, currentSettings]);

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
      // Redirect to mode selection
      router.push('/mode');
    }
  };

  // Add handlers for new modes
  const handleSettingsUpdate = (settings: Partial<QuizSettings>) => {
    setCurrentSettings(prev => ({ ...prev, ...settings }));
  };

  const handleRevealQuestion = (questionIndex: number) => {
    console.log('Revealing question:', questionIndex);
    if (socket) {
      socket.emit('reveal-question', { questionIndex });
    }
  };

  const handleRevealAll = () => {
    console.log('Revealing all questions');
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
    // TODO: Implement data refresh logic
    console.log('Refreshing data');
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
          <ConnectionStatus status={connectionStatus} />
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
          {currentMode === 'buzzer' ? (
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
                  joinPath="/quiz/join"
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