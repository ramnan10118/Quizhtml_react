import * as React from 'react'
import { cn } from '@/lib/utils'

type Tone = 'default' | 'primary' | 'success' | 'info' | 'warning' | 'destructive'

interface StatTileProps {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ReactNode
  tone?: Tone
  className?: string
}

const toneClasses: Record<Tone, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  destructive: 'text-destructive',
}

const iconToneClasses: Record<Tone, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  info: 'bg-info/15 text-info',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/15 text-destructive',
}

/** Compact KPI tile. Value stays tabular so updates never shift layout. */
export function StatTile({ label, value, hint, icon, tone = 'default', className }: StatTileProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card',
        className
      )}
    >
      <div className="min-w-0">
        <p className="eyebrow truncate">{label}</p>
        <p className={cn('mt-1.5 font-display text-2xl font-bold leading-none tabular sm:text-[28px]', toneClasses[tone])}>
          {value}
        </p>
        {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {icon && (
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-[18px]', iconToneClasses[tone])}>
          {icon}
        </div>
      )}
    </div>
  )
}
