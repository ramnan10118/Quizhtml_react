import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Gamepad2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
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
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-primary" /> Quiz controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-border bg-surface-raised p-4">
          <p className="eyebrow">Current question</p>
          <p className="mt-1 font-display text-2xl font-bold tabular text-foreground">
            {currentQuestion} <span className="text-base font-medium text-muted-foreground">of {totalQuestions}</span>
          </p>
          <Progress className="mt-3" value={currentQuestion} max={totalQuestions} label="Quiz progress" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onQuestionChange('prev')} disabled={!canGoPrev} variant="outline">
            <ChevronLeft /> Previous
          </Button>
          <Button onClick={() => onQuestionChange('next')} disabled={!canGoNext} variant="secondary">
            Next <ChevronRight />
          </Button>
        </div>

        <Button onClick={handleRevealAnswer} disabled={isRevealing || !questionData} className="w-full">
          <Eye /> {isRevealing ? 'Revealing…' : 'Reveal answer'}
        </Button>

        <Button onClick={onResetBuzzer} variant="destructive" className="w-full">
          <RotateCcw /> Reset buzzer
        </Button>
      </CardContent>
    </Card>
  );
}
