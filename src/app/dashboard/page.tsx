'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { quizDrafts, QuizDraft, pollDrafts, PollDraft, livePolls, LivePoll, liveQuizzes, LiveQuiz, quizHistory } from '@/lib/drafts'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [quizDraftsList, setQuizDraftsList] = useState<QuizDraft[]>([])
  const [pollDraftsList, setPollDraftsList] = useState<PollDraft[]>([])
  const [livePollsList, setLivePollsList] = useState<LivePoll[]>([])
  const [liveQuizzesList, setLiveQuizzesList] = useState<LiveQuiz[]>([])
  const [quizHistoryList, setQuizHistoryList] = useState<(QuizDraft | LiveQuiz)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadDrafts()
    }
  }, [user])

  const loadDrafts = async () => {
    try {
      setLoading(true)
      const [userQuizDrafts, userPollDrafts, userLivePolls, userLiveQuizzes, userQuizHistory] = await Promise.all([
        quizDrafts.getAll(),
        pollDrafts.getAll(),
        livePolls.getAll(),
        liveQuizzes.getAll(),
        quizHistory.getAll()
      ])
      setQuizDraftsList(userQuizDrafts)
      setPollDraftsList(userPollDrafts)
      setLivePollsList(userLivePolls)
      setLiveQuizzesList(userLiveQuizzes)
      setQuizHistoryList(userQuizHistory)
    } catch (error) {
      setError('Failed to load drafts')
      console.error('Load drafts error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleLoadDraft = (draftId: string, draftType: 'quiz' | 'poll') => {
    if (draftType === 'quiz') {
      router.push(`/quiz/setup?draft=${draftId}`)
    } else {
      router.push(`/polling/host?draft=${draftId}`)
    }
  }

  const handleDeleteDraft = async (draftId: string, draftTitle: string, draftType: 'quiz' | 'poll') => {
    if (!confirm(`Are you sure you want to delete "${draftTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      if (draftType === 'quiz') {
        await quizDrafts.delete(draftId)
        setQuizDraftsList(quizDraftsList.filter(draft => draft.id !== draftId))
      } else {
        await pollDrafts.delete(draftId)
        setPollDraftsList(pollDraftsList.filter(draft => draft.id !== draftId))
      }
    } catch (error) {
      setError('Failed to delete draft')
      console.error('Delete draft error:', error)
    }
  }

  const handleCloseLivePoll = async (pollId: string, pollTitle: string) => {
    if (!confirm(`Are you sure you want to close "${pollTitle}"? This will end the live poll session.`)) {
      return
    }

    try {
      await livePolls.close(pollId)
      setLivePollsList(livePollsList.filter(poll => poll.id !== pollId))
    } catch (error) {
      setError('Failed to close live poll')
      console.error('Close live poll error:', error)
    }
  }

  const handleResumeLivePoll = (pollId: string) => {
    router.push(`/polling/host?live=${pollId}`)
  }

  const handleViewLiveQuiz = (quizId: string) => {
    router.push(`/quiz/host?live=${quizId}`)
  }

  const handleViewQuizResults = (quizId: string) => {
    router.push(`/quiz/results?id=${quizId}`)
  }

  const handleLoadQuizDraft = (draftId: string) => {
    router.push(`/quiz/setup?draft=${draftId}`)
  }

  const handleDeleteQuizHistory = async (quizId: string, quizTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${quizTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      await quizDrafts.delete(quizId)
      setQuizHistoryList(quizHistoryList.filter(item => item.id !== quizId))
    } catch (error) {
      setError('Failed to delete quiz')
      console.error('Delete quiz error:', error)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 dark">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                My Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, {user?.user_metadata?.full_name || user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {(quizHistoryList.length > 0 || pollDraftsList.length > 0 || livePollsList.length > 0 || liveQuizzesList.length > 0) && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Clear questions when creating new quiz
                      sessionStorage.removeItem('currentQuestions');
                      console.log('🗑️ Cleared questions from dashboard');
                      router.push('/quiz');
                    }}
                  >
                    🎯 Create Quiz
                  </Button>
                  <Link href="/polling/host">
                    <Button variant="outline" size="sm">
                      📊 Create Poll
                    </Button>
                  </Link>
                </>
              )}
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-6 p-3 rounded-lg text-sm bg-red-100 border border-red-300 text-red-700">
              {error}
            </div>
          )}


          {/* Live Sessions Section */}
          {!loading && (livePollsList.length > 0 || liveQuizzesList.length > 0) && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                🔴 Live Sessions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Live Polls */}
                {livePollsList.map((livePoll) => (
                  <Card key={`live-poll-${livePoll.id}`} className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">📊</span>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold line-clamp-1">
                              {livePoll.title}
                            </CardTitle>
                          </div>
                        </div>
                        <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full">
                          LIVE POLL
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {livePoll.content && livePoll.content.options 
                          ? `${livePoll.content.options.length} options`
                          : '0 options'
                        } • Started {new Date(livePoll.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleResumeLivePoll(livePoll.id)}
                          className="flex-1 text-sm bg-red-600 hover:bg-red-700"
                          size="sm"
                        >
                          Resume Poll
                        </Button>
                        <Button
                          onClick={() => handleCloseLivePoll(livePoll.id, livePoll.title)}
                          variant="outline"
                          size="sm"
                          className="text-sm px-3 bg-white dark:bg-white !text-black border-gray-300 hover:bg-gray-50"
                        >
                          Close
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Live Quizzes */}
                {liveQuizzesList.map((liveQuiz) => (
                  <Card key={`live-quiz-${liveQuiz.id}`} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">🎯</span>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold line-clamp-1">
                              {liveQuiz.title}
                            </CardTitle>
                          </div>
                        </div>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                          LIVE QUIZ
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {liveQuiz.content && liveQuiz.content.questions 
                          ? `${liveQuiz.content.questions.length} questions`
                          : '0 questions'
                        } • {liveQuiz.content?.revealedQuestions?.filter(q => q.isRevealed).length || 0} revealed • Started {new Date(liveQuiz.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleViewLiveQuiz(liveQuiz.id)}
                          className="flex-1 text-sm bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          View Quiz
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Quiz History Section */}
          {!loading && quizHistoryList.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                📚 Quiz History
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizHistoryList.map((item) => (
                  <Card key={`history-${item.id}`} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{item.status === 'draft' ? '📝' : '✅'}</span>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold line-clamp-1">
                              {item.title}
                            </CardTitle>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.status === 'draft' 
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        }`}>
                          {item.status === 'draft' ? 'DRAFT' : 'COMPLETED'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {item.status === 'draft' ? (
                          <>
                            {(item as QuizDraft).questions && Array.isArray((item as QuizDraft).questions) 
                              ? `${(item as QuizDraft).questions.length} questions`
                              : '0 questions'
                            } • Created {new Date(item.created_at).toLocaleDateString()}
                          </>
                        ) : (
                          <>
                            {(item as LiveQuiz).content && (item as LiveQuiz).content.questions 
                              ? `${(item as LiveQuiz).content.questions.length} questions`
                              : '0 questions'
                            } • Completed {new Date(item.updated_at).toLocaleDateString()}
                          </>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {item.status === 'draft' ? (
                          <>
                            <Button
                              onClick={() => handleLoadQuizDraft(item.id)}
                              className="flex-1 text-sm"
                              size="sm"
                            >
                              Load Draft
                            </Button>
                            <Button
                              onClick={() => handleDeleteQuizHistory(item.id, item.title)}
                              variant="outline"
                              size="sm"
                              className="text-sm px-3 bg-white dark:bg-white !text-black border-gray-300 hover:bg-gray-50"
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleViewQuizResults(item.id)}
                              className="flex-1 text-sm bg-blue-600 hover:bg-blue-700"
                              size="sm"
                            >
                              View Results
                            </Button>
                            <Button
                              onClick={() => handleDeleteQuizHistory(item.id, item.title)}
                              variant="outline"
                              size="sm"
                              className="text-sm px-3 bg-white dark:bg-white !text-black border-gray-300 hover:bg-gray-50"
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Poll Drafts Section */}
          {!loading && pollDraftsList.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                📊 Poll Drafts
              </h2>
            </div>
          )}

          {/* Drafts Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <span className="animate-spin text-2xl">🔄</span>
                <span className="text-gray-600 dark:text-gray-400">Loading drafts...</span>
              </div>
            </div>
          ) : (quizHistoryList.length === 0 && pollDraftsList.length === 0 && livePollsList.length === 0 && liveQuizzesList.length === 0) ? (
            /* Empty State */
            <Card>
              <CardContent className="text-center py-16">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-dark-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No drafts yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    Start creating your first quiz or poll draft to see them here.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        // Clear questions when creating new quiz
                        sessionStorage.removeItem('currentQuestions');
                        console.log('🗑️ Cleared questions from dashboard');
                        router.push('/quiz');
                      }}
                    >
                      🎯 Create Quiz
                    </Button>
                    <Link href="/polling/host">
                      <Button variant="outline">
                        📊 Create Poll
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Poll Drafts Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Poll Drafts */}
              {pollDraftsList.map((draft) => (
                <Card key={`poll-${draft.id}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">📊</span>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold line-clamp-1">
                            {draft.title}
                          </CardTitle>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {draft.content && draft.content.options 
                        ? `${draft.content.options.length} options`
                        : '0 options'
                      } • Created {new Date(draft.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleLoadDraft(draft.id, 'poll')}
                        className="flex-1 text-sm"
                        size="sm"
                      >
                        Load Draft
                      </Button>
                      <Button
                        onClick={() => handleDeleteDraft(draft.id, draft.title, 'poll')}
                        variant="outline"
                        size="sm"
                        className="text-sm px-3 bg-white dark:bg-white !text-black border-gray-300 hover:bg-gray-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}