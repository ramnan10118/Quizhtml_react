import React from 'react';
import { Plus, RotateCcw, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { RankBadge } from './Leaderboard';
import { RankingData } from '@/types/quiz';
import { formatTime, cn } from '@/lib/utils';

interface ParticipantListProps {
  rankings: RankingData[];
  onAddPoint?: (teamName: string) => void;
  onResetBuzzer?: () => void;
  className?: string;
}

/** Buzz order for the current question (top three), with award + reset. */
export function ParticipantList({ rankings, onAddPoint, onResetBuzzer, className }: ParticipantListProps) {
  const header = (
    <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
      <div>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Buzz order
        </CardTitle>
        <CardDescription>First three to buzz in</CardDescription>
      </div>
      {onResetBuzzer && (
        <Button onClick={onResetBuzzer} variant="outline" size="sm">
          <RotateCcw /> Reset
        </Button>
      )}
    </CardHeader>
  );

  if (rankings.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        {header}
        <CardContent>
          <EmptyState compact icon={<Zap />} title="Nobody has buzzed" description="Buzzes will appear here in order as teams tap in." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      {header}
      <CardContent>
        <ol className="space-y-2">
          {rankings.slice(0, 3).map((ranking, index) => (
            <li
              key={`${ranking.teamName}-${ranking.timestamp}`}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-colors animate-fade-up',
                index === 0 ? 'border-primary/40 bg-primary/10' : 'border-border bg-surface'
              )}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <RankBadge rank={index + 1} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">{ranking.teamName}</div>
                <div className="font-mono text-[11px] text-muted-foreground tabular">{formatTime(ranking.timestamp)}</div>
              </div>
              {onAddPoint && (
                <Button
                  size="sm"
                  variant={index === 0 ? 'success' : 'secondary'}
                  onClick={() => onAddPoint(ranking.teamName)}
                  aria-label={`Award a point to ${ranking.teamName}`}
                >
                  <Plus /> 1 pt
                </Button>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
