import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from '@/components/ui'
import { QuizQuestion, ParticipantSubmission, QuizMode } from '@/types/quiz'
import { getOptionLabel } from '@/lib/utils'
import confetti from 'canvas-confetti'

const { useEffect } = React

interface QuizResultsDisplayProps {
  submission: ParticipantSubmission
  questions: QuizQuestion[]
  mode: QuizMode
  showCorrectAnswers?: boolean
  passingScore?: number
  onRetake?: () => void
  className?: string
}

export function QuizResultsDisplay({
  submission,
  questions,
  mode,
  showCorrectAnswers = true,
  passingScore,
  onRetake,
  className
}: QuizResultsDisplayProps) {
  const score = submission.score || 0
  const totalQuestions = questions.length
  const percentage = Math.round((score / totalQuestions) * 100)
  const isPassed = passingScore ? percentage >= passingScore : true

  // Trigger celebration for good scores
  useEffect(() => {
    if (percentage >= 80) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [percentage])

  const getScoreColor = () => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400'
    if (percentage >= 70) return 'text-blue-600 dark:text-blue-400'
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreStatus = () => {
    if (percentage >= 90) return { label: 'Excellent!', icon: '🏆' }
    if (percentage >= 80) return { label: 'Great Job!', icon: '🎉' }
    if (percentage >= 70) return { label: 'Well Done!', icon: '👏' }
    if (percentage >= 50) return { label: 'Not Bad!', icon: '👍' }
    return { label: 'Keep Trying!', icon: '💪' }
  }

  const status = getScoreStatus()

  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-6', className)}>
      {/* Main Results Card */}
      <Card className="text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4">
            <span className="text-6xl" role="img" aria-label="Result">
              {status.icon}
            </span>
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            {status.label}
          </CardTitle>
          <p className="text-muted-foreground">
            Quiz completed by {submission.participantName}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="space-y-2">
            <div className={cn('text-4xl md:text-5xl font-bold', getScoreColor())}>
              {score}/{totalQuestions}
            </div>
            <div className={cn('text-xl font-semibold', getScoreColor())}>
              {percentage}%
            </div>
            
            {passingScore && (
              <Badge 
                variant={isPassed ? "default" : "destructive"}
                className="mt-2"
              >
                {isPassed ? `Passed (${passingScore}% required)` : `Failed (${passingScore}% required)`}
              </Badge>
            )}
          </div>

          {/* Completion Time */}
          <div className="text-sm text-muted-foreground">
            Completed on {new Date(submission.submissionTime).toLocaleString()}
          </div>

          {/* Retake Button */}
          {onRetake && (
            <Button onClick={onRetake} variant="outline">
              Take Quiz Again
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Detailed Results */}
      {showCorrectAnswers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📋</span>
              <span>Question Review</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {questions.map((question, questionIndex) => {
              const userAnswer = submission.answers.find(a => a.questionIndex === questionIndex)
              const selectedOption = userAnswer?.selectedOption || -1
              const isCorrect = selectedOption === question.correct
              const wasAnswered = selectedOption !== -1

              return (
                <div key={questionIndex} className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold flex-shrink-0',
                      isCorrect 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : wasAnswered
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    )}>
                      {isCorrect ? '✓' : wasAnswered ? '✗' : '?'}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-2">
                        {questionIndex + 1}. {question.text}
                      </h3>
                      
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const isSelected = selectedOption === optionIndex
                          const isCorrectOption = optionIndex === question.correct
                          
                          let optionStyle = 'border-border bg-background'
                          
                          if (isCorrectOption) {
                            optionStyle = 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          } else if (isSelected && !isCorrect) {
                            optionStyle = 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          }

                          return (
                            <div
                              key={optionIndex}
                              className={cn(
                                'p-3 rounded-lg border-2',
                                optionStyle
                              )}
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-semibold text-muted-foreground">
                                  {getOptionLabel(optionIndex)}
                                </span>
                                <span className="flex-1 text-sm">
                                  {option}
                                </span>
                                <div className="flex items-center space-x-1">
                                  {isSelected && (
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs"
                                    >
                                      Your Answer
                                    </Badge>
                                  )}
                                  {isCorrectOption && (
                                    <Badge 
                                      variant="default" 
                                      className="text-xs bg-green-600"
                                    >
                                      Correct
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      {!wasAnswered && (
                        <p className="text-sm text-muted-foreground mt-2">
                          No answer provided
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {submission.answers.filter((a, i) => a.selectedOption === questions[i]?.correct).length}
              </div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                {submission.answers.filter((a, i) => a.selectedOption !== -1 && a.selectedOption !== questions[i]?.correct).length}
              </div>
              <div className="text-xs text-muted-foreground">Incorrect</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                {submission.answers.filter(a => a.selectedOption === -1).length}
              </div>
              <div className="text-xs text-muted-foreground">Skipped</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-primary">
                {percentage}%
              </div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}