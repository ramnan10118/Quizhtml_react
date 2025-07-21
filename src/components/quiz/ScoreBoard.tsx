import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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

  if (sortedScores.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-slate-700 dark:text-gray-100">Team Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 italic">
            No teams have joined yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-800 dark:to-dark-700', className)}>
      <CardHeader>
        <CardTitle className="text-slate-700 dark:text-gray-100 flex items-center space-x-2">
          <span>🏆</span>
          <span>Team Scores</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedScores.map(({ teamName, score }, index) => (
            <div
              key={teamName}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg',
                'bg-white dark:bg-dark-700 border-2 dark:border-dark-600 shadow-sm transition-all duration-200',
                'hover:shadow-md hover:scale-105',
                index === 0 && 'border-yellow-300 dark:border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30',
                index === 1 && 'border-gray-300 dark:border-gray-500 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30',
                index === 2 && 'border-orange-300 dark:border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30',
                index > 2 && 'border-slate-200 dark:border-dark-600'
              )}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full',
                    'text-sm font-bold',
                    index === 0 && 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200',
                    index === 1 && 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
                    index === 2 && 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200',
                    index > 2 && 'bg-slate-200 dark:bg-dark-600 text-slate-800 dark:text-gray-200'
                  )}
                >
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-gray-100">{teamName}</div>
                </div>
              </div>
              <div
                className={cn(
                  'text-lg font-bold px-3 py-1 rounded-full',
                  index === 0 && 'text-yellow-800 dark:text-yellow-200 bg-yellow-200 dark:bg-yellow-800',
                  index === 1 && 'text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800',
                  index === 2 && 'text-orange-800 dark:text-orange-200 bg-orange-200 dark:bg-orange-800',
                  index > 2 && 'text-slate-800 dark:text-gray-200 bg-slate-200 dark:bg-dark-600'
                )}
              >
                {score} pts
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}