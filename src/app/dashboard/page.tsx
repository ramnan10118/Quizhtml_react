'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { quizDrafts, QuizDraft, pollDrafts, PollDraft, livePolls, LivePoll } from '@/lib/drafts'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [quizDraftsList, setQuizDraftsList] = useState<QuizDraft[]>([])
  const [pollDraftsList, setPollDraftsList] = useState<PollDraft[]>([])
  const [livePollsList, setLivePollsList] = useState<LivePoll[]>([])
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
      const [userQuizDrafts, userPollDrafts, userLivePolls] = await Promise.all([
        quizDrafts.getAll(),
        pollDrafts.getAll(),
        livePolls.getAll()
      ])
      setQuizDraftsList(userQuizDrafts)
      setPollDraftsList(userPollDrafts)
      setLivePollsList(userLivePolls)
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
              {(quizDraftsList.length > 0 || pollDraftsList.length > 0 || livePollsList.length > 0) && (
                <>
                  <Link href="/quiz/setup">
                    <Button variant="outline" size="sm">
                      🎯 Create Quiz
                    </Button>
                  </Link>
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


          {/* Live Polls Section */}
          {!loading && livePollsList.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                🔴 Live Polls
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {livePollsList.map((livePoll) => (
                  <Card key={`live-${livePoll.id}`} className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">🔴</span>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold line-clamp-1">
                              {livePoll.title}
                            </CardTitle>
                          </div>
                        </div>
                        <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full">
                          LIVE
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
              </div>
            </div>
          )}

          {/* Section Title */}
          {!loading && (quizDraftsList.length > 0 || pollDraftsList.length > 0) && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                📝 My Drafts
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
          ) : (quizDraftsList.length === 0 && pollDraftsList.length === 0 && livePollsList.length === 0) ? (
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
                    <Link href="/quiz/setup">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        🎯 Create Quiz
                      </Button>
                    </Link>
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
            /* Drafts Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quiz Drafts */}
              {quizDraftsList.map((draft) => (
                <Card key={`quiz-${draft.id}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🎯</span>
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
                      {draft.questions && Array.isArray(draft.questions) 
                        ? `${draft.questions.length} questions`
                        : '0 questions'
                      } • Created {new Date(draft.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleLoadDraft(draft.id, 'quiz')}
                        className="flex-1 text-sm"
                        size="sm"
                      >
                        Load Draft
                      </Button>
                      <Button
                        onClick={() => handleDeleteDraft(draft.id, draft.title, 'quiz')}
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