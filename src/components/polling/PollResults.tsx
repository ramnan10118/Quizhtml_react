import React from 'react';
import { BarChart3, Crown, Lock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatTile } from '@/components/ui/StatTile';
import { PollResults as PollResultsType } from '@/types/polling';
import { getOptionLabel, cn } from '@/lib/utils';

interface PollResultsProps {
  results: PollResultsType | null;
  onClosePoll?: () => void;
  onToggleResults?: () => void;
  showParticipants?: boolean;
  className?: string;
}

export function PollResults({
  results,
  onClosePoll,
  onToggleResults,
  showParticipants = false,
  className
}: PollResultsProps) {
  if (!results) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No poll results available
        </CardContent>
      </Card>
    );
  }

  const { question, options, voteCounts, totalVotes, voterNames } = results;
  const maxVotes = Math.max(...voteCounts);

  const getPercentage = (votes: number): number => {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Live results
            </CardTitle>
            <CardDescription className="tabular">{totalVotes} response{totalVotes === 1 ? '' : 's'} so far</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onToggleResults && (
              <Button onClick={onToggleResults} size="sm" variant="outline">
                <Users /> {showParticipants ? 'Hide' : 'Show'} voters
              </Button>
            )}
            {onClosePoll && (
              <Button onClick={onClosePoll} size="sm" variant="destructive">
                <Lock /> Close poll
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question */}
        <h3 className="font-display text-xl font-semibold leading-snug text-foreground sm:text-2xl">
          {question}
        </h3>

        {/* Results */}
        <ol className="space-y-3">
          {options.map((option, index) => {
            const votes = voteCounts[index] || 0;
            const percentage = getPercentage(votes);
            const isWinner = votes === maxVotes && maxVotes > 0;
            const voters = voterNames[index] || [];

            return (
              <li
                key={index}
                className={cn(
                  'relative overflow-hidden rounded-lg border p-3.5 transition-colors',
                  isWinner ? 'border-primary/50 bg-primary/5' : 'border-border bg-surface'
                )}
              >
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold',
                        isWinner ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {getOptionLabel(index)}
                    </span>
                    <span className={cn('truncate text-sm sm:text-[15px]', isWinner ? 'font-semibold text-foreground' : 'text-foreground/90')}>
                      {option}
                    </span>
                    {isWinner && <Crown className="h-4 w-4 shrink-0 text-primary" aria-label="Leading option" />}
                  </div>
                  <div className="flex shrink-0 items-baseline gap-1.5 tabular">
                    <span className="font-display text-lg font-bold text-foreground">{votes}</span>
                    <span className="w-10 text-right text-xs text-muted-foreground">{percentage}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full origin-left rounded-full transition-transform duration-700 ease-out',
                      isWinner ? 'bg-primary' : 'bg-info'
                    )}
                    style={{ transform: `scaleX(${percentage / 100})` }}
                  />
                </div>

                {/* Voter Names */}
                {showParticipants && voters.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="eyebrow mb-2">Voted by ({voters.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {voters.map((voterName, voterIndex) => (
                        <span
                          key={voterIndex}
                          className="rounded-full border border-border bg-surface-raised px-2 py-0.5 text-xs text-foreground"
                        >
                          {voterName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {/* Summary Stats */}
        {totalVotes > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Total votes" value={totalVotes} />
            <StatTile label="Options" value={options.length} />
            <StatTile label="Top votes" value={Math.max(...voteCounts)} tone="primary" />
            <StatTile label="Leader share" value={`${Math.round((Math.max(...voteCounts) / totalVotes) * 100)}%`} tone="info" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
