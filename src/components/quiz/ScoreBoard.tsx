import React from 'react';
import { Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Leaderboard } from './Leaderboard';
import { cn } from '@/lib/utils';

interface Score {
  teamName: string;
  score: number;
}

interface ScoreBoardProps {
  scores: Map<string, number>;
  className?: string;
}

export function ScoreBoard({ scores, className }: ScoreBoardProps) {
  const sortedScores: Score[] = Array.from(scores.entries())
    .map(([teamName, score]) => ({ teamName, score }))
    .sort((a, b) => b.score - a.score);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Team scores
        </CardTitle>
        <CardDescription>
          {sortedScores.length === 0 ? 'Teams appear as they join' : `${sortedScores.length} team${sortedScores.length === 1 ? '' : 's'} playing`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedScores.length === 0 ? (
          <EmptyState compact icon={<Users />} title="No teams yet" description="Share the join link or QR code to get players in." />
        ) : (
          <Leaderboard
            rows={sortedScores.map(({ teamName, score }, index) => ({ rank: index + 1, name: teamName, score }))}
          />
        )}
      </CardContent>
    </Card>
  );
}
