import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, cn } from '@/components/ui'
import { QuizMode, ParticipantSubmission, LeaderboardEntry, ScoreData, QuizQuestion } from '@/types/quiz'

const { useState, useMemo } = React

interface ResultsTabProps {
  mode: QuizMode
  // Basic mode data
  basicSubmissions?: ParticipantSubmission[]
  // Scheduled mode data
  leaderboard?: LeaderboardEntry[]
  leaderboardVisible?: boolean
  revealedQuestionsCount?: number
  // Buzzer mode data (existing)
  teamScores?: ScoreData[]
  // Common
  questions?: QuizQuestion[]
  totalQuestions: number
  onToggleLeaderboardVisibility?: () => void
  onExportResults?: () => void
  className?: string
}

type SortField = 'name' | 'score' | 'time' | 'rank'
type SortOrder = 'asc' | 'desc'

export function ResultsTab({
  mode,
  basicSubmissions = [],
  leaderboard = [],
  leaderboardVisible = false,
  revealedQuestionsCount = 0,
  teamScores = [],
  questions = [],
  totalQuestions,
  onToggleLeaderboardVisibility,
  onExportResults,
  className
}: ResultsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showCompleteOnly, setShowCompleteOnly] = useState(false)

  // Get the appropriate data based on mode
  const resultsData = useMemo(() => {
    switch (mode) {
      case 'basic':
        return basicSubmissions
          .filter(s => showCompleteOnly ? s.isComplete : true)
          .filter(s => s.participantName.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((s, index) => ({
            rank: index + 1,
            name: s.participantName,
            score: s.score || 0,
            percentage: Math.round(((s.score || 0) / totalQuestions) * 100),
            submissionTime: s.submissionTime,
            isComplete: s.isComplete,
            questionsAnswered: s.answers.filter(a => a.selectedOption !== -1).length
          }))
      
      case 'scheduled':
        return leaderboard
          .filter(entry => entry.participantName.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(entry => ({
            rank: entry.rank,
            name: entry.participantName,
            score: entry.score,
            percentage: Math.round((entry.score / entry.questionsRevealed) * 100),
            submissionTime: entry.submissionTime,
            isComplete: true,
            questionsRevealed: entry.questionsRevealed
          }))
      
      case 'buzzer':
        return teamScores
          .filter(team => team.teamName.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((team, index) => ({
            rank: index + 1,
            name: team.teamName,
            score: team.score,
            percentage: Math.round((team.score / totalQuestions) * 100),
            submissionTime: Date.now(), // Not applicable for buzzer mode
            isComplete: true,
            questionsAnswered: totalQuestions
          }))
      
      default:
        return []
    }
  }, [mode, basicSubmissions, leaderboard, teamScores, searchTerm, showCompleteOnly, totalQuestions])

  // Sort the data
  const sortedData = useMemo(() => {
    return [...resultsData].sort((a, b) => {
      let aValue: string | number, bValue: string | number
      
      switch (sortField) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'score':
          aValue = a.score
          bValue = b.score
          break
        case 'time':
          aValue = a.submissionTime
          bValue = b.submissionTime
          break
        case 'rank':
          aValue = a.rank
          bValue = b.rank
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [resultsData, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getModeSpecificTitle = () => {
    switch (mode) {
      case 'basic': return 'Quiz Results'
      case 'scheduled': return 'Leaderboard'
      case 'buzzer': return 'Live Results'
      default: return 'Results'
    }
  }

  const getModeSpecificStats = () => {
    switch (mode) {
      case 'basic':
        const completed = basicSubmissions.filter(s => s.isComplete).length
        const inProgress = basicSubmissions.length - completed
        const avgScore = completed > 0 
          ? Math.round(basicSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / completed)
          : 0
        
        return { completed, inProgress, avgScore, total: basicSubmissions.length }
      
      case 'scheduled':
        return { 
          total: leaderboard.length, 
          revealed: revealedQuestionsCount,
          remaining: totalQuestions - revealedQuestionsCount
        }
      
      case 'buzzer':
        return { total: teamScores.length, active: teamScores.length }
      
      default:
        return {}
    }
  }

  const stats = getModeSpecificStats()

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>
                {mode === 'basic' ? '📊' : mode === 'scheduled' ? '🏆' : '🎯'}
              </span>
              <span>{getModeSpecificTitle()}</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {mode === 'scheduled' && onToggleLeaderboardVisibility && (
                <Button
                  variant={leaderboardVisible ? "destructive" : "default"}
                  size="sm"
                  onClick={onToggleLeaderboardVisibility}
                >
                  {leaderboardVisible ? 'Hide from Participants' : 'Show to Participants'}
                </Button>
              )}
              
              {onExportResults && (
                <Button variant="outline" size="sm" onClick={onExportResults}>
                  Export Results
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Mode-specific stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {mode === 'basic' && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.completed}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.avgScore}%</div>
                  <div className="text-sm text-muted-foreground">Avg Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </>
            )}
            
            {mode === 'scheduled' && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.revealed}</div>
                  <div className="text-sm text-muted-foreground">Revealed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.remaining}</div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-bold",
                    leaderboardVisible ? "text-green-600" : "text-gray-400"
                  )}>
                    {leaderboardVisible ? '👁️' : '🚫'}
                  </div>
                  <div className="text-sm text-muted-foreground">Visibility</div>
                </div>
              </>
            )}
            
            {mode === 'buzzer' && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
              </>
            )}
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            
            {mode === 'basic' && (
              <label className="flex items-center space-x-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showCompleteOnly}
                  onChange={(e) => setShowCompleteOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Completed only</span>
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th 
                    className="text-left p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('rank')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Rank</span>
                      {sortField === 'rank' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  
                  <th 
                    className="text-left p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      {sortField === 'name' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  
                  <th 
                    className="text-left p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('score')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Score</span>
                      {sortField === 'score' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  
                  {mode !== 'buzzer' && (
                    <th 
                      className="text-left p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('time')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Completion Time</span>
                        {sortField === 'time' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  )}
                  
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              
              <tbody>
                {sortedData.map((row, index) => (
                  <tr 
                    key={index} 
                    className={cn(
                      "border-b hover:bg-muted/30",
                      index < 3 && "bg-primary/5"
                    )}
                  >
                    <td className="p-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        row.rank === 1 ? "bg-yellow-500 text-white" :
                        row.rank === 2 ? "bg-gray-400 text-white" :
                        row.rank === 3 ? "bg-amber-600 text-white" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {row.rank}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium">{row.name}</div>
                      {mode === 'basic' && !row.isComplete && (
                        <div className="text-xs text-muted-foreground">In progress</div>
                      )}
                      {mode === 'scheduled' && 'questionsRevealed' in row && (
                        <div className="text-xs text-muted-foreground">
                          {row.questionsRevealed} questions revealed
                        </div>
                      )}
                    </td>
                    
                    <td className="p-3">
                      <div className="font-semibold">{row.score}</div>
                      <div className="text-xs text-muted-foreground">{row.percentage}%</div>
                    </td>
                    
                    {mode !== 'buzzer' && (
                      <td className="p-3">
                        <div className="text-sm">
                          {new Date(row.submissionTime).toLocaleString()}
                        </div>
                      </td>
                    )}
                    
                    <td className="p-3">
                      <Badge 
                        variant={row.isComplete ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {row.isComplete ? 'Complete' : 'In Progress'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {sortedData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No participants found matching your search.' : 'No data available yet.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}