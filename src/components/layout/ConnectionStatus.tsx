import React from 'react';
import { cn } from '@/lib/utils';
import { ConnectionStatus as ConnectionStatusType } from '@/types/quiz';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  className?: string;
}

export function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  return (
    <div
      className={cn(
        'flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium',
        'transition-all duration-200',
        status.isConnected
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-red-100 text-red-800 border border-red-200',
        className
      )}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          status.isConnected ? 'bg-green-500' : 'bg-red-500'
        )}
      />
      <span>{status.connectionMessage}</span>
    </div>
  );
}