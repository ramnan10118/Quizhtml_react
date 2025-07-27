import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Alert, AlertDescription, cn } from '@/components/ui'
import { ParticipantSubmission, RevealState, LeaderboardEntry, QuizQuestion } from '@/types/quiz'

const { useState } = React

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

  return (
    <div className={cn('space-y-6', className)}>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {submittedCount}
            </div>
            <div className="text-sm text-muted-foreground">Submissions</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {revealedCount}
            </div>
            <div className="text-sm text-muted-foreground">Revealed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {totalQuestions - revealedCount}
            </div>
            <div className="text-sm text-muted-foreground">Remaining</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className={cn(
              "text-2xl font-bold",
              leaderboardVisible ? "text-green-600" : "text-gray-400"
            )}>
              {leaderboardVisible ? '👁️' : '🚫'}
            </div>
            <div className="text-sm text-muted-foreground">Leaderboard</div>
          </CardContent>
        </Card>
      </div>

      {/* Submission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📊</span>
            <span>Submission Status</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Alert>
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  {submittedCount > 0 
                    ? `${submittedCount} participants have submitted their answers`
                    : 'No submissions yet'
                  }
                </span>
                {submittedCount > 0 && (
                  <Badge variant="secondary">
                    Ready for reveals
                  </Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {submissions.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-sm">Recent Submissions:</h4>
              <div className="space-y-1">
                {submissions
                  .filter(s => s.isComplete)
                  .sort((a, b) => b.submissionTime - a.submissionTime)
                  .slice(0, 5)
                  .map((submission, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{submission.participantName}</span>
                      <span className="text-muted-foreground">
                        {new Date(submission.submissionTime).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reveal Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🎭</span>
            <span>Reveal Controls</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Reveal Mode Selection */}
          <div className="space-y-3">
            <h4 className="font-medium">Reveal Strategy</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                onClick={() => setRevealMode('single')}
                className={cn(
                  'p-3 rounded-lg border-2 text-left transition-all',
                  revealMode === 'single'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-medium text-sm">Single Question</div>
                <div className="text-xs text-muted-foreground">Reveal one at a time</div>
              </button>
              
              <button
                onClick={() => setRevealMode('batch')}
                className={cn(
                  'p-3 rounded-lg border-2 text-left transition-all',
                  revealMode === 'batch'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-medium text-sm">Batch Reveal</div>
                <div className="text-xs text-muted-foreground">Reveal multiple together</div>
              </button>
              
              <button
                onClick={() => setRevealMode('all')}
                className={cn(
                  'p-3 rounded-lg border-2 text-left transition-all',
                  revealMode === 'all'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-medium text-sm">All at Once</div>
                <div className="text-xs text-muted-foreground">Reveal everything</div>
              </button>
            </div>
          </div>

          {/* Reveal Actions */}
          <div className="space-y-3">
            {revealMode === 'single' && (
              <div className="space-y-2">
                <h4 className="font-medium">Next Question to Reveal</h4>
                {revealedCount < totalQuestions ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm">
                      Question {revealedCount + 1}: {questions[revealedCount]?.text.slice(0, 50)}...
                    </span>
                    <Button
                      size="sm"
                      onClick={() => onRevealQuestion(revealedCount)}
                    >
                      Reveal
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">All questions revealed</p>
                )}
              </div>
            )}

            {revealMode === 'batch' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium">Batch Size:</label>
                  <input
                    type="number"
                    min="1"
                    max={totalQuestions - revealedCount}
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-sm border rounded"
                  />
                  <span className="text-sm text-muted-foreground">questions</span>
                </div>
                
                {getNextUnrevealedQuestions(batchSize).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Next {batchSize} questions:</p>
                    <div className="space-y-1">
                      {getNextUnrevealedQuestions(batchSize).map((q, index) => (
                        <div key={q.index} className="text-sm text-muted-foreground">
                          Q{q.index + 1}: {questions[q.index]?.text.slice(0, 40)}...
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      onClick={handleBatchReveal}
                    >
                      Reveal Batch
                    </Button>
                  </div>
                )}
              </div>
            )}

            {revealMode === 'all' && (
              <div className="space-y-2">
                <p className="text-sm">
                  This will reveal all {totalQuestions - revealedCount} remaining questions at once.
                </p>
                <Button
                  variant="secondary"
                  onClick={onRevealAll}
                  disabled={revealedCount >= totalQuestions}
                >
                  Reveal All Questions
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🏆</span>
            <span>Leaderboard Management</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <div className="font-medium">Participant Visibility</div>
              <div className="text-sm text-muted-foreground">
                {leaderboardVisible 
                  ? 'Participants can see the leaderboard'
                  : 'Leaderboard is hidden from participants'
                }
              </div>
            </div>
            <Button
              variant={leaderboardVisible ? "destructive" : "default"}
              size="sm"
              onClick={onToggleLeaderboardVisibility}
            >
              {leaderboardVisible ? 'Hide' : 'Show'} Leaderboard
            </Button>
          </div>

          {revealedCount > 0 && leaderboard.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Current Top 3</h4>
              <div className="space-y-2">
                {leaderboard.slice(0, 3).map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        index === 0 ? "bg-yellow-500 text-white" :
                        index === 1 ? "bg-gray-400 text-white" :
                        "bg-amber-600 text-white"
                      )}>
                        {index + 1}
                      </span>
                      <span>{entry.participantName}</span>
                    </div>
                    <span className="font-medium">{entry.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📢</span>
            <span>Announcements</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {!showAnnouncementForm ? (
            <Button
              variant="outline"
              onClick={() => setShowAnnouncementForm(true)}
              className="w-full"
            >
              Send Announcement to Participants
            </Button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Type your announcement here..."
                className="w-full px-3 py-2 text-sm border rounded-lg resize-none"
                rows={3}
                maxLength={200}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {announcement.length}/200 characters
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAnnouncementForm(false)
                      setAnnouncement('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendAnnouncement}
                    disabled={!announcement.trim()}
                  >
                    Send
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