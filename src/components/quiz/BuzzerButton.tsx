import * as React from 'react'
import { Lock } from 'lucide-react'
import { Button, cn, QUIZ_VARIANTS } from '@/components/ui'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface BuzzerButtonProps {
  onBuzz: () => void;
  disabled?: boolean;
  canBuzz?: boolean;
  className?: string;
}

/**
 * Big round buzzer pinned to the bottom of the participant screen.
 * Enabled: red with a pulsing ring. Locked: muted, with a lock glyph.
 */
export function BuzzerButton({ onBuzz, disabled = false, canBuzz = true, className }: BuzzerButtonProps) {
  const { buzz, error } = useHapticFeedback();

  const handleBuzz = () => {
    if (canBuzz && !disabled) {
      buzz();
      onBuzz();
    } else {
      error();
    }
  };

  const locked = disabled || !canBuzz

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6',
        'bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none',
        className
      )}
    >
      <Button
        {...QUIZ_VARIANTS.buzzer}
        onClick={handleBuzz}
        disabled={locked}
        aria-label={locked ? 'Buzzer locked' : 'Buzz in'}
        className={cn(
          'pointer-events-auto flex-col gap-1 leading-none',
          !locked && 'animate-ring-pulse'
        )}
      >
        {locked ? (
          <>
            <Lock className="!size-8" />
            <span className="text-base tracking-widest">Locked</span>
          </>
        ) : (
          <span>Buzz</span>
        )}
      </Button>
      <p className="pointer-events-none text-center text-xs font-medium text-muted-foreground">
        {locked ? 'Wait for the host to reset the buzzer' : 'Tap as soon as you know the answer'}
      </p>
    </div>
  );
}
