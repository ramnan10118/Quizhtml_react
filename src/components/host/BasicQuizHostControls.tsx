import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from '@/components/ui'
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
  const completedSubmissions = submissions.filter(s => s.isComplete)
  const inProgressCount = participantCount - completedSubmissions.length
  
  const averageScore = completedSubmissions.length > 0 
    ? Math.round(completedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSubmissions.length)
    : 0

  const passedCount = settings.passingScore 
    ? completedSubmissions.filter(s => ((s.score || 0) / submissions[0]?.answers.length || 1) * 100 >= settings.passingScore!).length
    : 0

  return (
    <div className={cn('space-y-6', className)}>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {completedSubmissions.length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {inProgressCount}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {averageScore}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Score</div>
          </CardContent>
        </Card>
        
        {settings.passingScore && (
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {passedCount}
              </div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>🎛️</span>
              <span>Quiz Controls</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshData}
            >
              🔄 Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Real-time Status */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <div className="font-medium">Quiz Status</div>
              <div className="text-sm text-muted-foreground">
                {inProgressCount > 0 
                  ? `${inProgressCount} participants still taking the quiz`
                  : 'All participants have completed the quiz'
                }
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                inProgressCount > 0 ? "bg-yellow-500" : "bg-green-500"
              )} />
              <span className="text-sm font-medium">
                {inProgressCount > 0 ? 'Active' : 'Complete'}
              </span>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="space-y-3">
            <h4 className="font-medium">Quiz Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Time Limit */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Limit (minutes)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={settings.timeLimit ? Math.floor(settings.timeLimit / 60) : 0}
                    onChange={(e) => onSettingsUpdate({ 
                      timeLimit: parseInt(e.target.value) * 60 
                    })}
                    className="w-20 px-2 py-1 text-sm border rounded"
                  />
                  <span className="text-sm text-muted-foreground">
                    {settings.timeLimit ? `${Math.floor(settings.timeLimit / 60)} min` : 'No limit'}
                  </span>
                </div>
              </div>

              {/* Passing Score */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Passing Score (%)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.passingScore || 0}
                    onChange={(e) => onSettingsUpdate({ 
                      passingScore: parseInt(e.target.value) || undefined 
                    })}
                    className="w-20 px-2 py-1 text-sm border rounded"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.allowRetakes || false}
                  onChange={(e) => onSettingsUpdate({ allowRetakes: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Allow retakes</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.showCorrectAnswers !== false}
                  onChange={(e) => onSettingsUpdate({ showCorrectAnswers: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Show correct answers in results</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Completions */}
      {completedSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📋</span>
              <span>Recent Completions</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              {completedSubmissions
                .sort((a, b) => b.submissionTime - a.submissionTime)
                .slice(0, 5)
                .map((submission, index) => {
                  const score = submission.score || 0
                  const totalQuestions = submission.answers.length
                  const percentage = Math.round((score / totalQuestions) * 100)
                  const isPassed = settings.passingScore ? percentage >= settings.passingScore : true

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          isPassed 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        )}>
                          {isPassed ? '✓' : '✗'}
                        </div>
                        <div>
                          <div className="font-medium">{submission.participantName}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(submission.submissionTime).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{score}/{totalQuestions}</div>
                        <div className="text-xs text-muted-foreground">{percentage}%</div>
                      </div>
                    </div>
                  )
                })}
            </div>
            
            {completedSubmissions.length > 5 && (
              <div className="text-center mt-3">
                <p className="text-sm text-muted-foreground">
                  And {completedSubmissions.length - 5} more submissions...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Share Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔗</span>
            <span>Share Quiz</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={window.location.href.replace('/host', '/join')}
              readOnly
              className="flex-1 px-3 py-2 text-sm border rounded bg-muted"
            />
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href.replace('/host', '/join'))
              }}
            >
              Copy Link
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Share this link with participants to join the quiz
          </div>
        </CardContent>
      </Card>
    </div>
  )
}