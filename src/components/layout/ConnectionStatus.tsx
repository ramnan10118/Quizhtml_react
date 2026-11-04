import React from 'react';
import { cn } from '@/lib/utils';
import { ConnectionStatus as ConnectionStatusType } from '@/types/quiz';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  className?: string;
  /** Hide the text label on small screens */
  compact?: boolean;
}

export function ConnectionStatus({ status, className, compact = false }: ConnectionStatusProps) {
  // Strip any leading emoji the hook may prepend to the message.
  const message = status.connectionMessage.replace(/^[^A-Za-z0-9]+/, '').trim();
  return (
    <div
      role="status"
      aria-live="polite"
      title={message}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium',
        status.isConnected
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-destructive/30 bg-destructive/10 text-destructive',
        className
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status.isConnected ? 'bg-success animate-live-dot' : 'bg-destructive'
        )}
      />
      <span className={cn(compact && 'sr-only sm:not-sr-only')}>{status.isConnected ? 'Connected' : message || 'Offline'}</span>
    </div>
  );
}
