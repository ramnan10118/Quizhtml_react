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
import { useSocket } from '@/hooks/useSocket';
import { useQuizState } from '@/hooks/useQuizState';

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

  const [revealedAnswer, setRevealedAnswer] = useState<number | null>(null);
  const [highlightedOption, setHighlightedOption] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Send custom questions to server on connection
    const customQuestions = sessionStorage.getItem('customQuestions');
    if (customQuestions) {
      try {
        const questions = JSON.parse(customQuestions);
        (socket as any).emit('set-custom-questions', { questions });
      } catch (e) {
        console.error('Error parsing custom questions:', e);
      }
    }

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

    return () => {
      socket.off('register-team');
      socket.off('disconnect-team');
      socket.off('buzz');
    };
  }, [socket, addTeam, removeTeam, addBuzz]);

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-900 dark">
      <Header 
        title="Quiz Host Control Panel" 
        subtitle={`Question ${quizState.currentQuestion} of ${quizState.totalQuestions}`}
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
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Question */}
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

            {/* Right Column - Scores, Rankings & Invite (Vertical) */}
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
        </div>
      </main>
    </div>
  );
}