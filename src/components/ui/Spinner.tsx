import * as React from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
}

export function Spinner({ className, size = 'md', label }: SpinnerProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)} role="status" aria-live="polite">
      <span
        className={cn(
          'inline-block animate-spin rounded-full border-muted-foreground/30 border-t-primary',
          sizes[size]
        )}
      />
      {label ? <span className="text-sm text-muted-foreground">{label}</span> : <span className="sr-only">Loading</span>}
    </span>
  )
}

/** Full-viewport loading state with a centred spinner. */
export function LoadingScreen({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="app-bg flex min-h-screen items-center justify-center px-4">
      <Spinner size="lg" label={label} className="flex-col gap-3" />
    </div>
  )
}
