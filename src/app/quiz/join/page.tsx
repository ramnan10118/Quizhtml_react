'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { ConnectionStatus } from '@/components/layout/ConnectionStatus';
import { QuestionDisplay } from '@/components/quiz/QuestionDisplay';
import { BuzzerButton } from '@/components/quiz/BuzzerButton';
import { useSocket } from '@/hooks/useSocket';
import { useQuizState } from '@/hooks/useQuizState';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
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
  const [statusMessage, setStatusMessage] = useState('');
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [revealedAnswer, setRevealedAnswer] = useState<number | null>(null);
  
  const { success, error, connectionChange } = useHapticFeedback();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
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

    socket.on('answer-revealed', (data) => {
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
    socket.on('quiz-ended', (data) => {
      alert(data.message);
      // Clear participant data
      setTeamName('');
      setIsRegistered(false);
      setInputName('');
      setSinglePlayerBuzzState(false);
      // Redirect to mode selection
      router.push('/mode');
    });

    // Request current question on connection
    if (isRegistered && teamName) {
      socket.emit('register-team', { teamName });
      socket.emit('request-question-number');
    }

    return () => {
      socket.off('question-change');
      socket.off('buzz');
      socket.off('reset-buzzer');
      socket.off('answer-revealed');
      socket.off('celebrate');
      socket.off('quiz-ended');
    };
  }, [socket, updateCurrentQuestion, setSinglePlayerBuzzState, success, error, connectionChange, isRegistered, teamName]);

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
      setStatusMessage(`Welcome, Team ${name}! Click the buzzer when you know the answer.`);
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

  const handleQuitSession = () => {
    if (confirm('Are you sure you want to quit? This will end your session.')) {
      setTeamName('');
      setIsRegistered(false);
      setInputName('');
      setSinglePlayerBuzzState(false);
      window.location.reload();
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
      >
        <ConnectionStatus status={connectionStatus} />
        {isRegistered && (
          <Button
            onClick={handleQuitSession}
            variant="destructive"
            size="sm"
          >
            Quit Session
          </Button>
        )}
      </Header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 pb-32 bg-gray-50 dark:bg-dark-900">
        <div className="w-full max-w-md space-y-6">
          {!isRegistered ? (
            /* Registration Form */
            <Card className="bg-white/10 dark:bg-dark-800/50 backdrop-blur border-white/20 dark:border-dark-600">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100 text-center">Join the Quiz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter your team name"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-lg py-3"
                  autoFocus
                />
                <Button
                  onClick={handleRegisterTeam}
                  className="w-full"
                  disabled={!inputName.trim()}
                >
                  Join Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Question Display */
            <QuestionDisplay
              questionNumber={quizState.currentQuestion}
              question={quizState.currentQuestionData}
              isHost={false}
              revealedAnswer={revealedAnswer}
              className="bg-white/10 dark:bg-dark-800/50 backdrop-blur border-white/20 dark:border-dark-600"
            />
          )}

          {/* Status Message */}
          {statusMessage && (
            <Card className="bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200">
              <CardContent className="p-4 text-center">
                {statusMessage}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Buzzer Button */}
      {isRegistered && (
        <BuzzerButton
          onBuzz={handleBuzz}
          disabled={!quizState.canBuzz}
          canBuzz={quizState.canBuzz}
        />
      )}
    </div>
  );
}