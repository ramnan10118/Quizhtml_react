'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ConnectionStatus } from '@/components/layout/ConnectionStatus';
import { QuestionDisplay } from '@/components/quiz/QuestionDisplay';
import { QuizControls } from '@/components/quiz/QuizControls';
import { ScoreBoard } from '@/components/quiz/ScoreBoard';
import { ParticipantList } from '@/components/quiz/ParticipantList';
import { SharePanel } from '@/components/ui/SharePanel';
import { useSocket } from '@/hooks/useSocket';
import { useQuizState } from '@/hooks/useQuizState';

export default function HostPage() {
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

    const correctIndex = quizState.currentQuestionData.correct;
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        title="Quiz Host Control Panel" 
        subtitle={`Question ${quizState.currentQuestion} of ${quizState.totalQuestions}`}
      >
        <ConnectionStatus status={connectionStatus} />
      </Header>

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Left Column - Question & Controls */}
            <div className="lg:col-span-2 space-y-6">
              <QuestionDisplay
                questionNumber={quizState.currentQuestion}
                question={quizState.currentQuestionData}
                isHost={true}
                revealedAnswer={revealedAnswer}
                highlightedOption={highlightedOption}
              />

              <QuizControls
                currentQuestion={quizState.currentQuestion}
                totalQuestions={quizState.totalQuestions}
                questionData={quizState.currentQuestionData}
                onQuestionChange={handleQuestionChange}
                onRevealAnswer={handleRevealAnswer}
                onResetBuzzer={handleResetBuzzer}
              />
            </div>

            {/* Right Column - Scores & Rankings */}
            <div className="space-y-6">
              <ScoreBoard scores={quizState.scores} />
              
              <ParticipantList 
                rankings={quizState.rankings}
                onAddPoint={handleAddPoint}
              />
            </div>

            {/* Share Panel */}
            <div className="space-y-6">
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