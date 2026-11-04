import * as React from 'react'
import { cn } from '@/lib/utils'

interface ItemCardProps {
  icon: React.ReactNode
  title: string
  badge?: React.ReactNode
  meta?: React.ReactNode[]
  actions?: React.ReactNode
  accent?: 'default' | 'live' | 'success' | 'info'
  className?: string
  style?: React.CSSProperties
}

const accents = {
  default: 'before:bg-transparent',
  live: 'before:bg-destructive',
  success: 'before:bg-success',
  info: 'before:bg-info',
}

/** List/grid card for dashboard entities (drafts, live sessions, history). */
export function ItemCard({ icon, title, badge, meta = [], actions, accent = 'default', className, style }: ItemCardProps) {
  return (
    <article
      style={style}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-[border-color,transform,box-shadow] duration-150',
        'before:absolute before:inset-y-0 before:left-0 before:w-1',
        'hover:-translate-y-0.5 hover:border-muted-foreground/40 hover:shadow-raised',
        accents[accent],
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-3 p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-[18px]">
              {icon}
            </span>
            <h3 className="min-w-0 truncate font-display text-base font-semibold text-foreground" title={title}>
              {title}
            </h3>
          </div>
          {badge}
        </div>
        {meta.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {meta.map((m, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span aria-hidden="true" className="text-border">·</span>}
                <span>{m}</span>
              </React.Fragment>
            ))}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 border-t border-border bg-surface-raised/60 px-4 py-3 pl-5">{actions}</div>}
    </article>
  )
}
