import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface BuzzerButtonProps {
  onBuzz: () => void;
  disabled?: boolean;
  canBuzz?: boolean;
  className?: string;
}

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

  return (
    <div
      className={cn(
        'fixed bottom-10 sm:bottom-12 left-1/2 transform -translate-x-1/2 z-50',
        'touch-manipulation select-none',
        className
      )}
    >
      <Button
        variant="buzz"
        size="buzz"
        onClick={handleBuzz}
        disabled={disabled || !canBuzz}
        className={cn(
          'animate-pulse',
          disabled || !canBuzz ? 'animate-none opacity-60' : 'animate-[shake_0.5s_ease-in-out_infinite]',
          'shadow-2xl shadow-red-500/40'
        )}
      >
        BUZZ!
      </Button>
    </div>
  );
}