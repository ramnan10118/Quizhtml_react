import * as React from 'react'
import { ArrowRight, CalendarClock, Check, ListChecks, Zap } from 'lucide-react'
import { Button, Badge, cn } from '@/components/ui'
import { QuizMode, QuizSettings } from '@/types/quiz'

const { useState } = React

interface QuizModeOption {
  mode: QuizMode
  title: string
  description: string
  features: string[]
  icon: React.ReactNode
  recommended?: boolean
}

const QUIZ_MODES: QuizModeOption[] = [
  {
    mode: 'buzzer',
    title: 'Buzzer',
    description: 'Live, head-to-head. Fastest buzz wins the floor.',
    features: [
      'Live competitive buzzing',
      'Real-time leaderboards',
      'Host-controlled question flow',
      'Instant celebrations'
    ],
    icon: <Zap />,
    recommended: true
  },
  {
    mode: 'basic',
    title: 'Self-paced',
    description: 'Everyone answers on their own device, at their own pace.',
    features: [
      'Self-paced progression',
      'Immediate results',
      'Individual submissions',
      'Offline capability'
    ],
    icon: <ListChecks />
  },
  {
    mode: 'scheduled',
    title: 'Scheduled reveal',
    description: 'Collect answers first, then reveal results on your cue.',
    features: [
      'Collect submissions first',
      'Host-controlled reveals',
      'Leaderboard management',
      'Strategic result timing'
    ],
    icon: <CalendarClock />
  }
]

interface QuizModeSelectorProps {
  currentMode?: QuizMode
  onModeSelect: (mode: QuizMode, settings: QuizSettings) => void
  className?: string
  isHost?: boolean
}

export function QuizModeSelector({
  currentMode,
  onModeSelect,
  className,
  isHost = false
}: QuizModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<QuizMode>(currentMode || 'buzzer')
  const [showSettings, setShowSettings] = useState(false)

  const handleModeSelection = (mode: QuizMode) => {
    setSelectedMode(mode)

    // Default settings for each mode
    const defaultSettings: QuizSettings = {
      mode,
      timeLimit: mode === 'basic' ? 300 : undefined, // 5 minutes for basic
      allowRetakes: mode === 'basic',
      showCorrectAnswers: mode !== 'scheduled',
      passingScore: mode === 'basic' ? 70 : undefined
    }

    onModeSelect(mode, defaultSettings)
  }

  const selectedModeData = QUIZ_MODES.find(m => m.mode === selectedMode)

  return (
    <div className={cn('space-y-6', className)}>
      <div role="radiogroup" aria-label="Quiz mode" className="grid gap-4 md:grid-cols-3">
        {QUIZ_MODES.map((mode, i) => {
          const active = selectedMode === mode.mode
          return (
            <div
              key={mode.mode}
              role="radio"
              tabIndex={0}
              aria-checked={active}
              onClick={() => handleModeSelection(mode.mode)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleModeSelection(mode.mode)
                }
              }}
              className={cn(
                'group relative flex h-full cursor-pointer flex-col rounded-xl border bg-card p-5 text-left shadow-card transition-[border-color,box-shadow,transform] duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'animate-fade-up',
                active
                  ? 'border-primary ring-1 ring-primary/50 shadow-glow'
                  : 'border-border hover:border-muted-foreground/50 hover:-translate-y-0.5'
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-lg [&_svg]:size-5 transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {mode.icon}
                </span>
                <div className="flex items-center gap-2">
                  {mode.recommended && <Badge variant="secondary">Popular</Badge>}
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                      active ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                    )}
                    aria-hidden="true"
                  >
                    {active && <Check className="h-3 w-3" />}
                  </span>
                </div>
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{mode.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{mode.description}</p>
              <ul className="mt-4 space-y-1.5">
                {mode.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-foreground/85">
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', active ? 'bg-primary' : 'bg-muted-foreground/50')} />
                    {feature}
                  </li>
                ))}
              </ul>
              {active && (
                <div className="mt-5 border-t border-border pt-4">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleModeSelection(mode.mode)
                    }}
                  >
                    {isHost ? 'Start hosting' : 'Continue'} <ArrowRight />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedModeData && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{selectedModeData.title}</span>
          <span>selected.</span>
          <span>{selectedModeData.description}</span>
        </div>
      )}
    </div>
  )
}
