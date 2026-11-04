import * as React from 'react'
import { cn } from '@/components/ui'
import { BrandMark } from './BrandMark'

interface HeaderProps {
  title: string
  subtitle?: string
  className?: string
  children?: React.ReactNode
}

/**
 * Compact session bar used on live screens (host, participant, polling).
 * Brand mark on the left, page title + status line, actions on the right.
 */
export function Header({ title, subtitle, className, children }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70',
        className
      )}
    >
      <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
        <BrandMark showWordmark={false} size="sm" />
        <div className="h-5 w-px bg-border" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[15px] font-semibold leading-tight text-foreground sm:text-base">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground sm:text-[13px]">{subtitle}</p>
          )}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </header>
  )
}
