import * as React from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, HelpCircle, Send, Timer, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Progress, StatTile, cn } from '@/components/ui'
import { QuizQuestion, ParticipantAnswer } from '@/types/quiz'
import { getOptionLabel } from '@/lib/utils'
import { AnswerOption, type AnswerOptionState } from './AnswerOption'

const { useState, useEffect, useCallback } = React

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

  const handleSubmit = useCallback(async () => {
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
  }, [isSubmitting, questions, progress.answers, onComplete, participantName])

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
  }, [progress.timeRemaining, timeLimit, handleSubmit])

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
    const incorrect = completeAnswers.filter((a, i) => a.selectedOption !== -1 && a.selectedOption !== questions[i].correct).length
    const skipped = completeAnswers.filter(a => a.selectedOption === -1).length

    return (
      <div className={cn('w-full max-w-4xl mx-auto space-y-5 animate-fade-up', className)}>
        {/* Score Summary */}
        <Card className="stage-bg">
          <CardContent className="p-6 text-center sm:p-8">
            <p className="eyebrow">Quiz complete</p>
            <div className="mt-3 font-display text-5xl font-bold tabular text-foreground sm:text-6xl">
              {finalScore}<span className="text-2xl text-muted-foreground sm:text-3xl">/{questions.length}</span>
            </div>
            <p className={cn('mt-2 font-display text-xl font-semibold', percentage >= 70 ? 'text-success' : percentage >= 50 ? 'text-warning' : 'text-destructive')}>
              {percentage}% correct
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Nice work, {participantName}. Here is how you did.</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Correct" value={finalScore} tone="success" icon={<CheckCircle2 />} />
          <StatTile label="Incorrect" value={incorrect} tone="destructive" icon={<XCircle />} />
          <StatTile label="Skipped" value={skipped} icon={<HelpCircle />} />
        </div>

        {/* Question Results */}
        <Card>
          <CardHeader>
            <CardTitle>Your answers</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {questions.map((question, index) => {
              const userAnswer = completeAnswers[index]
              const isCorrect = userAnswer.selectedOption === question.correct
              const wasAnswered = userAnswer.selectedOption !== -1

              return (
                <div key={index} className="py-5 first:pt-0 last:pb-0">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold leading-snug text-foreground">
                      <span className="text-muted-foreground tabular">{index + 1}.</span> {question.text}
                    </h3>
                    <Badge variant={isCorrect ? 'success' : wasAnswered ? 'destructive' : 'secondary'}>
                      {isCorrect ? 'Correct' : wasAnswered ? 'Incorrect' : 'Skipped'}
                    </Badge>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => {
                      const isUserChoice = userAnswer.selectedOption === optionIndex
                      const isCorrectAnswer = question.correct === optionIndex
                      let state: AnswerOptionState = 'default'
                      if (isCorrectAnswer) state = 'correct'
                      else if (isUserChoice) state = 'wrong'

                      return (
                        <AnswerOption
                          key={optionIndex}
                          label={getOptionLabel(optionIndex)}
                          text={option}
                          state={state}
                          trailing={isUserChoice && !isCorrectAnswer ? <Badge variant="secondary">Yours</Badge> : undefined}
                        />
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
          <p className="text-sm text-muted-foreground">Loading quiz...</p>
        </CardContent>
      </Card>
    )
  }

  const timerLow = typeof progress.timeRemaining === 'number' && progress.timeRemaining < 60

  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-4', className)}>
      {/* Header with progress and timer */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground tabular">
              Question {progress.currentQuestionIndex + 1} <span className="font-medium text-muted-foreground">of {questions.length}</span>
            </span>
            <span className="text-muted-foreground tabular">{progress.answers.length} answered</span>
          </div>
          <Progress value={getProgressPercentage()} label="Answered progress" />
        </div>
        {timeLimit && progress.timeRemaining !== undefined && (
          <div
            className={cn(
              'flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 font-mono text-sm font-semibold tabular',
              timerLow ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-border bg-card text-foreground'
            )}
            aria-live={timerLow ? 'polite' : 'off'}
          >
            <Timer className="h-4 w-4" />
            {formatTime(progress.timeRemaining)}
          </div>
        )}
      </div>

      {/* Question Card */}
      <Card className="stage-bg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl leading-snug sm:text-2xl">
            {currentQuestion.text}
          </CardTitle>
          <CardDescription>Tap an option to select your answer.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-2.5">
          {currentQuestion.options.map((option, index) => {
            const isSelected = getCurrentAnswer() === index

            return (
              <AnswerOption
                key={index}
                size="lg"
                label={getOptionLabel(index)}
                text={option}
                state={isSelected ? 'selected' : 'default'}
                onSelect={() => handleAnswer(index)}
                trailing={isSelected ? <CheckCircle2 className="h-5 w-5 text-primary" /> : undefined}
              />
            )
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={handlePrevious}
          disabled={progress.currentQuestionIndex === 0}
          aria-label="Previous question"
        >
          <ChevronLeft /> <span className="hidden sm:inline">Previous</span>
        </Button>

        <span className="hidden text-xs text-muted-foreground tabular sm:inline">
          {questions.length - progress.answers.length} remaining
        </span>

        {isLastQuestion ? (
          <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="min-w-[140px]">
            <Send /> {isSubmitting ? 'Submitting…' : 'Submit quiz'}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={progress.currentQuestionIndex >= questions.length - 1}
            size="lg"
            variant="secondary"
            className="min-w-[120px]"
          >
            Next <ChevronRight />
          </Button>
        )}
      </div>
    </div>
  )
}
