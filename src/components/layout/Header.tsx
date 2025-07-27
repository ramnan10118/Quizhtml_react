import * as React from 'react'
import { cn } from '@/components/ui'

interface HeaderProps {
  title: string
  subtitle?: string
  className?: string
  children?: React.ReactNode
}

export function Header({ title, subtitle, className, children }: HeaderProps) {
  return (
    <header
      className={cn(
        'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900',
        'dark:from-background dark:via-card dark:to-background',
        'backdrop-blur-md border-b border-border',
        'text-white dark:text-foreground px-6 py-4 sticky top-0 z-50',
        'shadow-xl shadow-slate-900/20 dark:shadow-background/40',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-300 dark:text-muted-foreground text-sm mt-1 font-medium">
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
  )
}