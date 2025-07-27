import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, cn } from '@/components/ui'
import { QuizQuestion, ParticipantAnswer } from '@/types/quiz'
import { getOptionLabel } from '@/lib/utils'

const { useState, useEffect } = React

interface BasicQuizInterfaceProps {
  questions: QuizQuestion[]
  participantName: string
  onComplete: (answers: ParticipantAnswer[]) => void
  timeLimit?: number
  className?: string
}

interface QuizProgress {
  currentQuestionIndex: number
  answers: ParticipantAnswer[]
  timeRemaining?: number
}

export function BasicQuizInterface({
  questions,
  participantName,
  onComplete,
  timeLimit,
  className
}: BasicQuizInterfaceProps) {
  const [progress, setProgress] = useState<QuizProgress>({
    currentQuestionIndex: 0,
    answers: [],
    timeRemaining: timeLimit
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  // Timer effect
  useEffect(() => {
    if (!timeLimit || progress.timeRemaining === undefined || progress.timeRemaining <= 0) return

    const timer = setInterval(() => {
      setProgress(prev => {
        const newTimeRemaining = (prev.timeRemaining || 0) - 1
        if (newTimeRemaining <= 0) {
          handleSubmit()
          return prev
        }
        return { ...prev, timeRemaining: newTimeRemaining }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [progress.timeRemaining, timeLimit])

  // Save progress to localStorage
  useEffect(() => {
    const saveKey = `quiz-progress-${participantName}`
    localStorage.setItem(saveKey, JSON.stringify(progress))
  }, [progress, participantName])

  // Load progress from localStorage on mount
  useEffect(() => {
    const saveKey = `quiz-progress-${participantName}`
    const saved = localStorage.getItem(saveKey)
    if (saved) {
      try {
        const savedProgress = JSON.parse(saved)
        setProgress(savedProgress)
      } catch (error) {
        console.warn('Failed to load saved progress:', error)
      }
    }
  }, [participantName])

  const currentQuestion = questions[progress.currentQuestionIndex]
  const isLastQuestion = progress.currentQuestionIndex === questions.length - 1
  const hasAnsweredCurrent = progress.answers.some(a => a.questionIndex === progress.currentQuestionIndex)

  const handleAnswer = (selectedOption: number) => {
    const newAnswer: ParticipantAnswer = {
      questionIndex: progress.currentQuestionIndex,
      selectedOption,
      timestamp: Date.now()
    }

    setProgress(prev => ({
      ...prev,
      answers: [
        ...prev.answers.filter(a => a.questionIndex !== progress.currentQuestionIndex),
        newAnswer
      ]
    }))
  }

  const handleNext = () => {
    if (progress.currentQuestionIndex < questions.length - 1) {
      setProgress(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }))
    }
  }

  const handlePrevious = () => {
    if (progress.currentQuestionIndex > 0) {
      setProgress(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }))
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    // Fill in any missing answers with -1 (no answer)
    const completeAnswers: ParticipantAnswer[] = questions.map((_, index) => {
      const existingAnswer = progress.answers.find(a => a.questionIndex === index)
      return existingAnswer || {
        questionIndex: index,
        selectedOption: -1,
        timestamp: Date.now()
      }
    })

    try {
      // Calculate score locally
      const score = completeAnswers.filter((answer, index) => 
        answer.selectedOption === questions[index]?.correct
      ).length
      setFinalScore(score)
      
      onComplete(completeAnswers)
      // Clear saved progress
      const saveKey = `quiz-progress-${participantName}`
      localStorage.removeItem(saveKey)
      setIsCompleted(true)
    } catch (error) {
      console.error('Failed to submit quiz:', error)
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCurrentAnswer = () => {
    return progress.answers.find(a => a.questionIndex === progress.currentQuestionIndex)?.selectedOption
  }

  const getProgressPercentage = () => {
    return (progress.answers.length / questions.length) * 100
  }

  // Show completion state with results
  if (isCompleted) {
    const percentage = Math.round((finalScore / questions.length) * 100)
    const completeAnswers = questions.map((_, index) => {
      const existingAnswer = progress.answers.find(a => a.questionIndex === index)
      return existingAnswer || {
        questionIndex: index,
        selectedOption: -1,
        timestamp: Date.now()
      }
    })

    return (
      <div className={cn('w-full max-w-4xl mx-auto space-y-6', className)}>
        {/* Score Summary */}
        <Card className="text-center">
          <CardContent className="p-8 space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-primary">Quiz Completed!</h2>
            <div className="text-4xl font-bold text-primary">{finalScore}/{questions.length}</div>
            <div className="text-xl text-muted-foreground">{percentage}% Correct</div>
            <p className="text-muted-foreground">
              Great job, {participantName}! Here are your results:
            </p>
          </CardContent>
        </Card>

        {/* Question Results */}
        <Card>
          <CardHeader>
            <CardTitle>Your Answers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = completeAnswers[index]
              const isCorrect = userAnswer.selectedOption === question.correct
              const wasAnswered = userAnswer.selectedOption !== -1
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm">Question {index + 1}</h3>
                    <div className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      isCorrect ? "bg-green-100 text-green-800" : 
                      wasAnswered ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
                    )}>
                      {isCorrect ? "Correct" : wasAnswered ? "Incorrect" : "Not Answered"}
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3">{question.text}</p>
                  
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isUserChoice = userAnswer.selectedOption === optionIndex
                      const isCorrectAnswer = question.correct === optionIndex
                      
                      return (
                        <div
                          key={optionIndex}
                          className={cn(
                            "p-2 rounded text-xs border",
                            isCorrectAnswer ? "bg-green-50 border-green-200 text-green-800" :
                            isUserChoice ? "bg-red-50 border-red-200 text-red-800" :
                            "bg-gray-50 border-gray-200"
                          )}
                        >
                          <span className="font-medium">
                            {String.fromCharCode(65 + optionIndex)}. 
                          </span>
                          {option}
                          {isCorrectAnswer && <span className="ml-2">✓ Correct</span>}
                          {isUserChoice && !isCorrectAnswer && <span className="ml-2">✗ Your Answer</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <Card className={cn('w-full max-w-4xl mx-auto', className)}>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading quiz...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-6', className)}>
      {/* Header with progress and timer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-muted-foreground">
                Question {progress.currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="w-48 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
            
            {timeLimit && progress.timeRemaining !== undefined && (
              <div className={cn(
                "text-sm font-mono",
                progress.timeRemaining < 60 ? "text-destructive" : "text-muted-foreground"
              )}>
                ⏱️ {formatTime(progress.timeRemaining)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl leading-tight">
            {currentQuestion.text}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = getCurrentAnswer() === index
            
            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all duration-200',
                  'hover:bg-accent hover:border-accent-foreground/20',
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-background'
                )}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {getOptionLabel(index)}
                  </span>
                  <span className="flex-1 text-sm md:text-base">
                    {option}
                  </span>
                  {isSelected && (
                    <span className="text-primary">✓</span>
                  )}
                </div>
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={progress.currentQuestionIndex === 0}
            >
              ← Previous
            </Button>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{progress.answers.length} answered</span>
              <span>•</span>
              <span>{questions.length - progress.answers.length} remaining</span>
            </div>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={progress.currentQuestionIndex >= questions.length - 1}
              >
                Next →
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile progress indicator */}
      <div className="sm:hidden text-center text-xs text-muted-foreground">
        Tap an option to select your answer
      </div>
    </div>
  )
}