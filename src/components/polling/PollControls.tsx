import React from 'react';
import { Eye, EyeOff, Lock, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" /> Poll controls
        </CardTitle>
        <CardDescription>
          {hasActivePoll ? 'Accepting votes' : hasPoll ? 'Poll closed' : 'No poll running'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Total Votes Display */}
        {hasPoll && (
          <div className="rounded-xl border border-border bg-surface-raised p-5 text-center">
            <p className="eyebrow">Total votes</p>
            <p className="mt-1 font-display text-4xl font-bold tabular text-foreground">{totalVotes}</p>
            <Badge variant={hasActivePoll ? 'live' : 'secondary'} className="mt-3">
              {hasActivePoll ? 'Live' : 'Closed'}
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Results Toggle */}
          {hasPoll && (
            <Button
              onClick={onToggleResults}
              className="w-full"
              variant={showResults ? 'default' : 'outline'}
            >
              {showResults ? <EyeOff /> : <Eye />}
              {showResults ? 'Hide live results' : 'Show live results'}
            </Button>
          )}

          {/* Close Poll */}
          {hasActivePoll && (
            <Button onClick={onClosePoll} className="w-full" variant="destructive">
              <Lock /> Close current poll
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
