import * as React from 'react'
import { BarChart3, Gamepad2, Settings, Users } from 'lucide-react'
import { cn } from '@/components/ui'
import { QuizMode } from '@/types/quiz'

export type HostDashboardTab = 'control' | 'participants' | 'results' | 'settings'

interface TabInfo {
  id: HostDashboardTab
  label: string
  icon: React.ReactNode
  description: string
  modeRestrictions?: QuizMode[]
}

const TAB_CONFIG: TabInfo[] = [
  {
    id: 'control',
    label: 'Control',
    icon: <Gamepad2 />,
    description: 'Quiz controls and management'
  },
  {
    id: 'participants',
    label: 'Participants',
    icon: <Users />,
    description: 'Participant management and monitoring'
  },
  {
    id: 'results',
    label: 'Results',
    icon: <BarChart3 />,
    description: 'Results, leaderboards, and analytics'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings />,
    description: 'Quiz configuration and options'
  }
]

interface HostDashboardTabsProps {
  currentTab: HostDashboardTab
  onTabChange: (tab: HostDashboardTab) => void
  mode: QuizMode
  participantCount?: number
  submissionCount?: number
  className?: string
}

export function HostDashboardTabs({
  currentTab,
  onTabChange,
  mode,
  participantCount = 0,
  submissionCount = 0,
  className
}: HostDashboardTabsProps) {

  const getTabLabel = (tab: TabInfo) => {
    switch (tab.id) {
      case 'results':
        if (mode === 'basic') return 'Results'
        if (mode === 'scheduled') return 'Leaderboard'
        return 'Results'
      default:
        return tab.label
    }
  }

  const getTabBadge = (tab: TabInfo) => {
    switch (tab.id) {
      case 'participants':
        return participantCount > 0 ? participantCount : null
      case 'results':
        if (mode === 'basic' || mode === 'scheduled') {
          return submissionCount > 0 ? submissionCount : null
        }
        return null
      default:
        return null
    }
  }

  const isTabAvailable = (tab: TabInfo) => {
    if (tab.modeRestrictions) {
      return tab.modeRestrictions.includes(mode)
    }
    return true
  }

  const current = TAB_CONFIG.find(t => t.id === currentTab)

  return (
    <div className={cn('mb-5', className)}>
      <div role="tablist" aria-label="Host sections" className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface-raised p-1">
        {TAB_CONFIG.filter(isTabAvailable).map((tab) => {
          const isActive = currentTab === tab.id
          const badge = getTabBadge(tab)

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium',
                'transition-[background-color,color,box-shadow] duration-150 [&_svg]:size-4 [&_svg]:shrink-0',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-card text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              <span className="hidden truncate sm:inline">{getTabLabel(tab)}</span>
              {badge && (
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab description for mobile */}
      <p className="mt-2 text-center text-xs text-muted-foreground sm:hidden">
        {current ? `${getTabLabel(current)} · ${current.description}` : ''}
      </p>
    </div>
  )
}
