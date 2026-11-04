import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn, getOptionLabel } from '@/lib/utils'
import { ParticipantSubmission, QuizQuestion, RevealState } from '@/types/quiz'
import { EmptyState } from '@/components/ui/EmptyState'

interface QuestionBreakdownProps {
  questions: QuizQuestion[]
  submissions: ParticipantSubmission[]
  revealedQuestions?: RevealState[]
  className?: string
}

interface QuestionStats {
  index: number
  question: QuizQuestion
  answered: number
  correct: number
  rate: number
  distribution: number[]
  revealed: boolean | null
}

/** Derive per-question stats from the submissions already on hand. */
export function computeQuestionStats(
  questions: QuizQuestion[],
  submissions: ParticipantSubmission[],
  revealedQuestions?: RevealState[]
): QuestionStats[] {
  return questions.map((question, index) => {
    const distribution = question.options.map(() => 0)
    let answered = 0
    let correct = 0
    for (const sub of submissions) {
      const ans = sub.answers.find((a) => a.questionIndex === index)
      if (!ans || ans.selectedOption < 0) continue
      answered += 1
      if (ans.selectedOption < distribution.length) distribution[ans.selectedOption] += 1
      if (ans.selectedOption === question.correct) correct += 1
    }
    const base = submissions.length
    const reveal = revealedQuestions?.find((r) => r.questionIndex === index)
    return {
      index,
      question,
      answered,
      correct,
      rate: base > 0 ? Math.round((correct / base) * 100) : 0,
      distribution,
      revealed: revealedQuestions ? Boolean(reveal?.isRevealed) : null,
    }
  })
}

function rateTone(rate: number) {
  if (rate >= 70) return 'text-success'
  if (rate >= 40) return 'text-warning'
  return 'text-destructive'
}

function rateBar(rate: number) {
  if (rate >= 70) return 'bg-success'
  if (rate >= 40) return 'bg-warning'
  return 'bg-destructive'
}

/** Per-question analytics: correct-answer rate + option distribution bars. */
export function QuestionBreakdown({ questions, submissions, revealedQuestions, className }: QuestionBreakdownProps) {
  const stats = React.useMemo(
    () => computeQuestionStats(questions, submissions, revealedQuestions),
    [questions, submissions, revealedQuestions]
  )

  if (questions.length === 0) {
    return <EmptyState compact title="No questions" description="This quiz has no questions to analyze." />
  }

  const total = submissions.length

  return (
    <div className={cn('divide-y divide-border', className)}>
      {stats.map((s) => (
        <article key={s.index} className="py-5 first:pt-0 last:pb-0">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted font-display text-xs font-bold text-muted-foreground tabular">
              {s.index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <h4 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
                  {s.question.text}
                </h4>
                <div className="flex items-center gap-2">
                  {s.revealed !== null && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                        s.revealed ? 'border-success/30 bg-success/10 text-success' : 'border-border text-muted-foreground'
                      )}
                    >
                      {s.revealed ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {s.revealed ? 'Revealed' : 'Hidden'}
                    </span>
                  )}
                  <span className={cn('font-display text-lg font-bold tabular', rateTone(s.rate))}>{s.rate}%</span>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full origin-left rounded-full animate-bar-grow', rateBar(s.rate))}
                    style={{ transform: `scaleX(${s.rate / 100})` }}
                  />
                </div>
                <span className="shrink-0 text-xs text-muted-foreground tabular">
                  {s.correct}/{total} correct
                </span>
              </div>

              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {s.question.options.map((opt, oi) => {
                  const n = s.distribution[oi] ?? 0
                  const pct = total > 0 ? Math.round((n / total) * 100) : 0
                  const isCorrect = oi === s.question.correct
                  return (
                    <li key={oi} className="relative overflow-hidden rounded-md border border-border bg-surface px-2.5 py-1.5">
                      <div
                        aria-hidden="true"
                        className={cn('absolute inset-y-0 left-0 origin-left rounded-r-sm', isCorrect ? 'bg-success/15' : 'bg-muted-foreground/10')}
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex items-center gap-2 text-xs">
                        <span
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded font-bold',
                            isCorrect ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {getOptionLabel(oi)}
                        </span>
                        <span className={cn('min-w-0 flex-1 truncate', isCorrect ? 'font-semibold text-foreground' : 'text-foreground/85')} title={opt}>
                          {opt}
                        </span>
                        <span className="shrink-0 tabular text-muted-foreground">
                          {n} · {pct}%
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
