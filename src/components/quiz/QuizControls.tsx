import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QuizQuestion } from '@/types/quiz';
import { cn } from '@/lib/utils';

interface QuizControlsProps {
  currentQuestion: number;
  totalQuestions: number;
  questionData: QuizQuestion | null;
  onQuestionChange: (direction: 'next' | 'prev') => void;
  onRevealAnswer: () => void;
  onResetBuzzer: () => void;
  className?: string;
}

export function QuizControls({
  currentQuestion,
  totalQuestions,
  questionData,
  onQuestionChange,
  onRevealAnswer,
  onResetBuzzer,
  className
}: QuizControlsProps) {
  const [isRevealing, setIsRevealing] = useState(false);

  const handleRevealAnswer = async () => {
    setIsRevealing(true);
    onRevealAnswer();
    
    // Reset revealing state after animation
    setTimeout(() => {
      setIsRevealing(false);
    }, 3000);
  };

  const canGoPrev = currentQuestion > 1;
  const canGoNext = currentQuestion < totalQuestions;

  return (
    <Card className={cn('w-full bg-gradient-to-br from-slate-50 to-slate-100', className)}>
      <CardHeader>
        <CardTitle className="text-slate-700 flex items-center space-x-2">
          <span>🎮</span>
          <span>Quiz Controls</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question Info */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-sm text-slate-600 mb-1">Current Question</div>
          <div className="text-2xl font-bold text-slate-900">
            {currentQuestion} of {totalQuestions}
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex space-x-3">
          <Button
            onClick={() => onQuestionChange('prev')}
            disabled={!canGoPrev}
            variant="outline"
            className="flex-1"
          >
            ← Previous
          </Button>
          <Button
            onClick={() => onQuestionChange('next')}
            disabled={!canGoNext}
            className="flex-1"
          >
            Next →
          </Button>
        </div>

        {/* Answer Reveal */}
        <Button
          onClick={handleRevealAnswer}
          disabled={isRevealing || !questionData}
          variant="secondary"
          className="w-full"
        >
          {isRevealing ? (
            <span className="flex items-center space-x-2">
              <span className="animate-spin">🎯</span>
              <span>Revealing...</span>
            </span>
          ) : (
            '🎯 Reveal Answer'
          )}
        </Button>

        {/* Reset Buzzer */}
        <Button
          onClick={onResetBuzzer}
          variant="destructive"
          className="w-full"
        >
          🔄 Reset Buzzer
        </Button>
      </CardContent>
    </Card>
  );
}