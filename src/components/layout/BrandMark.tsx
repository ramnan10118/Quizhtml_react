import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  href?: string
  showWordmark?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/** Logo: a buzzer dot inside a rounded square, plus the wordmark. */
export function BrandMark({ href = '/', showWordmark = true, size = 'md', className }: BrandMarkProps) {
  const box = size === 'sm' ? 'h-7 w-7 rounded-[8px]' : 'h-8 w-8 rounded-[9px]'
  const content = (
    <span className={cn('inline-flex items-center gap-2.5 no-select', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center bg-primary text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.3)]',
          box
        )}
      >
        <svg viewBox="0 0 24 24" className={size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]'} fill="none">
          <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="2.2" opacity="0.55" />
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
        </svg>
      </span>
      {showWordmark && (
        <span className={cn('font-display font-bold tracking-tight text-foreground', size === 'sm' ? 'text-[15px]' : 'text-base')}>
          Audience<span className="text-muted-foreground"> Voice</span>
        </span>
      )}
    </span>
  )

  if (!href) return content
  return (
    <Link href={href} className="rounded-md focus-ring" aria-label="Audience Voice home">
      {content}
    </Link>
  )
}
