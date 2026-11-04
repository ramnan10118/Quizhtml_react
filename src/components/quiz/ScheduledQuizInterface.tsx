import * as React from 'react'
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock, Eye, EyeOff, HelpCircle, Megaphone, Send, Trophy, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Progress, cn } from '@/components/ui'
import { QuizQuestion, ParticipantAnswer, LeaderboardEntry, RevealState } from '@/types/quiz'
import { getOptionLabel } from '@/lib/utils'
import { AnswerOption, type AnswerOptionState } from './AnswerOption'
import { Leaderboard } from './Leaderboard'

const { useState, useEffect } = React

interface ScheduledQuizInterfaceProps {
  questions: QuizQuestion[]
  participantName: string
  onSubmitAnswers: (answers: ParticipantAnswer[]) => void
  revealedQuestions?: RevealState[]
  leaderboard?: LeaderboardEntry[]
  leaderboardVisible?: boolean
  announcements?: Array<{ message: string; timestamp: number }>
  isSubmitted?: boolean
  className?: string
}

type ViewMode = 'quiz' | 'waiting' | 'results'

export function ScheduledQuizInterface({
  questions,
  participantName,
  onSubmitAnswers,
  revealedQuestions = [],
  leaderboard = [],
  leaderboardVisible = false,
  announcements = [],
  isSubmitted = false,
  className
}: ScheduledQuizInterfaceProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('quiz')
  const [answers, setAnswers] = useState<ParticipantAnswer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-switch to results view when questions are revealed
  useEffect(() => {
    if (isSubmitted && revealedQuestions.some(r => r.isRevealed)) {
      setCurrentView('results')
    } else if (isSubmitted) {
      setCurrentView('waiting')
    }
  }, [isSubmitted, revealedQuestions])

  const handleAnswer = (selectedOption: number) => {
    const newAnswer: ParticipantAnswer = {
      questionIndex: currentQuestionIndex,
      selectedOption,
      timestamp: Date.now()
    }

    setAnswers(prev => [
      ...prev.filter(a => a.questionIndex !== currentQuestionIndex),
      newAnswer
    ])
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    // Fill in missing answers with -1
    const completeAnswers: ParticipantAnswer[] = questions.map((_, index) => {
      const existingAnswer = answers.find(a => a.questionIndex === index)
      return existingAnswer || {
        questionIndex: index,
        selectedOption: -1,
        timestamp: Date.now()
      }
    })

    try {
      onSubmitAnswers(completeAnswers)
      setCurrentView('waiting')
    } catch (error) {
      console.error('Failed to submit answers:', error)
      setIsSubmitting(false)
    }
  }

  const getCurrentAnswer = () => {
    return answers.find(a => a.questionIndex === currentQuestionIndex)?.selectedOption
  }

  const getAnsweredCount = () => {
    return answers.length
  }

  const getRevealedCount = () => {
    return revealedQuestions.filter(r => r.isRevealed).length
  }

  const announcementsCard = announcements.length > 0 && (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="h-4 w-4 text-primary" /> Announcements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {announcements.slice(-3).map((announcement, index) => (
          <div key={index} className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm animate-fade-up">
            <p className="text-foreground">{announcement.message}</p>
            <p className="mt-1 text-[11px] text-muted-foreground tabular">
              {new Date(announcement.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )

  if (currentView === 'waiting') {
    return (
      <div className={cn('w-full max-w-2xl mx-auto space-y-4 animate-fade-up', className)}>
        <Card className="stage-bg text-center">
          <CardHeader className="items-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl">Answers submitted</CardTitle>
            <CardDescription>
              Sit tight. The host will reveal results when they are ready.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground tabular">
              You answered {getAnsweredCount()} of {questions.length} questions
            </p>

            {getRevealedCount() > 0 ? (
              <div className="flex flex-col items-center gap-3">
                <Badge variant="success">
                  <Eye /> {getRevealedCount()} question{getRevealedCount() === 1 ? '' : 's'} revealed
                </Badge>
                <Button onClick={() => setCurrentView('results')}>View results</Button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 animate-pulse-slow" /> Waiting for the host
              </div>
            )}
          </CardContent>
        </Card>

        {announcementsCard}
      </div>
    )
  }

  if (currentView === 'results') {
    return (
      <div className={cn('w-full max-w-4xl mx-auto space-y-4 animate-fade-up', className)}>
        {/* Leaderboard */}
        {leaderboardVisible && leaderboard.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Leaderboard
                highlightName={participantName}
                rows={leaderboard.map((entry) => ({
                  rank: entry.rank,
                  name: entry.participantName,
                  score: entry.score,
                  percentage: Math.round((entry.score / entry.questionsRevealed) * 100),
                  meta: `${entry.questionsRevealed} revealed`,
                }))}
              />
            </CardContent>
          </Card>
        )}

        {/* Revealed Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Question results</CardTitle>
            <CardDescription className="tabular">
              {getRevealedCount()} of {questions.length} questions revealed
            </CardDescription>
            <Progress value={getRevealedCount()} max={questions.length} tone="success" className="mt-2" />
          </CardHeader>

          <CardContent className="divide-y divide-border">
            {questions.map((question, questionIndex) => {
              // Safety check for undefined question
              if (!question) {
                return null;
              }

              const revealInfo = revealedQuestions.find(r => r.questionIndex === questionIndex)
              const isRevealed = revealInfo?.isRevealed || false
              const userAnswer = answers.find(a => a.questionIndex === questionIndex)
              const selectedOption = userAnswer?.selectedOption || -1

              if (!isRevealed) {
                return (
                  <div key={questionIndex} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <EyeOff className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Question {questionIndex + 1} · not revealed yet
                    </span>
                  </div>
                )
              }

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
                    <h3 className="text-sm font-semibold leading-snug text-foreground">
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
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {announcementsCard}

        <div className="text-center">
          <Button variant="ghost" onClick={() => setCurrentView('waiting')}>
            <ArrowLeft /> Back to waiting room
          </Button>
        </div>
      </div>
    )
  }

  // Quiz View
  const currentQuestion = questions[currentQuestionIndex]

  // Handle case where questions haven't loaded yet or currentQuestion is undefined
  if (!currentQuestion) {
    return (
      <div className={cn('w-full max-w-4xl mx-auto space-y-6', className)}>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-display text-base font-semibold text-foreground">Loading quiz</p>
            <p className="mt-1 text-sm text-muted-foreground">Waiting for questions from the host…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-4', className)}>
      {/* Progress Header */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground tabular">
            Question {currentQuestionIndex + 1} <span className="font-medium text-muted-foreground">of {questions.length}</span>
          </span>
          <Badge variant="secondary" className="tabular">{getAnsweredCount()} answered</Badge>
        </div>
        <Progress value={currentQuestionIndex + 1} max={questions.length} label="Question progress" />
      </div>

      {/* Question */}
      <Card className="stage-bg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl leading-snug sm:text-2xl">
            {currentQuestion.text}
          </CardTitle>
          <CardDescription>Tap an option to select your answer. You can change it before submitting.</CardDescription>
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
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          aria-label="Previous question"
        >
          <ChevronLeft /> <span className="hidden sm:inline">Previous</span>
        </Button>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="min-w-[150px]">
            <Send /> {isSubmitting ? 'Submitting…' : 'Submit answers'}
          </Button>
        ) : (
          <Button
            size="lg"
            variant="secondary"
            className="min-w-[120px]"
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
          >
            Next <ChevronRight />
          </Button>
        )}
      </div>
    </div>
  )
}
