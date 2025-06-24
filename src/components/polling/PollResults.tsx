import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
        <CardContent className="p-8 text-center text-gray-500">
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

  const getBarColor = (votes: number, index: number): string => {
    if (votes === maxVotes && maxVotes > 0) {
      return 'bg-gradient-to-r from-green-500 to-green-600'; // Winner
    }
    const colors = [
      'bg-gradient-to-r from-blue-500 to-blue-600',
      'bg-gradient-to-r from-purple-500 to-purple-600',
      'bg-gradient-to-r from-pink-500 to-pink-600',
      'bg-gradient-to-r from-indigo-500 to-indigo-600',
      'bg-gradient-to-r from-cyan-500 to-cyan-600',
      'bg-gradient-to-r from-amber-500 to-amber-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <Card className={cn('w-full bg-gradient-to-br from-slate-50 to-slate-100', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-700 flex items-center space-x-2">
            <span>📊</span>
            <span>Poll Results</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {onToggleResults && (
              <Button
                onClick={onToggleResults}
                size="sm"
                variant="outline"
              >
                👥 {showParticipants ? 'Hide' : 'Show'} Voters
              </Button>
            )}
            {onClosePoll && (
              <Button
                onClick={onClosePoll}
                size="sm"
                variant="destructive"
              >
                🔒 Close Poll
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-xl font-semibold text-slate-900 leading-relaxed mb-2">
            {question}
          </h3>
          <div className="text-sm text-slate-600">
            Total responses: <span className="font-semibold">{totalVotes}</span>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {options.map((option, index) => {
            const votes = voteCounts[index] || 0;
            const percentage = getPercentage(votes);
            const isWinner = votes === maxVotes && maxVotes > 0;
            const voters = voterNames[index] || [];

            return (
              <div
                key={index}
                className={cn(
                  'bg-white rounded-lg p-4 border transition-all duration-200',
                  isWinner && 'border-green-300 shadow-lg ring-2 ring-green-100'
                )}
              >
                {/* Option Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full',
                        'bg-slate-100 text-slate-700 font-semibold text-sm',
                        isWinner && 'bg-green-200 text-green-800'
                      )}
                    >
                      {getOptionLabel(index)}
                      {isWinner && ' 👑'}
                    </span>
                    <span
                      className={cn(
                        'text-slate-800 font-medium',
                        isWinner && 'text-green-800 font-semibold'
                      )}
                    >
                      {option}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-slate-700">
                      {votes}
                    </span>
                    <span className="text-sm text-slate-500 min-w-[3rem] text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-3 mb-3">
                  <div
                    className={cn(
                      'h-3 rounded-full transition-all duration-1000 ease-out',
                      getBarColor(votes, index)
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Voter Names */}
                {showParticipants && voters.length > 0 && (
                  <div className="border-t pt-3">
                    <div className="text-xs text-slate-600 mb-2">
                      Voted by: ({voters.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {voters.map((voterName, voterIndex) => (
                        <span
                          key={voterIndex}
                          className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full"
                        >
                          {voterName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        {totalVotes > 0 && (
          <div className="bg-slate-100 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-slate-800">{totalVotes}</div>
                <div className="text-sm text-slate-600">Total Votes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{options.length}</div>
                <div className="text-sm text-slate-600">Options</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(...voteCounts)}
                </div>
                <div className="text-sm text-slate-600">Top Votes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((Math.max(...voteCounts) / totalVotes) * 100)}%
                </div>
                <div className="text-sm text-slate-600">Winner Share</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}