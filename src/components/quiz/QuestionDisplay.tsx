import * as React from 'react'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { Card, CardContent, Button, cn } from '@/components/ui'
import { QuizQuestion } from '@/types/quiz'
import { getOptionLabel } from '@/lib/utils'
import { AnswerOption, type AnswerOptionState } from './AnswerOption'

const { useState } = React

interface QuestionDisplayProps {
  questionNumber: number;
  totalQuestions?: number;
  question: QuizQuestion | null;
  isHost?: boolean;
  revealedAnswer?: number | null;
  highlightedOption?: number | null;
  onQuestionChange?: (direction: 'next' | 'prev') => void;
  onRevealAnswer?: () => void;
  className?: string;
}

export function QuestionDisplay({
  questionNumber,
  totalQuestions,
  question,
  isHost = false,
  revealedAnswer = null,
  highlightedOption = null,
  onQuestionChange,
  onRevealAnswer,
  className
}: QuestionDisplayProps) {
  const [isRevealing, setIsRevealing] = useState(false);

  if (!question) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Loading question...
        </CardContent>
      </Card>
    );
  }

  const handleRevealAnswer = async () => {
    if (onRevealAnswer) {
      setIsRevealing(true);
      onRevealAnswer();

      // Reset revealing state after animation
      setTimeout(() => {
        setIsRevealing(false);
      }, 3000);
    }
  };

  const canGoPrev = questionNumber > 1;
  const canGoNext = totalQuestions ? questionNumber < totalQuestions : false;

  const stateFor = (index: number): AnswerOptionState => {
    if (revealedAnswer === index) return 'correct'
    if (revealedAnswer !== null && revealedAnswer !== index) return 'dimmed'
    if (highlightedOption === index) return 'highlighted'
    return 'default'
  }

  return (
    <Card className={cn('stage-bg w-full overflow-hidden', className)}>
      <CardContent className="p-5 sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="eyebrow">
            Question <span className="text-foreground tabular">{questionNumber}</span>
            {totalQuestions ? <span className="tabular"> / {totalQuestions}</span> : null}
          </p>
          {revealedAnswer !== null ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
              <Eye className="h-3.5 w-3.5" /> Answer revealed
            </span>
          ) : isHost ? (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Open</span>
          ) : null}
        </div>

        <h2 className="font-display text-xl font-bold leading-snug text-foreground sm:text-2xl md:text-[28px] md:leading-snug">
          {question.text}
        </h2>

        <div className={cn('mt-6 grid gap-2.5', isHost && 'sm:grid-cols-2')}>
          {question.options.map((option, index) => (
            <AnswerOption
              key={index}
              label={getOptionLabel(index)}
              text={option}
              state={stateFor(index)}
              size={isHost ? 'md' : 'lg'}
            />
          ))}
        </div>

        {/* Quiz Controls - Only show for host */}
        {isHost && onQuestionChange && onRevealAnswer && (
          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button
                onClick={() => onQuestionChange('prev')}
                disabled={!canGoPrev}
                variant="outline"
                aria-label="Previous question"
              >
                <ChevronLeft /> Previous
              </Button>
              <Button
                onClick={() => onQuestionChange('next')}
                disabled={!canGoNext}
                variant="secondary"
                aria-label="Next question"
              >
                Next <ChevronRight />
              </Button>
            </div>
            <Button
              onClick={handleRevealAnswer}
              disabled={isRevealing || !question}
              variant={revealedAnswer !== null ? 'outline' : 'default'}
            >
              <Eye />
              {isRevealing ? 'Revealing…' : revealedAnswer !== null ? 'Revealed' : 'Reveal answer'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
