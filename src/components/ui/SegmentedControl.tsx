'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  disabled?: boolean
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  className?: string
  size?: 'sm' | 'md'
  'aria-label'?: string
}

/** Pill-style segmented control. Presentational; parent owns the value. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
  ...rest
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={rest['aria-label']}
      className={cn(
        'inline-flex w-full items-stretch gap-1 rounded-lg border border-border bg-surface-raised p-1',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md font-medium transition-[background-color,color,box-shadow] duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:opacity-50 disabled:pointer-events-none [&_svg]:size-4',
              size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-10 px-3 text-sm',
              active
                ? 'bg-card text-foreground shadow-card'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {opt.icon}
            <span className="truncate">{opt.label}</span>
            {opt.badge}
          </button>
        )
      })}
    </div>
  )
}
