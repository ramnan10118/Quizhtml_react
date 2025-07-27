import * as React from 'react'
import { QuizMode, QuizSettings, ParticipantSubmission, LeaderboardEntry, RevealState, QuizQuestion } from '@/types/quiz'
import { HostDashboardTabs, type HostDashboardTab } from './HostDashboardTabs'
import { BasicQuizHostControls } from './BasicQuizHostControls'
import { ScheduledQuizHostControls } from './ScheduledQuizHostControls'
import { ResultsTab } from './ResultsTab'
import { QuizControls } from '@/components/quiz/QuizControls' // Existing buzzer controls
import { ParticipantList } from '@/components/quiz/ParticipantList' // Existing participant list
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from '@/components/ui'

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
  
  // Callbacks
  onSettingsUpdate: (settings: Partial<QuizSettings>) => void
  onRevealQuestion?: (questionIndex: number) => void
  onRevealAll?: () => void
  onToggleLeaderboardVisibility?: () => void
  onSendAnnouncement?: (message: string) => void
  onRefreshData?: () => void
  
  className?: string
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
  onSettingsUpdate,
  onRevealQuestion,
  onRevealAll,
  onToggleLeaderboardVisibility,
  onSendAnnouncement,
  onRefreshData,
  className
}: ModeAwareHostDashboardProps) {
  const [currentTab, setCurrentTab] = useState<HostDashboardTab>('control')

  // Auto-switch to results when there are submissions/results
  useEffect(() => {
    if (mode === 'basic' && basicSubmissions.length > 0 && currentTab === 'control') {
      // Don't auto-switch for basic mode to let host manage the flow
    }
    if (mode === 'scheduled' && submissionCount > 0 && revealedQuestions.some(r => r.isRevealed)) {
      // Don't auto-switch to let host control the experience
    }
  }, [mode, basicSubmissions.length, submissionCount, revealedQuestions, currentTab])

  const renderControlPanel = () => {
    switch (mode) {
      case 'basic':
        return (
          <BasicQuizHostControls
            submissions={basicSubmissions}
            settings={settings}
            participantCount={participantCount}
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

    // For basic and scheduled modes, show submission status
    const getParticipantData = () => {
      if (mode === 'basic') {
        return basicSubmissions.map(sub => ({
          name: sub.participantName,
          status: sub.isComplete ? 'Completed' : 'In Progress',
          score: sub.score,
          submissionTime: sub.submissionTime
        }))
      }
      
      if (mode === 'scheduled') {
        return scheduledSubmissions.map(sub => ({
          name: sub.participantName,
          status: sub.isComplete ? 'Submitted' : 'In Progress',
          submissionTime: sub.submissionTime,
          score: undefined // No score for scheduled until revealed
        }))
      }
      
      return []
    }

    const participantData = getParticipantData()

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>👥</span>
            <span>Participants ({participantCount})</span>
            {submissionCount > 0 && (
              <Badge variant="secondary">
                {submissionCount} {mode === 'basic' ? 'completed' : 'submitted'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {participantData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No participants yet. Share the quiz link to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {participantData.map((participant, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      participant.status === 'Completed' || participant.status === 'Submitted'
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    )} />
                    <div>
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {participant.status}
                        {participant.submissionTime && (
                          <span className="ml-2">
                            {new Date(participant.submissionTime).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {participant.score !== undefined && (
                    <div className="text-right">
                      <div className="font-semibold">{participant.score}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
          <CardTitle className="flex items-center space-x-2">
            <span>⚙️</span>
            <span>Quiz Settings</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Mode Display */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Quiz Mode</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {mode} Quiz
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {mode}
              </Badge>
            </div>
          </div>

          {/* Settings Form */}
          <div className="space-y-4">
            {mode === 'basic' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={settings.timeLimit ? Math.floor(settings.timeLimit / 60) : 0}
                    onChange={(e) => onSettingsUpdate({ 
                      timeLimit: parseInt(e.target.value) * 60 || undefined 
                    })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="No limit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.passingScore || ''}
                    onChange={(e) => onSettingsUpdate({ 
                      passingScore: parseInt(e.target.value) || undefined 
                    })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="No passing score"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.allowRetakes || false}
                      onChange={(e) => onSettingsUpdate({ allowRetakes: e.target.checked })}
                    />
                    <span className="text-sm">Allow retakes</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.showCorrectAnswers !== false}
                      onChange={(e) => onSettingsUpdate({ showCorrectAnswers: e.target.checked })}
                    />
                    <span className="text-sm">Show correct answers in results</span>
                  </label>
                </div>
              </>
            )}

            {mode === 'scheduled' && (
              <div className="space-y-3">
                <h4 className="font-medium">Scheduled Mode Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Participants submit answers first, then you control when to reveal results.
                  Use the Control Panel to manage reveals and leaderboard visibility.
                </p>
              </div>
            )}

            {mode === 'buzzer' && (
              <div className="space-y-3">
                <h4 className="font-medium">Buzzer Mode Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Real-time competitive quiz with instant buzzing.
                  Use the Control Panel to navigate questions and manage the quiz flow.
                </p>
              </div>
            )}
          </div>

          {/* Share Controls */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Share Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={`${window.location.origin}/quiz/join`}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded bg-muted"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/quiz/join`)
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with participants to join your {mode} quiz
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      <HostDashboardTabs
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        mode={mode}
        participantCount={participantCount}
        submissionCount={submissionCount}
      />

      <div className="min-h-[400px]">
        {currentTab === 'control' && renderControlPanel()}
        {currentTab === 'participants' && renderParticipantsTab()}
        {currentTab === 'results' && renderResultsTab()}
        {currentTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  )
}