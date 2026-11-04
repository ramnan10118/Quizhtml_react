'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ListChecks, Vote } from 'lucide-react'
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
  /** Sidebar links. Defaults to the primary app sections. */
  nav?: AppNavItem[]
  /** Bottom of the sidebar on desktop, right of the top bar on mobile (user menu, status, etc.) */
  actions?: React.ReactNode
  /** Optional page heading block above the content */
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

export const DEFAULT_APP_NAV: AppNavItem[] = [
  { href: '/dashboard', label: 'Quiz', icon: <ListChecks /> },
  { href: '/polling/host', label: 'Polls', icon: <Vote />, prefix: true },
]

function NavLinks({ items, pathname, vertical }: { items: AppNavItem[]; pathname: string | null; vertical: boolean }) {
  return (
    <>
      {items.map((item) => {
        const active = item.prefix ? pathname?.startsWith(item.href) : pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors focus-ring [&_svg]:size-4 [&_svg]:shrink-0',
              vertical ? 'h-10 w-full px-3' : 'h-9 shrink-0 px-3',
              active
                ? 'bg-accent text-foreground shadow-[inset_2px_0_0_hsl(var(--primary))]'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        )
      })}
    </>
  )
}

/**
 * Authenticated app chrome: a fixed left sidebar (brand, navigation, actions)
 * on desktop, a compact top bar on small screens, and a width-constrained main
 * area with an optional page heading on an atmospheric background.
 */
export function AppShell({
  children,
  nav = DEFAULT_APP_NAV,
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
    <div className={cn('app-bg flex min-h-screen', className)}>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/80 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 md:flex">
        <div className="flex h-14 items-center border-b border-border/80 px-4">
          <BrandMark />
        </div>
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <NavLinks items={nav} pathname={pathname} vertical />
        </nav>
        {actions && (
          <div className="flex flex-col gap-2 border-t border-border/80 p-3 [&>*]:w-full [&_button]:w-full [&_button]:justify-start">
            {actions}
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 md:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            <BrandMark />
            <div className="ml-auto flex items-center gap-2">{actions}</div>
          </div>
          {nav.length > 0 && (
            <nav aria-label="Primary mobile" className="flex gap-1 overflow-x-auto px-4 pb-2">
              <NavLinks items={nav} pathname={pathname} vertical={false} />
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
    </div>
  )
}
