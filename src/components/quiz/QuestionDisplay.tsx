import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { QuizQuestion } from '@/types/quiz';
import { getOptionLabel, cn } from '@/lib/utils';

interface QuestionDisplayProps {
  questionNumber: number;
  question: QuizQuestion | null;
  isHost?: boolean;
  revealedAnswer?: number | null;
  highlightedOption?: number | null;
  className?: string;
}

export function QuestionDisplay({
  questionNumber,
  question,
  revealedAnswer = null,
  highlightedOption = null,
  className
}: QuestionDisplayProps) {
  if (!question) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-8 text-center text-gray-500">
          Loading question...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200', className)}>
      <CardHeader>
        <CardTitle className="text-slate-700">
          Question {questionNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-xl font-semibold text-slate-900 leading-relaxed">
            {question.text}
          </h3>
        </div>
        
        <div className="grid gap-3">
          {question.options.map((option, index) => (
            <div
              key={index}
              className={cn(
                'p-4 rounded-lg border-2 transition-all duration-200',
                'bg-white hover:bg-slate-50',
                'border-slate-200',
                // Highlighted option (during reveal animation)
                highlightedOption === index && 'border-blue-400 bg-blue-50 transform scale-105',
                // Correct answer (after reveal)
                revealedAnswer === index && 'border-green-500 bg-green-50 shadow-lg shadow-green-100',
                // Wrong answers (if revealed and not correct)
                revealedAnswer !== null && revealedAnswer !== index && 'opacity-60'
              )}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full',
                    'bg-slate-100 text-slate-700 font-semibold text-sm',
                    highlightedOption === index && 'bg-blue-200 text-blue-800',
                    revealedAnswer === index && 'bg-green-200 text-green-800'
                  )}
                >
                  {getOptionLabel(index)}
                </span>
                <span
                  className={cn(
                    'text-slate-800 font-medium',
                    revealedAnswer === index && 'text-green-800 font-semibold'
                  )}
                >
                  {option}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}