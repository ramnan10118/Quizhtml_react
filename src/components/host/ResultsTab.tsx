import * as React from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, BarChart3, CheckCircle2, Clock, Download, Eye, EyeOff, Gauge, Layers, Search, Trophy, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Input, StatTile, EmptyState, cn } from '@/components/ui'
import { QuizMode, ParticipantSubmission, LeaderboardEntry, ScoreData, QuizQuestion } from '@/types/quiz'
import { RankBadge } from '@/components/quiz/Leaderboard'

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
      case 'basic': return 'Quiz results'
      case 'scheduled': return 'Leaderboard'
      case 'buzzer': return 'Live results'
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
    return sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
  }

  const headerButton = (field: SortField, label: string, extraClass?: string) => (
    <th scope="col" className={cn('px-4 py-2.5 text-left', extraClass)}>
      <button
        type="button"
        onClick={() => handleSort(field)}
        aria-sort={sortField === field ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-1.5 -ml-1.5 eyebrow normal-case tracking-wider hover:text-foreground focus-ring"
      >
        {label} <SortIcon field={field} />
      </button>
    </th>
  )

  return (
    <div className={cn('space-y-5', className)}>
      {/* Mode-specific stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {mode === 'basic' && (
          <>
            <StatTile label="Completed" value={stats.completed ?? 0} tone="primary" icon={<CheckCircle2 />} />
            <StatTile label="In progress" value={stats.inProgress ?? 0} tone="warning" icon={<Clock />} />
            <StatTile label="Avg score" value={`${stats.avgScore ?? 0}%`} tone="success" icon={<Gauge />} />
            <StatTile label="Total" value={stats.total ?? 0} tone="info" icon={<Users />} />
          </>
        )}

        {mode === 'scheduled' && (
          <>
            <StatTile label="Participants" value={stats.total ?? 0} tone="primary" icon={<Users />} />
            <StatTile label="Revealed" value={stats.revealed ?? 0} tone="success" icon={<Eye />} />
            <StatTile label="Remaining" value={stats.remaining ?? 0} tone="info" icon={<Layers />} />
            <StatTile
              label="Visibility"
              value={leaderboardVisible ? 'Public' : 'Hidden'}
              tone={leaderboardVisible ? 'success' : 'default'}
              icon={leaderboardVisible ? <Eye /> : <EyeOff />}
            />
          </>
        )}

        {mode === 'buzzer' && (
          <>
            <StatTile label="Teams" value={stats.total ?? 0} tone="primary" icon={<Users />} />
            <StatTile label="Active" value={stats.active ?? 0} tone="success" icon={<Trophy />} />
          </>
        )}
      </div>

      {/* Header with filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> {getModeSpecificTitle()}
              </CardTitle>
              <CardDescription>Sort any column, or search for a participant.</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {mode === 'scheduled' && onToggleLeaderboardVisibility && (
                <Button
                  variant={leaderboardVisible ? 'outline' : 'default'}
                  size="sm"
                  onClick={onToggleLeaderboardVisibility}
                >
                  {leaderboardVisible ? <EyeOff /> : <Eye />}
                  {leaderboardVisible ? 'Hide from participants' : 'Show to participants'}
                </Button>
              )}

              {onExportResults && (
                <Button variant="outline" size="sm" onClick={onExportResults}>
                  <Download /> Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Search and filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                aria-label="Search participants"
              />
            </div>

            {mode === 'basic' && (
              <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 text-sm whitespace-nowrap hover:bg-accent/50">
                <input
                  type="checkbox"
                  checked={showCompleteOnly}
                  onChange={(e) => setShowCompleteOnly(e.target.checked)}
                />
                <span>Completed only</span>
              </label>
            )}
          </div>
        </CardContent>

        {/* Results table */}
        <div className="border-t border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-surface-raised">
                <tr>
                  {headerButton('rank', 'Rank', 'w-20')}
                  {headerButton('name', 'Name')}
                  {headerButton('score', 'Score')}
                  {mode !== 'buzzer' && headerButton('time', 'Completed')}
                  <th scope="col" className="px-4 py-2.5 text-left">
                    <span className="eyebrow normal-case tracking-wider">Status</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {sortedData.map((row, index) => (
                  <tr
                    key={index}
                    className={cn(
                      'transition-colors hover:bg-accent/40',
                      row.rank <= 3 && 'bg-primary/5'
                    )}
                  >
                    <td className="px-4 py-3">
                      <RankBadge rank={row.rank} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{row.name}</div>
                      {mode === 'basic' && !row.isComplete && (
                        <div className="text-xs text-muted-foreground">In progress</div>
                      )}
                      {mode === 'scheduled' && 'questionsRevealed' in row && (
                        <div className="text-xs text-muted-foreground tabular">
                          {row.questionsRevealed} questions revealed
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-display text-base font-bold tabular text-foreground">{row.score}</div>
                      <div className="text-xs text-muted-foreground tabular">{row.percentage}%</div>
                    </td>

                    {mode !== 'buzzer' && (
                      <td className="px-4 py-3 text-muted-foreground tabular">
                        {new Date(row.submissionTime).toLocaleString()}
                      </td>
                    )}

                    <td className="px-4 py-3">
                      <Badge variant={row.isComplete ? 'success' : 'warning'}>
                        {row.isComplete ? 'Complete' : 'In progress'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedData.length === 0 && (
            <EmptyState
              compact
              icon={<BarChart3 />}
              title={searchTerm ? 'No matches' : 'No results yet'}
              description={searchTerm ? 'No participants match your search.' : 'Results appear here as participants submit.'}
            />
          )}
        </div>
      </Card>
    </div>
  )
}
