import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Poll } from '@/types/polling';
import { cn } from '@/lib/utils';

interface PollControlsProps {
  currentPoll: Poll | null;
  onClosePoll: () => void;
  onToggleResults: () => void;
  onNewPoll?: () => void; // Make optional since we removed the button
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
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100 text-lg">
          Poll Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Votes Display */}
        {hasPoll && (
          <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-6 border border-gray-200 dark:border-dark-600 text-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{totalVotes}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Votes</div>
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


      </CardContent>
    </Card>
  );
}