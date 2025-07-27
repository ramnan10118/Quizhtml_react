import * as React from 'react'
import { Card, CardContent, Badge, cn } from '@/components/ui'
import { QuizMode } from '@/types/quiz'

const { useState } = React

export type HostDashboardTab = 'control' | 'participants' | 'results' | 'settings'

interface TabInfo {
  id: HostDashboardTab
  label: string
  icon: string
  description: string
  modeRestrictions?: QuizMode[]
}

const TAB_CONFIG: TabInfo[] = [
  {
    id: 'control',
    label: 'Control Panel',
    icon: '🎮',
    description: 'Quiz controls and management'
  },
  {
    id: 'participants',
    label: 'Participants',
    icon: '👥',
    description: 'Participant management and monitoring'
  },
  {
    id: 'results',
    label: 'Results',
    icon: '📊',
    description: 'Results, leaderboards, and analytics'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
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

  return (
    <Card className={cn('mb-6', className)}>
      <CardContent className="p-0">
        <div className="flex border-b border-border">
          {TAB_CONFIG.filter(isTabAvailable).map((tab) => {
            const isActive = currentTab === tab.id
            const badge = getTabBadge(tab)
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center space-x-2 py-3 px-4',
                  'text-sm font-medium transition-all duration-200',
                  'border-b-2 border-transparent',
                  'hover:bg-muted/50',
                  isActive 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="text-base" role="img" aria-hidden="true">
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">
                  {getTabLabel(tab)}
                </span>
                {badge && (
                  <Badge 
                    variant={isActive ? "default" : "secondary"}
                    className="ml-1 text-xs min-w-[20px] h-5"
                  >
                    {badge > 99 ? '99+' : badge}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
        
        {/* Tab description for mobile */}
        <div className="sm:hidden p-3 bg-muted/30 border-b">
          <p className="text-xs text-muted-foreground text-center">
            {TAB_CONFIG.find(t => t.id === currentTab)?.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}