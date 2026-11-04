'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, BarChart3, CheckCircle2, FileText, LayoutDashboard, LogOut, Pencil, Play, Plus, Radio, Trash2, Trophy, Vote, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { ItemCard } from '@/components/dashboard/ItemCard'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { StatTile } from '@/components/ui/StatTile'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

  // ---- Presentation-only derived values ----
  const draftQuizzes = quizHistoryList.filter(item => item.status === 'draft')
  const completedQuizzes = quizHistoryList.filter(item => item.status !== 'draft')
  const liveCount = livePollsList.length + liveQuizzesList.length
  const draftCount = draftQuizzes.length + pollDraftsList.length
  const hasAnything = quizHistoryList.length > 0 || pollDraftsList.length > 0 || livePollsList.length > 0 || liveQuizzesList.length > 0
  const displayName = user?.user_metadata?.full_name || user?.email
  const firstName = typeof displayName === 'string' ? displayName.split(/[\s@]/)[0] : ''
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })

  const startNewQuiz = () => {
    // Clear questions when creating new quiz
    sessionStorage.removeItem('currentQuestions');
    console.log('🗑️ Cleared questions from dashboard');
    router.push('/quiz');
  }

  const sectionHeading = (icon: React.ReactNode, title: string, count: number, hint?: string) => (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>
          {title}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular">{count}</span>
        </h2>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )

  return (
    <ProtectedRoute>
      <AppShell
        nav={[
          { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
          { href: '/polling/host', label: 'Polls', icon: <Vote />, prefix: true },
        ]}
        actions={
          <>
            <span className="hidden max-w-[200px] truncate text-sm text-muted-foreground sm:inline" title={displayName ?? undefined}>
              {displayName}
            </span>
            <Button onClick={handleSignOut} variant="ghost" size="sm" aria-label="Sign out">
              <LogOut /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          </>
        }
        eyebrow="Dashboard"
        title={firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        subtitle="Your drafts, live sessions and past results in one place."
        headingActions={
          <>
            <Button onClick={startNewQuiz}>
              <Plus /> New quiz
            </Button>
            <Button variant="outline" asChild>
              <Link href="/polling/host">
                <Vote /> New poll
              </Link>
            </Button>
          </>
        }
      >
        <div className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Summary tiles */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Drafts" value={loading ? '–' : draftCount} icon={<FileText />} hint="Quizzes and polls in progress" />
            <StatTile label="Live now" value={loading ? '–' : liveCount} tone={liveCount > 0 ? 'destructive' : 'default'} icon={<Radio />} hint="Running sessions" />
            <StatTile label="Completed" value={loading ? '–' : completedQuizzes.length} tone="success" icon={<CheckCircle2 />} hint="Quizzes with results" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" label="Loading your workspace..." className="flex-col gap-3" />
            </div>
          ) : !hasAnything ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={<Zap />}
                  title="Nothing here yet"
                  description="Create your first quiz or poll. Drafts, live sessions and results will show up on this page."
                  action={
                    <>
                      <Button onClick={startNewQuiz}>
                        <Plus /> Create a quiz
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/polling/host">
                          <Vote /> Create a poll
                        </Link>
                      </Button>
                    </>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Live Sessions Section */}
              {(livePollsList.length > 0 || liveQuizzesList.length > 0) && (
                <section aria-labelledby="live-heading">
                  {sectionHeading(<Radio />, 'Live now', liveCount, 'Sessions currently accepting participants')}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {livePollsList.map((livePoll, i) => (
                      <ItemCard
                        key={`live-poll-${livePoll.id}`}
                        accent="live"
                        icon={<Vote />}
                        title={livePoll.title}
                        badge={<Badge variant="live">Live poll</Badge>}
                        className="animate-fade-up"
                        style={{ animationDelay: `${i * 40}ms` }}
                        meta={[
                          livePoll.content && livePoll.content.options ? `${livePoll.content.options.length} options` : '0 options',
                          `Started ${fmtDate(livePoll.created_at)}`,
                        ]}
                        actions={
                          <>
                            <Button onClick={() => handleResumeLivePoll(livePoll.id)} size="sm" className="flex-1">
                              <Play /> Resume
                            </Button>
                            <Button onClick={() => handleCloseLivePoll(livePoll.id, livePoll.title)} variant="outline" size="sm">
                              Close
                            </Button>
                          </>
                        }
                      />
                    ))}

                    {liveQuizzesList.map((liveQuiz, i) => (
                      <ItemCard
                        key={`live-quiz-${liveQuiz.id}`}
                        accent="live"
                        icon={<Zap />}
                        title={liveQuiz.title}
                        badge={<Badge variant="live">Live quiz</Badge>}
                        className="animate-fade-up"
                        style={{ animationDelay: `${(livePollsList.length + i) * 40}ms` }}
                        meta={[
                          liveQuiz.content && liveQuiz.content.questions ? `${liveQuiz.content.questions.length} questions` : '0 questions',
                          `${liveQuiz.content?.revealedQuestions?.filter(q => q.isRevealed).length || 0} revealed`,
                          `Started ${fmtDate(liveQuiz.created_at)}`,
                        ]}
                        actions={
                          <>
                            <Button onClick={() => handleViewLiveQuiz(liveQuiz.id)} size="sm" className="flex-1">
                              <Play /> Open host view
                            </Button>
                            <Button onClick={() => handleViewQuizResults(liveQuiz.id)} variant="outline" size="sm">
                              <BarChart3 /> Results
                            </Button>
                          </>
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Quiz drafts */}
              {draftQuizzes.length > 0 && (
                <section aria-labelledby="drafts-heading">
                  {sectionHeading(<FileText />, 'Quiz drafts', draftQuizzes.length, 'Open a draft to edit questions and launch')}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {draftQuizzes.map((item, i) => (
                      <ItemCard
                        key={`history-${item.id}`}
                        icon={<FileText />}
                        title={item.title}
                        badge={<Badge variant="secondary">Draft</Badge>}
                        className="animate-fade-up"
                        style={{ animationDelay: `${i * 40}ms` }}
                        meta={[
                          `${(item as QuizDraft).questions?.length ?? 0} questions`,
                          `Created ${fmtDate(item.created_at)}`,
                        ]}
                        actions={
                          <>
                            <Button onClick={() => handleLoadQuizDraft(item.id)} size="sm" className="flex-1">
                              <Pencil /> Edit &amp; launch
                            </Button>
                            <Button
                              onClick={() => handleDeleteQuizHistory(item.id, item.title)}
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Delete ${item.title}`}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 />
                            </Button>
                          </>
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Completed quizzes */}
              {completedQuizzes.length > 0 && (
                <section aria-labelledby="completed-heading">
                  {sectionHeading(<Trophy />, 'Completed quizzes', completedQuizzes.length, 'Leaderboards and per-question analytics')}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {completedQuizzes.map((item, i) => (
                      <ItemCard
                        key={`history-${item.id}`}
                        accent="success"
                        icon={<CheckCircle2 />}
                        title={item.title}
                        badge={<Badge variant="success">Completed</Badge>}
                        className="animate-fade-up"
                        style={{ animationDelay: `${i * 40}ms` }}
                        meta={[
                          (item as LiveQuiz).content && (item as LiveQuiz).content.questions
                            ? `${(item as LiveQuiz).content.questions.length} questions`
                            : '0 questions',
                          `${(item as LiveQuiz).content?.submissions?.length ?? 0} participants`,
                          `Completed ${fmtDate(item.updated_at)}`,
                        ]}
                        actions={
                          <>
                            <Button onClick={() => handleViewQuizResults(item.id)} size="sm" className="flex-1">
                              <BarChart3 /> View results
                            </Button>
                            <Button
                              onClick={() => handleDeleteQuizHistory(item.id, item.title)}
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Delete ${item.title}`}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 />
                            </Button>
                          </>
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Poll Drafts Section */}
              {pollDraftsList.length > 0 && (
                <section aria-labelledby="poll-drafts-heading">
                  {sectionHeading(<Vote />, 'Poll drafts', pollDraftsList.length)}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {pollDraftsList.map((draft, i) => (
                      <ItemCard
                        key={`poll-${draft.id}`}
                        icon={<Vote />}
                        title={draft.title}
                        badge={<Badge variant="secondary">Draft</Badge>}
                        className="animate-fade-up"
                        style={{ animationDelay: `${i * 40}ms` }}
                        meta={[
                          draft.content && draft.content.options ? `${draft.content.options.length} options` : '0 options',
                          `Created ${fmtDate(draft.created_at)}`,
                        ]}
                        actions={
                          <>
                            <Button onClick={() => handleLoadDraft(draft.id, 'poll')} size="sm" className="flex-1">
                              <Pencil /> Open draft
                            </Button>
                            <Button
                              onClick={() => handleDeleteDraft(draft.id, draft.title, 'poll')}
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Delete ${draft.title}`}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 />
                            </Button>
                          </>
                        }
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
