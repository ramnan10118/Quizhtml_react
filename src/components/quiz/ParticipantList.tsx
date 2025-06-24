import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RankingData } from '@/types/quiz';
import { formatTime, cn } from '@/lib/utils';

interface ParticipantListProps {
  rankings: RankingData[];
  onAddPoint?: (teamName: string) => void;
  className?: string;
}

export function ParticipantList({ rankings, onAddPoint, className }: ParticipantListProps) {
  if (rankings.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-slate-700">Buzz Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 italic">
            No teams have buzzed yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full bg-gradient-to-br from-slate-50 to-slate-100', className)}>
      <CardHeader>
        <CardTitle className="text-slate-700 flex items-center space-x-2">
          <span>⚡</span>
          <span>Buzz Rankings</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rankings.slice(0, 3).map((ranking, index) => (
            <div
              key={`${ranking.teamName}-${ranking.timestamp}`}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg',
                'bg-white border-2 shadow-sm transition-all duration-200',
                'hover:shadow-md',
                index === 0 && 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50',
                index === 1 && 'border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50',
                index === 2 && 'border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50'
              )}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full',
                    'text-lg font-bold',
                    index === 0 && 'bg-green-200 text-green-800',
                    index === 1 && 'bg-blue-200 text-blue-800',
                    index === 2 && 'bg-purple-200 text-purple-800'
                  )}
                >
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">
                    {ranking.teamName}
                  </div>
                  <div className="text-xs text-slate-500">
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
                    index === 0 && 'bg-green-600 hover:bg-green-700',
                    index === 1 && 'bg-blue-600 hover:bg-blue-700',
                    index === 2 && 'bg-purple-600 hover:bg-purple-700'
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