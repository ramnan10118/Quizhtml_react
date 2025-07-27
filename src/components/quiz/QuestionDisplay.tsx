import * as React from 'react'
import { Card, CardContent, CardHeader, Button, cn } from '@/components/ui'
import { QuizQuestion } from '@/types/quiz'
import { getOptionLabel } from '@/lib/utils'

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
        <CardContent className="p-8 text-center text-muted-foreground">
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

  return (
    <Card className={cn('w-full bg-gradient-to-br from-card to-muted border-border', className)}>
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-gray-100">
            Question {questionNumber}
          </h2>
          {totalQuestions && (
            <p className="text-sm sm:text-base text-slate-500 dark:text-gray-500">
              {questionNumber} out of {totalQuestions}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-gray-100 leading-tight sm:leading-normal md:leading-relaxed">
            {question.text}
          </h1>
        </div>
        
        {isHost ? (
          /* Host view - with interactive boxes */
          <div className="grid gap-2 sm:gap-3">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={cn(
                  'p-3 sm:p-4 rounded-lg border-2 transition-all duration-200',
                  'bg-white dark:bg-dark-700 hover:bg-slate-50 dark:hover:bg-dark-600',
                  'border-slate-200 dark:border-dark-600',
                  // Highlighted option (during reveal animation)
                  highlightedOption === index && 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 transform scale-105',
                  // Correct answer (after reveal)
                  revealedAnswer === index && 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 shadow-lg shadow-green-100 dark:shadow-green-900/20',
                  // Wrong answers (if revealed and not correct)
                  revealedAnswer !== null && revealedAnswer !== index && 'opacity-60'
                )}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span
                    className={cn(
                      'flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0',
                      'bg-slate-100 dark:bg-dark-600 text-slate-700 dark:text-gray-200 font-semibold text-sm sm:text-base',
                      highlightedOption === index && 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200',
                      revealedAnswer === index && 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                    )}
                  >
                    {getOptionLabel(index)}
                  </span>
                  <span
                    className={cn(
                      'text-sm sm:text-base md:text-lg text-slate-800 dark:text-gray-200 font-medium leading-tight',
                      revealedAnswer === index && 'text-green-800 dark:text-green-200 font-semibold'
                    )}
                  >
                    {option}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Participant view - simple text display */
          <div className="space-y-3 sm:space-y-4">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center space-x-3 sm:space-x-4 py-2 sm:py-3 transition-all duration-200',
                  // Correct answer styling
                  revealedAnswer === index && 'text-green-400 font-semibold',
                  // Dim wrong answers when revealed
                  revealedAnswer !== null && revealedAnswer !== index && 'opacity-50'
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-semibold flex-shrink-0',
                    'bg-white/20 text-gray-100',
                    revealedAnswer === index && 'bg-green-400 text-green-900'
                  )}
                >
                  {getOptionLabel(index)}
                </span>
                <span 
                  className={cn(
                    'text-sm sm:text-base md:text-lg text-gray-100 font-medium leading-tight',
                    revealedAnswer === index && 'text-green-400 font-semibold'
                  )}
                >
                  {option}
                  {revealedAnswer === index && ' ✓'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Quiz Controls - Only show for host */}
        {isHost && onQuestionChange && onRevealAnswer && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-dark-600">
            {/* Left side - Navigation */}
            <div className="flex space-x-3">
              <Button
                onClick={() => onQuestionChange('prev')}
                disabled={!canGoPrev}
                variant="outline"
              >
                ← Previous
              </Button>
              <Button
                onClick={() => onQuestionChange('next')}
                disabled={!canGoNext}
              >
                Next →
              </Button>
            </div>

            {/* Right side - Actions */}
            <div>
              <Button
                onClick={handleRevealAnswer}
                disabled={isRevealing || !question}
                variant="secondary"
              >
                {isRevealing ? 'Revealing...' : 'Reveal Answer'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}