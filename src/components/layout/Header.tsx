import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, className, children }: HeaderProps) {
  return (
    <header
      className={cn(
        'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900',
        'dark:from-dark-900 dark:via-dark-800 dark:to-dark-900',
        'backdrop-blur-md border-b border-white/10 dark:border-dark-700',
        'text-white dark:text-gray-100 px-6 py-4 sticky top-0 z-50',
        'shadow-xl shadow-slate-900/20 dark:shadow-dark-900/40',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-300 dark:text-gray-400 text-sm mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="flex items-center space-x-4">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}