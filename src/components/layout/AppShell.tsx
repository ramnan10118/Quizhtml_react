'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandMark } from './BrandMark'

export interface AppNavItem {
  href: string
  label: string
  icon?: React.ReactNode
  /** Match on prefix instead of exact pathname */
  prefix?: boolean
}

interface AppShellProps {
  children: React.ReactNode
  nav?: AppNavItem[]
  /** Right side of the top bar (user menu, sign out, etc.) */
  actions?: React.ReactNode
  /** Optional page heading block under the top bar */
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  subtitle?: React.ReactNode
  headingActions?: React.ReactNode
  backHref?: string
  backLabel?: string
  maxWidth?: 'lg' | 'xl' | '2xl' | 'full'
  className?: string
  mainClassName?: string
}

const widths = {
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-none',
}

/**
 * Authenticated app chrome: sticky top bar with brand + nav, optional
 * page heading, and a width-constrained main area on an atmospheric background.
 */
export function AppShell({
  children,
  nav = [],
  actions,
  eyebrow,
  title,
  subtitle,
  headingActions,
  backHref,
  backLabel = 'Back',
  maxWidth = '2xl',
  className,
  mainClassName,
}: AppShellProps) {
  const pathname = usePathname()
  const width = widths[maxWidth]

  return (
    <div className={cn('app-bg flex min-h-screen flex-col', className)}>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className={cn('mx-auto flex h-14 w-full items-center gap-3 px-4 sm:px-6', width)}>
          <BrandMark />
          {nav.length > 0 && (
            <nav aria-label="Primary" className="ml-2 hidden items-center gap-1 md:flex">
              {nav.map((item) => {
                const active = item.prefix ? pathname?.startsWith(item.href) : pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-ring [&_svg]:size-4',
                      active
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          )}
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </div>
        {nav.length > 0 && (
          <nav aria-label="Primary mobile" className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
            {nav.map((item) => {
              const active = item.prefix ? pathname?.startsWith(item.href) : pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors [&_svg]:size-4',
                    active ? 'bg-accent text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}
      </header>

      {(title || backHref) && (
        <div className={cn('mx-auto w-full px-4 pt-6 sm:px-6 sm:pt-8', width)}>
          {backHref && (
            <Link
              href={backHref}
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-ring rounded-md"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          )}
          {title && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
                <h1 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
              </div>
              {headingActions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{headingActions}</div>}
            </div>
          )}
        </div>
      )}

      <main className={cn('mx-auto w-full flex-1 px-4 py-6 sm:px-6 sm:py-8', width, mainClassName)}>{children}</main>
    </div>
  )
}
