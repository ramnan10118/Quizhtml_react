import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  size?: 'xs' | 'sm' | 'md'
  tone?: 'primary' | 'success' | 'info' | 'destructive' | 'muted'
  label?: string
}

const tones = {
  primary: 'bg-primary',
  success: 'bg-success',
  info: 'bg-info',
  destructive: 'bg-destructive',
  muted: 'bg-muted-foreground/60',
}

const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' }

/** Simple determinate bar. Width is a transform so it never reflows. */
export function Progress({ value, max = 100, className, barClassName, size = 'sm', tone = 'primary', label }: ProgressProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-muted', heights[size], className)}
    >
      <div
        className={cn('h-full origin-left rounded-full transition-transform duration-500 ease-out', tones[tone], barClassName)}
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </div>
  )
}
