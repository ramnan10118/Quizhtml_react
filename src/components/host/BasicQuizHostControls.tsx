import * as React from 'react'
import { Check, CheckCircle2, Clock, Copy, Gauge, Link2, ListChecks, RefreshCw, SlidersHorizontal, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Input, Label, StatTile, cn } from '@/components/ui'
import { ParticipantSubmission, QuizSettings } from '@/types/quiz'

const { useState } = React

interface BasicQuizHostControlsProps {
  submissions: ParticipantSubmission[]
  settings: QuizSettings
  participantCount: number
  onSettingsUpdate: (settings: Partial<QuizSettings>) => void
  onRefreshData: () => void
  className?: string
}

export function BasicQuizHostControls({
  submissions,
  settings,
  participantCount,
  onSettingsUpdate,
  onRefreshData,
  className
}: BasicQuizHostControlsProps) {
  const [copied, setCopied] = useState(false)
  const completedSubmissions = submissions.filter(s => s.isComplete)
  const inProgressCount = participantCount - completedSubmissions.length

  const averageScore = completedSubmissions.length > 0
    ? Math.round(completedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSubmissions.length)
    : 0

  const passedCount = settings.passingScore
    ? completedSubmissions.filter(s => ((s.score || 0) / submissions[0]?.answers.length || 1) * 100 >= settings.passingScore!).length
    : 0

  const joinLink = typeof window !== 'undefined' ? window.location.href.replace('/host', '/join') : ''

  return (
    <div className={cn('space-y-5', className)}>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Completed" value={completedSubmissions.length} tone="primary" icon={<CheckCircle2 />} />
        <StatTile label="In progress" value={inProgressCount} tone="warning" icon={<Clock />} />
        <StatTile label="Avg score" value={`${averageScore}%`} tone="success" icon={<Gauge />} />
        {settings.passingScore ? (
          <StatTile label="Passed" value={passedCount} tone="info" icon={<Trophy />} hint={`${settings.passingScore}% to pass`} />
        ) : (
          <StatTile label="Participants" value={participantCount} icon={<ListChecks />} />
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Quiz controls
            </CardTitle>
            <CardDescription>Live status and rules for this self-paced quiz</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefreshData}>
            <RefreshCw /> Refresh
          </Button>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Real-time Status */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Quiz status</p>
              <p className="text-sm text-muted-foreground">
                {inProgressCount > 0
                  ? `${inProgressCount} participant${inProgressCount === 1 ? '' : 's'} still taking the quiz`
                  : 'All participants have completed the quiz'
                }
              </p>
            </div>
            <Badge variant={inProgressCount > 0 ? 'warning' : 'success'}>
              {inProgressCount > 0 ? 'Active' : 'Complete'}
            </Badge>
          </div>

          {/* Settings Panel */}
          <div className="space-y-4">
            <h4 className="eyebrow">Rules</h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Time Limit */}
              <div className="space-y-2">
                <Label htmlFor="basic-time-limit">Time limit (minutes)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="basic-time-limit"
                    type="number"
                    min="1"
                    max="120"
                    value={settings.timeLimit ? Math.floor(settings.timeLimit / 60) : 0}
                    onChange={(e) => onSettingsUpdate({
                      timeLimit: parseInt(e.target.value) * 60
                    })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    {settings.timeLimit ? `${Math.floor(settings.timeLimit / 60)} min` : 'No limit'}
                  </span>
                </div>
              </div>

              {/* Passing Score */}
              <div className="space-y-2">
                <Label htmlFor="basic-passing-score">Passing score (%)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="basic-passing-score"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.passingScore || 0}
                    onChange={(e) => onSettingsUpdate({
                      passingScore: parseInt(e.target.value) || undefined
                    })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/50">
                <input
                  type="checkbox"
                  checked={settings.allowRetakes || false}
                  onChange={(e) => onSettingsUpdate({ allowRetakes: e.target.checked })}
                />
                <span>Allow retakes</span>
              </label>

              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/50">
                <input
                  type="checkbox"
                  checked={settings.showCorrectAnswers !== false}
                  onChange={(e) => onSettingsUpdate({ showCorrectAnswers: e.target.checked })}
                />
                <span>Show correct answers in results</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Completions */}
      {completedSubmissions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" /> Recent completions
            </CardTitle>
          </CardHeader>

          <CardContent>
            <ul className="divide-y divide-border">
              {completedSubmissions
                .sort((a, b) => b.submissionTime - a.submissionTime)
                .slice(0, 5)
                .map((submission, index) => {
                  const score = submission.score || 0
                  const totalQuestions = submission.answers.length
                  const percentage = Math.round((score / totalQuestions) * 100)
                  const isPassed = settings.passingScore ? percentage >= settings.passingScore : true

                  return (
                    <li key={index} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          isPassed ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                        )}>
                          {isPassed ? <Check className="h-4 w-4" /> : '✕'}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">{submission.participantName}</div>
                          <div className="text-xs text-muted-foreground tabular">
                            {new Date(submission.submissionTime).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-base font-bold tabular text-foreground">{score}/{totalQuestions}</div>
                        <div className="text-[11px] text-muted-foreground tabular">{percentage}%</div>
                      </div>
                    </li>
                  )
                })}
            </ul>

            {completedSubmissions.length > 5 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                And {completedSubmissions.length - 5} more submissions
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Share Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" /> Share quiz
          </CardTitle>
          <CardDescription>Participants open this link to take the quiz.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={window.location.href.replace('/host', '/join')}
              readOnly
              aria-label="Join link"
              className="h-10 min-w-0 flex-1 rounded-md border border-input bg-surface-raised px-3 font-mono text-xs text-foreground focus-ring"
            />
            <Button
              size="sm"
              variant={copied ? 'success' : 'default'}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href.replace('/host', '/join'))
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? <Check /> : <Copy />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
          {!joinLink && <span className="sr-only">Join link unavailable</span>}
        </CardContent>
      </Card>
    </div>
  )
}
