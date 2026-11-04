import * as React from 'react'
import { CheckCircle2, HelpCircle, ListChecks, RotateCcw, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, StatTile, cn } from '@/components/ui'
import { QuizQuestion, ParticipantSubmission, QuizMode } from '@/types/quiz'
import { getOptionLabel } from '@/lib/utils'
import { AnswerOption, type AnswerOptionState } from './AnswerOption'
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

/** Circular score meter. */
function ScoreRing({ percentage, className }: { percentage: number; className?: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  const offset = c - (Math.max(0, Math.min(100, percentage)) / 100) * c
  return (
    <svg viewBox="0 0 120 120" className={cn('h-36 w-36', className)} role="img" aria-label={`${percentage} percent`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
      <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className="fill-foreground font-display text-[26px] font-bold tabular">
        {percentage}%
      </text>
    </svg>
  )
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
    if (percentage >= 90) return 'text-success'
    if (percentage >= 70) return 'text-info'
    if (percentage >= 50) return 'text-warning'
    return 'text-destructive'
  }

  const getScoreStatus = () => {
    if (percentage >= 90) return { label: 'Excellent' }
    if (percentage >= 80) return { label: 'Great job' }
    if (percentage >= 70) return { label: 'Well done' }
    if (percentage >= 50) return { label: 'Not bad' }
    return { label: 'Keep practising' }
  }

  const status = getScoreStatus()
  const correctCount = submission.answers.filter((a, i) => a.selectedOption === questions[i]?.correct).length
  const incorrectCount = submission.answers.filter((a, i) => a.selectedOption !== -1 && a.selectedOption !== questions[i]?.correct).length
  const skippedCount = submission.answers.filter(a => a.selectedOption === -1).length

  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-5', className)}>
      {/* Main Results Card */}
      <Card className="stage-bg overflow-hidden">
        <CardContent className="flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:text-left sm:p-8">
          <ScoreRing percentage={percentage} className={getScoreColor()} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{mode === 'basic' ? 'Self-paced quiz' : 'Quiz'} · results</p>
            <h2 className="mt-1 font-display text-3xl font-bold text-foreground">{status.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {submission.participantName} scored{' '}
              <span className={cn('font-semibold tabular', getScoreColor())}>{score}/{totalQuestions}</span>
              {' · '}completed {new Date(submission.submissionTime).toLocaleString()}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {passingScore && (
                <Badge variant={isPassed ? 'success' : 'destructive'}>
                  {isPassed ? `Passed · ${passingScore}% required` : `Below pass mark · ${passingScore}% required`}
                </Badge>
              )}
              {onRetake && (
                <Button onClick={onRetake} variant="outline" size="sm">
                  <RotateCcw /> Take quiz again
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Correct" value={correctCount} tone="success" icon={<CheckCircle2 />} />
        <StatTile label="Incorrect" value={incorrectCount} tone="destructive" icon={<XCircle />} />
        <StatTile label="Skipped" value={skippedCount} icon={<HelpCircle />} />
        <StatTile label="Score" value={`${percentage}%`} tone="primary" icon={<ListChecks />} />
      </div>

      {/* Detailed Results */}
      {showCorrectAnswers && (
        <Card>
          <CardHeader>
            <CardTitle>Question review</CardTitle>
            <CardDescription>Your answer against the correct one for every question.</CardDescription>
          </CardHeader>

          <CardContent className="divide-y divide-border">
            {questions.map((question, questionIndex) => {
              const userAnswer = submission.answers.find(a => a.questionIndex === questionIndex)
              const selectedOption = userAnswer?.selectedOption || -1
              const isCorrect = selectedOption === question.correct
              const wasAnswered = selectedOption !== -1

              return (
                <div key={questionIndex} className="flex items-start gap-3 py-5 first:pt-0 last:pb-0">
                  <div className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md [&_svg]:size-4',
                    isCorrect
                      ? 'bg-success/15 text-success'
                      : wasAnswered
                      ? 'bg-destructive/15 text-destructive'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {isCorrect ? <CheckCircle2 /> : wasAnswered ? <XCircle /> : <HelpCircle />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
                      <span className="text-muted-foreground tabular">{questionIndex + 1}.</span> {question.text}
                    </h3>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = selectedOption === optionIndex
                        const isCorrectOption = optionIndex === question.correct
                        let state: AnswerOptionState = 'default'
                        if (isCorrectOption) state = 'correct'
                        else if (isSelected && !isCorrect) state = 'wrong'

                        return (
                          <AnswerOption
                            key={optionIndex}
                            label={getOptionLabel(optionIndex)}
                            text={option}
                            state={state}
                            trailing={
                              <>
                                {isSelected && <Badge variant="secondary">Yours</Badge>}
                                {isCorrectOption && <Badge variant="success">Correct</Badge>}
                              </>
                            }
                          />
                        )
                      })}
                    </div>

                    {!wasAnswered && (
                      <p className="mt-2 text-xs text-muted-foreground">No answer provided</p>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
