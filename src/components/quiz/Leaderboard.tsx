import * as React from 'react'
import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'

export interface LeaderboardRow {
  rank: number
  name: string
  score: number
  /** 0..100 */
  percentage?: number
  meta?: React.ReactNode
  trailing?: React.ReactNode
}

interface LeaderboardProps {
  rows: LeaderboardRow[]
  highlightName?: string
  scoreSuffix?: string
  maxRows?: number
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

export function RankBadge({ rank, className }: { rank: number; className?: string }) {
  const styles =
    rank === 1
      ? 'bg-primary text-primary-foreground shadow-[0_0_0_3px_hsl(var(--primary)/0.25)]'
      : rank === 2
      ? 'bg-muted-foreground/25 text-foreground'
      : rank === 3
      ? 'bg-[hsl(24_70%_50%/0.25)] text-[hsl(24_80%_62%)]'
      : 'bg-muted text-muted-foreground'
  return (
    <span
      className={cn(
        'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold tabular',
        styles,
        className
      )}
      aria-label={`Rank ${rank}`}
    >
      {rank}
      {rank === 1 && <Crown className="absolute -top-2.5 h-3.5 w-3.5 text-primary" aria-hidden="true" />}
    </span>
  )
}

/** Ranked list with medal styling for the top three and an optional bar. */
export function Leaderboard({
  rows,
  highlightName,
  scoreSuffix = 'pts',
  maxRows,
  emptyTitle = 'No scores yet',
  emptyDescription,
  className,
}: LeaderboardProps) {
  const list = typeof maxRows === 'number' ? rows.slice(0, maxRows) : rows

  if (list.length === 0) {
    return <EmptyState compact title={emptyTitle} description={emptyDescription} className={className} />
  }

  const top = Math.max(1, ...list.map((r) => r.score))

  return (
    <ol className={cn('divide-y divide-border', className)}>
      {list.map((row) => {
        const me = highlightName && row.name === highlightName
        const pct = row.percentage ?? Math.round((row.score / top) * 100)
        return (
          <li
            key={`${row.rank}-${row.name}`}
            className={cn(
              'flex items-center gap-3 px-1 py-3 first:pt-1 last:pb-1',
              me && 'rounded-lg bg-primary/10 px-3 ring-1 ring-primary/25'
            )}
          >
            <RankBadge rank={row.rank} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn('truncate text-sm font-semibold', row.rank <= 3 ? 'text-foreground' : 'text-foreground/90')}>
                  {row.name}
                </span>
                {me && <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">You</span>}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full origin-left rounded-full animate-bar-grow', row.rank === 1 ? 'bg-primary' : 'bg-muted-foreground/50')}
                    style={{ transform: `scaleX(${Math.max(0, Math.min(100, pct)) / 100})` }}
                  />
                </div>
                {row.meta && <span className="shrink-0 text-[11px] text-muted-foreground">{row.meta}</span>}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-display text-base font-bold tabular text-foreground">
                {row.score}
                <span className="ml-1 text-xs font-medium text-muted-foreground">{scoreSuffix}</span>
              </div>
              {row.trailing}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
