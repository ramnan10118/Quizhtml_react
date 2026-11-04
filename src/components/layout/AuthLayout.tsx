import * as React from 'react'
import Link from 'next/link'
import { BarChart3, Sparkles, Zap } from 'lucide-react'
import { BrandMark } from './BrandMark'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

const points = [
  { icon: <Zap />, text: 'Every phone becomes a buzzer' },
  { icon: <BarChart3 />, text: 'Leaderboards and per-question analytics' },
  { icon: <Sparkles />, text: 'AI drafts your questions in seconds' },
]

/** Split auth layout: brand panel on large screens, form card on the right. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="app-bg flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden flex-col justify-between border-r border-border bg-surface/60 p-10 lg:flex lg:w-[42%] xl:w-[40%]">
        <BrandMark />
        <div className="max-w-md">
          <p className="eyebrow mb-3">Audience Voice</p>
          <h2 className="font-display text-3xl font-bold leading-tight text-foreground">
            Quizzes, buzzers and polls. One control room.
          </h2>
          <ul className="mt-8 space-y-4">
            {points.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-sm text-foreground/90">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary [&_svg]:size-4">
                  {p.icon}
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          Participants never need an account. Share a link, they&apos;re in.
        </p>
      </aside>

      <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 lg:hidden">
          <BrandMark />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div className="mb-6 animate-fade-up">
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card animate-fade-up sm:p-8" style={{ animationDelay: '60ms' }}>
            {children}
          </div>
          {footer && <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">{footer}</div>}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link href="/mode" className="hover:text-foreground focus-ring rounded">Continue without an account</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
