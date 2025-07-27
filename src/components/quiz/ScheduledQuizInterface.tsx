import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from '@/components/ui'
import { QuizQuestion, ParticipantAnswer, LeaderboardEntry, RevealState } from '@/types/quiz'
import { getOptionLabel } from '@/lib/utils'

const { useState, useEffect } = React

interface ScheduledQuizInterfaceProps {
  questions: QuizQuestion[]
  participantName: string
  onSubmitAnswers: (answers: ParticipantAnswer[]) => void
  revealedQuestions?: RevealState[]
  leaderboard?: LeaderboardEntry[]
  leaderboardVisible?: boolean
  announcements?: Array<{ message: string; timestamp: number }>
  isSubmitted?: boolean
  className?: string
}

type ViewMode = 'quiz' | 'waiting' | 'results'

export function ScheduledQuizInterface({
  questions,
  participantName,
  onSubmitAnswers,
  revealedQuestions = [],
  leaderboard = [],
  leaderboardVisible = false,
  announcements = [],
  isSubmitted = false,
  className
}: ScheduledQuizInterfaceProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('quiz')
  const [answers, setAnswers] = useState<ParticipantAnswer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-switch to results view when questions are revealed
  useEffect(() => {
    if (isSubmitted && revealedQuestions.some(r => r.isRevealed)) {
      setCurrentView('results')
    } else if (isSubmitted) {
      setCurrentView('waiting')
    }
  }, [isSubmitted, revealedQuestions])

  const handleAnswer = (selectedOption: number) => {
    const newAnswer: ParticipantAnswer = {
      questionIndex: currentQuestionIndex,
      selectedOption,
      timestamp: Date.now()
    }

    setAnswers(prev => [
      ...prev.filter(a => a.questionIndex !== currentQuestionIndex),
      newAnswer
    ])
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    // Fill in missing answers with -1
    const completeAnswers: ParticipantAnswer[] = questions.map((_, index) => {
      const existingAnswer = answers.find(a => a.questionIndex === index)
      return existingAnswer || {
        questionIndex: index,
        selectedOption: -1,
        timestamp: Date.now()
      }
    })

    try {
      onSubmitAnswers(completeAnswers)
      setCurrentView('waiting')
    } catch (error) {
      console.error('Failed to submit answers:', error)
      setIsSubmitting(false)
    }
  }

  const getCurrentAnswer = () => {
    return answers.find(a => a.questionIndex === currentQuestionIndex)?.selectedOption
  }

  const getAnsweredCount = () => {
    return answers.length
  }

  const getRevealedCount = () => {
    return revealedQuestions.filter(r => r.isRevealed).length
  }

  if (currentView === 'waiting') {
    return (
      <div className={cn('w-full max-w-2xl mx-auto space-y-6', className)}>
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
            <CardTitle>Answers Submitted!</CardTitle>
            <p className="text-muted-foreground">
              Waiting for host to reveal results...
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              You answered {getAnsweredCount()} out of {questions.length} questions
            </div>
            
            {getRevealedCount() > 0 && (
              <div>
                <Badge variant="default" className="mb-2">
                  {getRevealedCount()} questions revealed
                </Badge>
                <Button 
                  onClick={() => setCurrentView('results')}
                  size="sm"
                >
                  View Results
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        {announcements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📢 Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {announcements.slice(-3).map((announcement, index) => (
                <div key={index} className="p-2 bg-muted rounded text-sm">
                  <p>{announcement.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(announcement.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (currentView === 'results') {
    return (
      <div className={cn('w-full max-w-4xl mx-auto space-y-6', className)}>
        {/* Leaderboard */}
        {leaderboardVisible && leaderboard.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🏆</span>
                <span>Leaderboard</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.participantName === participantName
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg',
                        isCurrentUser 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'bg-muted/30'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                          entry.rank === 1 ? 'bg-yellow-500 text-white' :
                          entry.rank === 2 ? 'bg-gray-400 text-white' :
                          entry.rank === 3 ? 'bg-amber-600 text-white' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {entry.rank}
                        </div>
                        <div>
                          <div className={cn(
                            'font-medium',
                            isCurrentUser ? 'text-primary' : 'text-foreground'
                          )}>
                            {entry.participantName}
                            {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {entry.questionsRevealed} questions revealed
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{entry.score} pts</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((entry.score / entry.questionsRevealed) * 100)}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revealed Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Question Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              {getRevealedCount()} of {questions.length} questions revealed
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {questions.map((question, questionIndex) => {
              const revealInfo = revealedQuestions.find(r => r.questionIndex === questionIndex)
              const isRevealed = revealInfo?.isRevealed || false
              const userAnswer = answers.find(a => a.questionIndex === questionIndex)
              const selectedOption = userAnswer?.selectedOption || -1
              
              if (!isRevealed) {
                return (
                  <div key={questionIndex} className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">⏳</span>
                      <span className="text-sm text-muted-foreground">
                        Question {questionIndex + 1} - Not revealed yet
                      </span>
                    </div>
                  </div>
                )
              }

              const isCorrect = selectedOption === question.correct
              const wasAnswered = selectedOption !== -1

              return (
                <div key={questionIndex} className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold flex-shrink-0',
                      isCorrect 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : wasAnswered
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    )}>
                      {isCorrect ? '✓' : wasAnswered ? '✗' : '?'}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-2">
                        {questionIndex + 1}. {question.text}
                      </h3>
                      
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const isSelected = selectedOption === optionIndex
                          const isCorrectOption = optionIndex === question.correct
                          
                          return (
                            <div
                              key={optionIndex}
                              className={cn(
                                'p-2 rounded border',
                                isCorrectOption
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                  : isSelected && !isCorrect
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                  : 'border-border'
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-medium">
                                    {getOptionLabel(optionIndex)}
                                  </span>
                                  <span className="text-sm">{option}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {isSelected && (
                                    <Badge variant="secondary" className="text-xs">
                                      Your Answer
                                    </Badge>
                                  )}
                                  {isCorrectOption && (
                                    <Badge className="text-xs bg-green-600">
                                      Correct
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('waiting')}
          >
            Back to Waiting Room
          </Button>
        </div>
      </div>
    )
  }

  // Quiz View
  const currentQuestion = questions[currentQuestionIndex]
  
  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-6', className)}>
      {/* Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="w-48 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
            <Badge variant="secondary">
              {getAnsweredCount()} answered
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl leading-tight">
            {currentQuestion.text}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = getCurrentAnswer() === index
            
            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all duration-200',
                  'hover:bg-accent hover:border-accent-foreground/20',
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-background'
                )}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {getOptionLabel(index)}
                  </span>
                  <span className="flex-1 text-sm md:text-base">
                    {option}
                  </span>
                  {isSelected && (
                    <span className="text-primary">✓</span>
                  )}
                </div>
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[140px]"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answers'}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              >
                Next →
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}