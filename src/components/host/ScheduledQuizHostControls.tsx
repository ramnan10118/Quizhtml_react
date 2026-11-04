import * as React from 'react'
import { Eye, EyeOff, Inbox, Layers, Megaphone, Send, Sparkles, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Input, Label, Textarea, StatTile, Progress, SegmentedControl, cn } from '@/components/ui'
import { ParticipantSubmission, RevealState, LeaderboardEntry, QuizQuestion } from '@/types/quiz'
import { RankBadge } from '@/components/quiz/Leaderboard'

const { useState, useEffect } = React

interface ScheduledQuizHostControlsProps {
  submissions: ParticipantSubmission[]
  revealedQuestions: RevealState[]
  leaderboard: LeaderboardEntry[]
  leaderboardVisible: boolean
  questions: QuizQuestion[]
  onRevealQuestion: (questionIndex: number) => void
  onRevealAll: () => void
  onToggleLeaderboardVisibility: () => void
  onSendAnnouncement: (message: string) => void
  className?: string
}

type RevealMode = 'single' | 'batch' | 'all'

export function ScheduledQuizHostControls({
  submissions,
  revealedQuestions,
  leaderboard,
  leaderboardVisible,
  questions,
  onRevealQuestion,
  onRevealAll,
  onToggleLeaderboardVisibility,
  onSendAnnouncement,
  className
}: ScheduledQuizHostControlsProps) {
  const [revealMode, setRevealMode] = useState<RevealMode>('single')
  const [batchSize, setBatchSize] = useState(3)
  const [announcement, setAnnouncement] = useState('')
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)

  const submittedCount = submissions.filter(s => s.isComplete).length
  const revealedCount = revealedQuestions.filter(r => r.isRevealed).length
  const totalQuestions = questions.length

  // Debug logging
  console.log('🔍 ScheduledQuizHostControls - submissions:', submissions.length, 'total, ', submittedCount, 'complete');
  console.log('🔍 ScheduledQuizHostControls - submissions data:', submissions);

  // Show completion message when all questions are revealed (no auto-redirect)
  useEffect(() => {
    if (revealedCount > 0 && revealedCount === totalQuestions) {
      console.log('🎯 All questions revealed - quiz completed!');
      // Quiz will automatically move to history section when status changes to 'completed'
    }
  }, [revealedCount, totalQuestions]);

  const handleBatchReveal = () => {
    const nextUnrevealed = revealedQuestions
      .map((r, index) => ({ ...r, index }))
      .filter(r => !r.isRevealed)
      .slice(0, batchSize)

    nextUnrevealed.forEach(r => onRevealQuestion(r.index))
  }

  const handleSendAnnouncement = () => {
    if (announcement.trim()) {
      onSendAnnouncement(announcement.trim())
      setAnnouncement('')
      setShowAnnouncementForm(false)
    }
  }

  const getNextUnrevealedQuestions = (count: number) => {
    return revealedQuestions
      .map((r, index) => ({ ...r, index }))
      .filter(r => !r.isRevealed)
      .slice(0, count)
  }

  const allRevealed = revealedCount >= totalQuestions && totalQuestions > 0

  return (
    <div className={cn('space-y-5', className)}>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Submissions" value={submittedCount} tone="primary" icon={<Inbox />} />
        <StatTile label="Revealed" value={revealedCount} tone="success" icon={<Eye />} hint={`of ${totalQuestions} questions`} />
        <StatTile label="Remaining" value={totalQuestions - revealedCount} tone="info" icon={<Layers />} />
        <StatTile
          label="Leaderboard"
          value={leaderboardVisible ? 'Visible' : 'Hidden'}
          tone={leaderboardVisible ? 'success' : 'default'}
          icon={leaderboardVisible ? <Eye /> : <EyeOff />}
        />
      </div>

      {/* Reveal Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Reveal controls
              </CardTitle>
              <CardDescription>Choose how answers are released to participants.</CardDescription>
            </div>
            <Badge variant={allRevealed ? 'success' : 'secondary'} className="tabular">
              {revealedCount}/{totalQuestions} revealed
            </Badge>
          </div>
          <Progress value={revealedCount} max={totalQuestions} tone="success" className="mt-3" label="Reveal progress" />
        </CardHeader>

        <CardContent className="space-y-5">
          <SegmentedControl<RevealMode>
            value={revealMode}
            onChange={setRevealMode}
            aria-label="Reveal strategy"
            options={[
              { value: 'single', label: 'One at a time' },
              { value: 'batch', label: 'In batches' },
              { value: 'all', label: 'All at once' },
            ]}
          />

          <div className="rounded-lg border border-border bg-surface-raised p-4">
            {revealMode === 'single' && (
              <div className="space-y-3">
                <p className="eyebrow">Next to reveal</p>
                {revealedCount < totalQuestions ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="min-w-0 text-sm text-foreground">
                      <span className="font-semibold tabular">Q{revealedCount + 1}.</span>{' '}
                      <span className="text-muted-foreground">{questions[revealedCount]?.text.slice(0, 50)}…</span>
                    </p>
                    <Button onClick={() => onRevealQuestion(revealedCount)} className="shrink-0">
                      <Eye /> Reveal question {revealedCount + 1}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">All questions have been revealed.</p>
                )}
              </div>
            )}

            {revealMode === 'batch' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Label htmlFor="batch-size" className="shrink-0">Batch size</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    min="1"
                    max={totalQuestions - revealedCount}
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">questions</span>
                </div>

                {getNextUnrevealedQuestions(batchSize).length > 0 && (
                  <div className="space-y-3">
                    <p className="eyebrow">Next {batchSize} question{batchSize === 1 ? '' : 's'}</p>
                    <ul className="space-y-1">
                      {getNextUnrevealedQuestions(batchSize).map((q) => (
                        <li key={q.index} className="truncate text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground tabular">Q{q.index + 1}.</span> {questions[q.index]?.text.slice(0, 40)}…
                        </li>
                      ))}
                    </ul>
                    <Button onClick={handleBatchReveal}>
                      <Layers /> Reveal batch
                    </Button>
                  </div>
                )}
              </div>
            )}

            {revealMode === 'all' && (
              <div className="space-y-3">
                <p className="text-sm text-foreground">
                  This reveals all <span className="font-semibold tabular">{totalQuestions - revealedCount}</span> remaining questions at once and publishes the final leaderboard.
                </p>
                <Button variant="default" onClick={onRevealAll} disabled={revealedCount >= totalQuestions}>
                  <Eye /> Reveal all questions
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Submission Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" /> Submissions
            </CardTitle>
            <CardDescription>
              {submittedCount > 0
                ? `${submittedCount} participant${submittedCount === 1 ? ' has' : 's have'} submitted their answers`
                : 'No submissions yet'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {submissions.length > 0 ? (
              <ul className="divide-y divide-border">
                {submissions
                  .filter(s => s.isComplete)
                  .sort((a, b) => b.submissionTime - a.submissionTime)
                  .slice(0, 5)
                  .map((submission, index) => (
                    <li key={index} className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        {submission.participantName}
                      </span>
                      <span className="text-xs text-muted-foreground tabular">
                        {new Date(submission.submissionTime).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                Waiting for the first submission.
              </p>
            )}
            {submittedCount > 0 && (
              <Badge variant="success" className="mt-4">Ready for reveals</Badge>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" /> Leaderboard
            </CardTitle>
            <CardDescription>
              {leaderboardVisible
                ? 'Participants can see the leaderboard'
                : 'Leaderboard is hidden from participants'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              variant={leaderboardVisible ? 'outline' : 'default'}
              size="sm"
              onClick={onToggleLeaderboardVisibility}
              className="w-full"
            >
              {leaderboardVisible ? <EyeOff /> : <Eye />}
              {leaderboardVisible ? 'Hide from participants' : 'Show to participants'}
            </Button>

            {revealedCount > 0 && leaderboard.length > 0 && (
              <div>
                <p className="eyebrow mb-2">Current top 3</p>
                <ul className="space-y-2">
                  {leaderboard.slice(0, 3).map((entry, index) => (
                    <li key={index} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2.5">
                        <RankBadge rank={index + 1} className="h-7 w-7 text-xs" />
                        <span className="font-medium text-foreground">{entry.participantName}</span>
                      </span>
                      <span className="font-semibold tabular text-foreground">{entry.score} pts</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Communication */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" /> Announcements
          </CardTitle>
          <CardDescription>Push a short message to every participant&apos;s screen.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {!showAnnouncementForm ? (
            <Button variant="outline" onClick={() => setShowAnnouncementForm(true)} className="w-full">
              <Megaphone /> Write an announcement
            </Button>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Type your announcement here..."
                rows={3}
                maxLength={200}
                autoFocus
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground tabular">
                  {announcement.length}/200
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAnnouncementForm(false)
                      setAnnouncement('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSendAnnouncement} disabled={!announcement.trim()}>
                    <Send /> Send
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
