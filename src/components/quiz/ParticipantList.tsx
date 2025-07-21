import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RankingData } from '@/types/quiz';
import { formatTime, cn } from '@/lib/utils';

interface ParticipantListProps {
  rankings: RankingData[];
  onAddPoint?: (teamName: string) => void;
  onResetBuzzer?: () => void;
  className?: string;
}

export function ParticipantList({ rankings, onAddPoint, onResetBuzzer, className }: ParticipantListProps) {
  if (rankings.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-700 dark:text-gray-100">Buzz Rankings</CardTitle>
            {onResetBuzzer && (
              <Button
                onClick={onResetBuzzer}
                variant="outline"
                size="sm"
                className="bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600"
              >
                Reset Buzzer
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 italic">
            No teams have buzzed yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-800 dark:to-dark-700', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-700 dark:text-gray-100 flex items-center space-x-2">
            <span>⚡</span>
            <span>Buzz Rankings</span>
          </CardTitle>
          {onResetBuzzer && (
            <Button
              onClick={onResetBuzzer}
              variant="outline"
              size="sm"
              className="bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600"
            >
              Reset Buzzer
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rankings.slice(0, 3).map((ranking, index) => (
            <div
              key={`${ranking.teamName}-${ranking.timestamp}`}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg',
                'bg-white dark:bg-dark-700 border-2 dark:border-dark-600 shadow-sm transition-all duration-200',
                'hover:shadow-md',
                index === 0 && 'border-green-300 dark:border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30',
                index === 1 && 'border-blue-300 dark:border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30',
                index === 2 && 'border-purple-300 dark:border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30'
              )}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full',
                    'text-lg font-bold',
                    index === 0 && 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200',
                    index === 1 && 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200',
                    index === 2 && 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
                  )}
                >
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-gray-100">
                    {ranking.teamName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">
                    {formatTime(ranking.timestamp)}
                  </div>
                </div>
              </div>
              
              {onAddPoint && (
                <Button
                  size="sm"
                  onClick={() => onAddPoint(ranking.teamName)}
                  className={cn(
                    'ml-3',
                    index === 0 && 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
                    index === 1 && 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
                    index === 2 && 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600'
                  )}
                >
                  +1 Point
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}