import * as React from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AnswerOptionState =
  | 'default'
  | 'selected'
  | 'correct'
  | 'wrong'
  | 'highlighted'
  | 'dimmed'

interface AnswerOptionProps {
  label: string
  text: React.ReactNode
  state?: AnswerOptionState
  /** Renders as a button with a large tap target */
  onSelect?: () => void
  disabled?: boolean
  size?: 'md' | 'lg'
  trailing?: React.ReactNode
  className?: string
}

const stateClasses: Record<AnswerOptionState, string> = {
  default: 'border-border bg-surface text-foreground',
  selected: 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40',
  correct: 'border-success bg-success/10 text-foreground ring-1 ring-success/40',
  wrong: 'border-destructive/70 bg-destructive/10 text-foreground',
  highlighted: 'border-info bg-info/15 text-foreground scale-[1.015] ring-1 ring-info/40',
  dimmed: 'border-border bg-surface text-muted-foreground opacity-55',
}

const labelClasses: Record<AnswerOptionState, string> = {
  default: 'bg-muted text-muted-foreground',
  selected: 'bg-primary text-primary-foreground',
  correct: 'bg-success text-success-foreground',
  wrong: 'bg-destructive text-destructive-foreground',
  highlighted: 'bg-info text-info-foreground',
  dimmed: 'bg-muted text-muted-foreground',
}

/**
 * One answer row: letter chip + text + optional trailing slot.
 * Interactive when `onSelect` is given (min 56px tall on `lg`).
 */
export function AnswerOption({
  label,
  text,
  state = 'default',
  onSelect,
  disabled,
  size = 'md',
  trailing,
  className,
}: AnswerOptionProps) {
  const interactive = typeof onSelect === 'function'
  const base = cn(
    'flex w-full items-center gap-3 rounded-lg border text-left transition-[background-color,border-color,transform,box-shadow,opacity] duration-150',
    size === 'lg' ? 'min-h-14 px-4 py-3' : 'min-h-12 px-3.5 py-2.5',
    stateClasses[state],
    interactive && !disabled && 'cursor-pointer hover:border-muted-foreground/50 active:scale-[0.99]',
    interactive && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    disabled && 'cursor-not-allowed',
    className
  )

  const content = (
    <>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md font-display font-bold tabular',
          size === 'lg' ? 'h-9 w-9 text-base' : 'h-8 w-8 text-sm',
          labelClasses[state]
        )}
        aria-hidden="true"
      >
        {state === 'correct' ? <Check className="h-4 w-4" /> : state === 'wrong' ? <X className="h-4 w-4" /> : label}
      </span>
      <span className={cn('min-w-0 flex-1 leading-snug', size === 'lg' ? 'text-base sm:text-lg' : 'text-sm sm:text-[15px]', (state === 'correct' || state === 'selected') && 'font-semibold')}>
        {text}
      </span>
      {trailing && <span className="flex shrink-0 items-center gap-1.5">{trailing}</span>}
    </>
  )

  if (interactive) {
    return (
      <button type="button" onClick={onSelect} disabled={disabled} aria-pressed={state === 'selected'} className={base}>
        {content}
      </button>
    )
  }

  return <div className={base}>{content}</div>
}
