import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from '@/components/ui'
import { QuizMode, QuizSettings } from '@/types/quiz'

const { useState } = React

interface QuizModeOption {
  mode: QuizMode
  title: string
  description: string
  features: string[]
  icon: string
  recommended?: boolean
}

const QUIZ_MODES: QuizModeOption[] = [
  {
    mode: 'buzzer',
    title: 'Buzzer Quiz',
    description: 'Real-time competitive quiz with buzzing system',
    features: [
      'Live competitive buzzing',
      'Real-time leaderboards',
      'Host-controlled question flow',
      'Instant celebrations'
    ],
    icon: '⚡',
    recommended: true
  },
  {
    mode: 'basic',
    title: 'Basic Quiz',
    description: 'Individual assessment at participant\'s own pace',
    features: [
      'Self-paced progression',
      'Immediate results',
      'Individual submissions',
      'Offline capability'
    ],
    icon: '📝'
  },
  {
    mode: 'scheduled',
    title: 'Scheduled Quiz',
    description: 'Async competitive with controlled reveals',
    features: [
      'Collect submissions first',
      'Host-controlled reveals',
      'Leaderboard management',
      'Strategic result timing'
    ],
    icon: '📅'
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
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Choose Quiz Mode</h2>
        <p className="text-muted-foreground">
          {isHost ? 'Select how you want to run your quiz' : 'Select how you want to participate'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {QUIZ_MODES.map((mode) => (
          <Card 
            key={mode.mode}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-lg',
              selectedMode === mode.mode 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:border-primary/50',
              'relative'
            )}
            onClick={() => handleModeSelection(mode.mode)}
          >
            {mode.recommended && (
              <Badge 
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground"
                variant="default"
              >
                Popular
              </Badge>
            )}
            
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl" role="img" aria-label={mode.title}>
                  {mode.icon}
                </span>
                <CardTitle className="text-lg">{mode.title}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                {mode.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {mode.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {selectedMode === mode.mode && (
                <div className="pt-2 border-t">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleModeSelection(mode.mode)
                    }}
                  >
                    {isHost ? 'Start Hosting' : 'Join Quiz'} →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedModeData && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <span className="text-xl mt-0.5">{selectedModeData.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  {selectedModeData.title} Selected
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedModeData.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedModeData.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}