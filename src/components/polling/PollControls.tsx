import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Poll } from '@/types/polling';
import { cn } from '@/lib/utils';

interface PollControlsProps {
  currentPoll: Poll | null;
  onClosePoll: () => void;
  onToggleResults: () => void;
  onNewPoll: () => void;
  showResults: boolean;
  totalVotes: number;
  className?: string;
}

export function PollControls({
  currentPoll,
  onClosePoll,
  onToggleResults,
  onNewPoll,
  showResults,
  totalVotes,
  className
}: PollControlsProps) {
  const hasActivePoll = currentPoll?.isActive;
  const hasPoll = currentPoll !== null;

  return (
    <Card className={cn('w-full bg-gradient-to-br from-slate-50 to-slate-100', className)}>
      <CardHeader>
        <CardTitle className="text-slate-700 flex items-center space-x-2">
          <span>🎛️</span>
          <span>Poll Controls</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Poll Status */}
        {hasPoll && (
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-600">Current Poll Status</div>
              <div
                className={cn(
                  'flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium',
                  hasActivePoll
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                )}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    hasActivePoll ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  )}
                />
                <span>{hasActivePoll ? 'Live & Accepting Votes' : 'Closed'}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-slate-800">{totalVotes}</div>
                <div className="text-xs text-slate-600 whitespace-nowrap">Total Votes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{currentPoll.options.length}</div>
                <div className="text-xs text-slate-600 whitespace-nowrap">Options</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Results Toggle */}
          {hasPoll && (
            <Button
              onClick={onToggleResults}
              className="w-full"
              variant={showResults ? "default" : "outline"}
            >
              {showResults ? (
                <>📊 Hide Live Results</>
              ) : (
                <>👁️ Show Live Results</>
              )}
            </Button>
          )}

          {/* Close Poll */}
          {hasActivePoll && (
            <Button
              onClick={onClosePoll}
              className="w-full bg-red-600 hover:bg-red-700"
              variant="destructive"
            >
              🔒 Close Current Poll
            </Button>
          )}

          {/* New Poll */}
          <Button
            onClick={onNewPoll}
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={hasActivePoll}
          >
            ➕ Create New Poll
          </Button>

          {/* Commented out for now - can bring back later */}
          {/* {hasActivePoll && (
            <Button
              onClick={onNewPoll}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={false}
            >
              ⏳ Close current poll to create new one
            </Button>
          )} */}
        </div>

        {/* Guidelines */}
        <div className="text-xs text-slate-500 bg-slate-100 rounded-lg p-3">
          <p className="font-medium mb-2">💡 Host Guidelines:</p>
          <ul className="space-y-1">
            <li>• Allow participants time to vote before showing results</li>
            <li>• Close polls when you&apos;re ready to move on</li>
            <li>• Create engaging questions to boost participation</li>
            <li>• Use results to facilitate discussion</li>
          </ul>
        </div>

        {/* Quick Stats */}
        {hasPoll && totalVotes > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-blue-800">
              <span>📈</span>
              <span className="text-sm font-medium">
                {totalVotes} participant{totalVotes !== 1 ? 's' : ''} voted
                {hasActivePoll && ' so far'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}