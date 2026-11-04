import * as React from 'react'
import { Check, Copy, Link2, Settings, Users } from 'lucide-react'
import { QuizMode, QuizSettings, ParticipantSubmission, LeaderboardEntry, RevealState, QuizQuestion } from '@/types/quiz'
import { HostDashboardTabs, type HostDashboardTab } from './HostDashboardTabs'
import { BasicQuizHostControls } from './BasicQuizHostControls'
import { ScheduledQuizHostControls } from './ScheduledQuizHostControls'
import { ResultsTab } from './ResultsTab'
import { QuizControls } from '@/components/quiz/QuizControls' // Existing buzzer controls
import { ParticipantList } from '@/components/quiz/ParticipantList' // Existing participant list
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Input, Label, EmptyState, cn } from '@/components/ui'

const { useState, useEffect } = React

interface ModeAwareHostDashboardProps {
  mode: QuizMode
  settings: QuizSettings
  questions: QuizQuestion[]

  // Basic mode data
  basicSubmissions?: ParticipantSubmission[]

  // Scheduled mode data
  scheduledSubmissions?: ParticipantSubmission[]
  revealedQuestions?: RevealState[]
  leaderboard?: LeaderboardEntry[]
  leaderboardVisible?: boolean

  // Buzzer mode data (existing)
  participants?: Array<{ name: string; socketId: string }>
  scores?: Array<{ teamName: string; score: number }>

  // Common
  participantCount: number
  submissionCount: number
  currentSessionId?: string | null
  searchParams?: URLSearchParams

  // Callbacks
  onSettingsUpdate: (settings: Partial<QuizSettings>) => void
  onRevealQuestion?: (questionIndex: number) => void
  onRevealAll?: () => void
  onToggleLeaderboardVisibility?: () => void
  onSendAnnouncement?: (message: string) => void
  onRefreshData?: () => void

  className?: string
}

const MODE_LABELS: Record<QuizMode, string> = {
  buzzer: 'Buzzer',
  basic: 'Self-paced',
  scheduled: 'Scheduled reveal',
}

export function ModeAwareHostDashboard({
  mode,
  settings,
  questions,
  basicSubmissions = [],
  scheduledSubmissions = [],
  revealedQuestions = [],
  leaderboard = [],
  leaderboardVisible = false,
  participants = [],
  scores = [],
  participantCount,
  submissionCount,
  currentSessionId,
  searchParams,
  onSettingsUpdate,
  onRevealQuestion,
  onRevealAll,
  onToggleLeaderboardVisibility,
  onSendAnnouncement,
  onRefreshData,
  className
}: ModeAwareHostDashboardProps) {
  const [currentTab, setCurrentTab] = useState<HostDashboardTab>('control')
  const [copiedShare, setCopiedShare] = useState(false)

  // Debug logging for session ID
  React.useEffect(() => {
    console.log('🔍 ModeAwareHostDashboard - currentSessionId:', currentSessionId);
    console.log('🔍 ModeAwareHostDashboard - searchParams live:', searchParams?.get('live'));
    console.log('🔍 ModeAwareHostDashboard - mode:', mode);
  }, [currentSessionId, searchParams, mode])

  // Auto-switch to results when there are submissions/results
  useEffect(() => {
    if (mode === 'basic' && basicSubmissions.length > 0 && currentTab === 'control') {
      // Don't auto-switch for basic mode to let host manage the flow
    }
    if (mode === 'scheduled' && submissionCount > 0 && revealedQuestions.some(r => r.isRevealed)) {
      // Don't auto-switch to let host control the experience
    }
  }, [mode, basicSubmissions.length, submissionCount, revealedQuestions, currentTab])

  // Join link for participants (the session id is only known once the server
  // has created the session; a saved live quiz falls back to its id).
  const sessionForLink = currentSessionId || searchParams?.get('live') || null
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/quiz/join${sessionForLink ? `?session=${sessionForLink}` : ''}`

  const renderControlPanel = () => {
    switch (mode) {
      case 'basic':
        return (
          <BasicQuizHostControls
            submissions={basicSubmissions}
            settings={settings}
            participantCount={participantCount}
            joinUrl={shareUrl}
            onSettingsUpdate={onSettingsUpdate}
            onRefreshData={onRefreshData || (() => {})}
          />
        )

      case 'scheduled':
        return (
          <ScheduledQuizHostControls
            submissions={scheduledSubmissions}
            revealedQuestions={revealedQuestions}
            leaderboard={leaderboard}
            leaderboardVisible={leaderboardVisible}
            questions={questions}
            onRevealQuestion={onRevealQuestion || (() => {})}
            onRevealAll={onRevealAll || (() => {})}
            onToggleLeaderboardVisibility={onToggleLeaderboardVisibility || (() => {})}
            onSendAnnouncement={onSendAnnouncement || (() => {})}
          />
        )

      case 'buzzer':
      default:
        return (
          <QuizControls
            currentQuestion={1} // This should come from props in real implementation
            totalQuestions={questions.length}
            questionData={questions[0] || null}
            onQuestionChange={() => {}} // Implement in real usage
            onRevealAnswer={() => {}} // Implement in real usage
            onResetBuzzer={() => {}} // Implement in real usage
            className="space-y-6"
          />
        )
    }
  }

  const renderParticipantsTab = () => {
    if (mode === 'buzzer') {
      // Convert participants to rankings format for buzzer mode
      const rankings = participants.map((p, index) => ({
        teamName: p.name,
        timestamp: Date.now(),
        rank: index + 1
      }))

      return (
        <ParticipantList
          rankings={rankings}
          onAddPoint={() => {}} // Implement in real usage
          onResetBuzzer={() => {}} // Implement in real usage
          className="space-y-4"
        />
      )
    }

    // For basic and scheduled modes: everyone who has joined, with their
    // submission status. Joined names show up immediately; a submission
    // upgrades the row, and submitters who have since left stay listed.
    const getParticipantData = () => {
      const submissions = mode === 'basic' ? basicSubmissions : scheduledSubmissions
      const doneLabel = mode === 'basic' ? 'Completed' : 'Submitted'
      const key = (name: string) => name.trim().toLowerCase()

      const rows = new Map<string, { name: string; status: string; score?: number; submissionTime?: number }>()
      participants.forEach(p => {
        rows.set(key(p.name), { name: p.name, status: 'Joined · answering', score: undefined, submissionTime: undefined })
      })
      submissions.forEach(sub => {
        rows.set(key(sub.participantName), {
          name: sub.participantName,
          status: sub.isComplete ? doneLabel : 'In Progress',
          score: mode === 'basic' ? sub.score : undefined, // No score for scheduled until revealed
          submissionTime: sub.submissionTime
        })
      })
      return Array.from(rows.values()).sort((x, y) => {
        const xd = x.status === doneLabel ? 1 : 0
        const yd = y.status === doneLabel ? 1 : 0
        if (xd !== yd) return yd - xd
        return (y.submissionTime || 0) - (x.submissionTime || 0)
      })
    }

    const participantData = getParticipantData()

    return (
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Participants
              <span className="text-muted-foreground tabular">({participantCount})</span>
            </CardTitle>
            <CardDescription>Everyone who has joined this session</CardDescription>
          </div>
          {submissionCount > 0 && (
            <Badge variant="success" className="tabular">
              {submissionCount} {mode === 'basic' ? 'completed' : 'submitted'}
            </Badge>
          )}
        </CardHeader>

        <CardContent>
          {participantData.length === 0 ? (
            <EmptyState
              compact
              icon={<Users />}
              title="No participants yet"
              description="Share the join link or QR code to get people in."
            />
          ) : (
            <ul className="divide-y divide-border">
              {participantData.map((participant, index) => {
                const done = participant.status === 'Completed' || participant.status === 'Submitted'
                return (
                  <li key={index} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', done ? 'bg-success' : 'bg-warning animate-live-dot')} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{participant.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {participant.status}
                          {participant.submissionTime && (
                            <span className="ml-2 tabular">{new Date(participant.submissionTime).toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {participant.score !== undefined && (
                      <div className="text-right">
                        <div className="font-display text-base font-bold tabular text-foreground">{participant.score}</div>
                        <div className="text-[11px] text-muted-foreground">points</div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderResultsTab = () => {
    return (
      <ResultsTab
        mode={mode}
        basicSubmissions={basicSubmissions}
        leaderboard={leaderboard}
        leaderboardVisible={leaderboardVisible}
        revealedQuestionsCount={revealedQuestions.filter(r => r.isRevealed).length}
        teamScores={scores}
        questions={questions}
        totalQuestions={questions.length}
        onToggleLeaderboardVisibility={onToggleLeaderboardVisibility}
        onExportResults={() => {
          // Implement export functionality
          console.log('Export results for mode:', mode)
        }}
      />
    )
  }

  const renderSettingsTab = () => {

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" /> Quiz settings
          </CardTitle>
          <CardDescription>Mode, rules and the join link for this session.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mode Display */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-raised p-4">
            <div>
              <p className="eyebrow">Quiz mode</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{MODE_LABELS[mode]}</p>
            </div>
            <Badge variant="outline" className="capitalize">{mode}</Badge>
          </div>

          {/* Settings Form */}
          <div className="space-y-5">
            {mode === 'basic' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-time-limit">Time limit (minutes)</Label>
                    <Input
                      id="settings-time-limit"
                      type="number"
                      min="0"
                      max="180"
                      value={settings.timeLimit ? Math.floor(settings.timeLimit / 60) : 0}
                      onChange={(e) => onSettingsUpdate({
                        timeLimit: parseInt(e.target.value) * 60 || undefined
                      })}
                      placeholder="No limit"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="settings-passing-score">Passing score (%)</Label>
                    <Input
                      id="settings-passing-score"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.passingScore || ''}
                      onChange={(e) => onSettingsUpdate({
                        passingScore: parseInt(e.target.value) || undefined
                      })}
                      placeholder="No passing score"
                    />
                  </div>
                </div>

                <div className="space-y-3">
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
              </>
            )}

            {mode === 'scheduled' && (
              <div className="rounded-lg border border-dashed border-border p-4">
                <h4 className="text-sm font-semibold text-foreground">Scheduled reveal</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Participants submit answers first, then you control when to reveal results.
                  Use the Control tab to manage reveals and leaderboard visibility.
                </p>
              </div>
            )}

            {mode === 'buzzer' && (
              <div className="rounded-lg border border-dashed border-border p-4">
                <h4 className="text-sm font-semibold text-foreground">Buzzer</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Real-time competitive quiz with instant buzzing.
                  Use the Control tab to navigate questions and manage the quiz flow.
                </p>
              </div>
            )}
          </div>

          {/* Share Controls */}
          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <p className="eyebrow flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" /> Join link</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                aria-label="Join link"
                className="h-10 min-w-0 flex-1 rounded-md border border-input bg-surface px-3 font-mono text-xs text-foreground focus-ring"
              />
              <Button
                size="sm"
                variant={copiedShare ? 'success' : 'default'}
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  console.log('📋 Copied share URL:', shareUrl);
                  setCopiedShare(true)
                  setTimeout(() => setCopiedShare(false), 2000)
                }}
              >
                {copiedShare ? <Check /> : <Copy />}
                {copiedShare ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Share this link with participants to join your {MODE_LABELS[mode].toLowerCase()} quiz.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <HostDashboardTabs
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        mode={mode}
        participantCount={participantCount}
        submissionCount={submissionCount}
      />

      <div className="min-h-[400px] animate-fade-in" key={currentTab}>
        {currentTab === 'control' && renderControlPanel()}
        {currentTab === 'participants' && renderParticipantsTab()}
        {currentTab === 'results' && renderResultsTab()}
        {currentTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  )
}
