import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Poll } from '@/types/polling';
import { getOptionLabel, cn } from '@/lib/utils';

interface PollDisplayProps {
  poll: Poll | null;
  onVote?: (optionIndex: number) => void;
  hasVoted?: boolean;
  userVote?: number;
  showVoteCounts?: boolean;
  voteCounts?: number[];
  isParticipant?: boolean;
  className?: string;
}

export function PollDisplay({
  poll,
  onVote,
  hasVoted = false,
  userVote,
  showVoteCounts = false,
  voteCounts = [],
  isParticipant = false,
  className
}: PollDisplayProps) {
  if (!poll) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
          {isParticipant ? 'Waiting for a poll to start...' : 'No active poll'}
        </CardContent>
      </Card>
    );
  }

  const totalVotes = voteCounts.reduce((sum, count) => sum + count, 0);

  const getPercentage = (votes: number): number => {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  };

  const canVote = isParticipant && poll.isActive && !hasVoted && onVote;

  return (
    <Card className={cn('w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-800 dark:to-dark-700 border-slate-200 dark:border-dark-600', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-700 dark:text-gray-100 flex items-center space-x-2">
            <span>🗳️</span>
            <span>{poll.isActive ? 'Live Poll' : 'Poll Results'}</span>
          </CardTitle>
          {totalVotes > 0 && (
            <div className="text-sm text-slate-500 dark:text-gray-400 bg-slate-200 dark:bg-dark-600 px-3 py-1 rounded-full">
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question */}
        <div className="bg-white dark:bg-dark-700 rounded-lg p-6 shadow-sm border dark:border-dark-600">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-gray-100 leading-relaxed">
            {poll.question}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {poll.options.map((option, index) => {
            const voteCount = voteCounts[index] || 0;
            const percentage = getPercentage(voteCount);
            const isUserVote = userVote === index;
            const isClickable = canVote;

            return (
              <div
                key={index}
                className={cn(
                  'relative p-4 rounded-lg border-2 transition-all duration-200 overflow-hidden',
                  'bg-white dark:bg-dark-700 hover:bg-slate-50 dark:hover:bg-dark-600',
                  isClickable && 'cursor-pointer hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-md',
                  isUserVote && 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30 shadow-lg',
                  !isClickable && 'cursor-default',
                  hasVoted && !isUserVote && 'opacity-70'
                )}
                onClick={() => isClickable && onVote?.(index)}
              >
                {/* Vote percentage background */}
                {showVoteCounts && (
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-900/20 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <span
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full',
                        'bg-slate-100 dark:bg-dark-600 text-slate-700 dark:text-gray-200 font-semibold text-sm',
                        isUserVote && 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200',
                        isClickable && 'group-hover:bg-purple-200 dark:group-hover:bg-purple-800 group-hover:text-purple-800 dark:group-hover:text-purple-200'
                      )}
                    >
                      {getOptionLabel(index)}
                    </span>
                    <span
                      className={cn(
                        'text-slate-800 dark:text-gray-200 font-medium flex-1',
                        isUserVote && 'text-purple-800 dark:text-purple-200 font-semibold'
                      )}
                    >
                      {option}
                    </span>
                  </div>

                  {/* Vote count and percentage */}
                  {showVoteCounts && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-600 dark:text-gray-300">
                        {voteCount}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-gray-400 min-w-[3rem] text-right">
                        {percentage}%
                      </span>
                    </div>
                  )}

                  {/* User vote indicator */}
                  {isUserVote && (
                    <div className="ml-2">
                      <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">✓ Your vote</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Messages */}
        {isParticipant && (
          <div className="text-center">
            {hasVoted ? (
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  ✅ Vote submitted! {poll.isActive ? 'Waiting for results...' : ''}
                </p>
              </div>
            ) : poll.isActive ? (
              <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  👆 Tap an option to cast your vote
                </p>
              </div>
            ) : (
              <div className="bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg p-3">
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  📊 Poll closed - Results shown above
                </p>
              </div>
            )}
          </div>
        )}

        {/* Poll Status */}
        <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-gray-400">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              poll.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400 dark:bg-gray-500'
            )}
          />
          <span>
            {poll.isActive ? 'Live Poll - Accepting Votes' : 'Poll Closed'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}