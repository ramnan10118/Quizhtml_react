'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from '@/components/ui'
import { Header } from '@/components/layout/Header';
import { QuestionDisplay } from '@/components/quiz/QuestionDisplay';
import { BuzzerButton } from '@/components/quiz/BuzzerButton';
import { BasicQuizInterface } from '@/components/quiz/BasicQuizInterface';
import { ScheduledQuizInterface } from '@/components/quiz/ScheduledQuizInterface';
import { useSocket } from '@/hooks/useSocket';
import { useQuizState } from '@/hooks/useQuizState';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { QuizMode } from '@/types/quiz';
import confetti from 'canvas-confetti';

export default function JoinPage() {
  const router = useRouter();
  const { socket } = useSocket();
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
  const [questions, setQuestions] = useState([]);
  const [quizSettings, setQuizSettings] = useState<{ timeLimit?: number }>({});
  
  // Submission states
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [submissionConfirmed, setSubmissionConfirmed] = useState(false);
  
  const { success, error, connectionChange } = useHapticFeedback();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('quiz-mode-set', (data) => {
      setQuizMode(data.mode);
      setQuizSettings(data.settings || {});
      setQuestions(data.questions || []);
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
    socket.on('basic-quiz-submitted', (data) => {
      console.log('Basic quiz submission confirmed:', data);
      setSubmissionConfirmed(true);
    });

    // Scheduled mode events
    socket.on('submission-stored', (data) => {
      console.log('Scheduled submission confirmed:', data);
      setSubmissionConfirmed(true);
    });

    socket.on('question-revealed', (data) => {
      console.log('Question revealed:', data);
      // Update revealed questions state
    });

    socket.on('leaderboard-updated', (data) => {
      console.log('Leaderboard updated for participant:', data);
      // Update leaderboard display
    });


    // Request current question on connection
    if (isRegistered && teamName) {
      socket.emit('register-team', { teamName });
      socket.emit('request-question-number');
    }

    return () => {
      socket.off('quiz-mode-set');
      socket.off('question-change');
      socket.off('buzz');
      socket.off('reset-buzzer');
      socket.off('answer-revealed');
      socket.off('celebrate');
      socket.off('quiz-ended');
      socket.off('basic-quiz-submitted');
      socket.off('submission-stored');
      socket.off('question-revealed');
      socket.off('leaderboard-updated');
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
      socket.emit('register-team', { teamName: name });
      socket.emit('request-question-number');
      success();
    }
  };

  const handleBuzz = () => {
    if (socket && quizState.canBuzz && teamName) {
      socket.emit('buzz', {
        teamName,
        timestamp: Date.now()
      });
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRegisterTeam();
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 dark:bg-dark-900 dark ${isCelebrating ? 'celebrating' : ''}`}>
      <Header 
        title="Quiz Participant" 
        subtitle={isMounted && teamName ? `Team: ${teamName}` : 'Join the Quiz'}
      />
      
      {/* Welcome Message */}
      {isRegistered && teamName && (
        <div className="bg-blue-600 text-white px-6 py-3 text-center">
          <p className="text-sm font-medium">
            Welcome, Team {teamName}! Click the buzzer when you know the answer.
          </p>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 pb-24 sm:pb-32 bg-gray-50 dark:bg-dark-900">
        <div className="w-full max-w-lg space-y-4 sm:space-y-6">
          {!isRegistered ? (
            /* Registration Form */
            <Card className="bg-white/10 dark:bg-dark-800/50 backdrop-blur border-white/20 dark:border-dark-600">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 text-center">
                  Join the {quizMode.charAt(0).toUpperCase() + quizMode.slice(1)} Quiz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter your team name"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-base sm:text-lg py-3 sm:py-4"
                  autoFocus
                />
                <Button
                  onClick={handleRegisterTeam}
                  className="w-full py-3 sm:py-4 text-base sm:text-lg"
                  disabled={!inputName.trim()}
                >
                  Join Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Mode-specific interfaces */
            <>
              {quizMode === 'buzzer' && (
                <QuestionDisplay
                  questionNumber={quizState.currentQuestion}
                  question={quizState.currentQuestionData}
                  isHost={false}
                  revealedAnswer={revealedAnswer}
                  className="bg-white/10 dark:bg-dark-800/50 backdrop-blur border-white/20 dark:border-dark-600"
                />
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
                  onSubmitAnswers={(answers) => {
                    console.log('Scheduled quiz submitted:', answers);
                    setIsQuizSubmitted(true);
                    if (socket) {
                      socket.emit('submit-scheduled-quiz', {
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