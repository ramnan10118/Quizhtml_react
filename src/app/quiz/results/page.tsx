'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, BarChart3, CalendarClock, CheckCircle2, Clock, Eye, ListChecks, Settings2, Trophy, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/ui/StatTile';
import { EmptyState } from '@/components/ui/EmptyState';
import { Progress } from '@/components/ui/Progress';
import { LoadingScreen } from '@/components/ui/Spinner';
import { Leaderboard } from '@/components/quiz/Leaderboard';
import { QuestionBreakdown } from '@/components/quiz/QuestionBreakdown';
import { liveQuizzes, LiveQuiz } from '@/lib/drafts';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function QuizResultsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quiz, setQuiz] = useState<LiveQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadQuizResults = async () => {
      const quizId = searchParams.get('id');
      if (!quizId) {
        setError('Quiz ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get quiz from history (includes both drafts and completed quizzes)
        const quizData = await liveQuizzes.getById(quizId);
        if (!quizData) {
          setError('Quiz not found or no longer available');
        } else {
          setQuiz(quizData);
        }
      } catch (error) {
        console.error('Error loading quiz results:', error);
        setError('Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };

    loadQuizResults();
  }, [searchParams]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <LoadingScreen label="Loading quiz results..." />
      </ProtectedRoute>
    );
  }

  if (error || !quiz) {
    return (
      <ProtectedRoute>
        <AppShell backHref="/dashboard" backLabel="Dashboard" maxWidth="lg">
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={<AlertTriangle />}
                title={error || 'Quiz results not available'}
                description="This quiz may have been deleted or is no longer accessible."
                action={
                  <Button onClick={handleBackToDashboard}>
                    <ArrowLeft /> Back to dashboard
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const revealedCount = quiz.content?.revealedQuestions?.filter(q => q.isRevealed).length || 0;
  const totalQuestions = quiz.content?.questions?.length || 0;
  const participantCount = quiz.content?.submissions?.length || 0;
  const leaderboard = quiz.content?.leaderboard || [];
  const submissions = quiz.content?.submissions || [];
  const questions = quiz.content?.questions || [];
  const completedSubmissions = submissions.filter(s => s.isComplete).length;
  const completionRate = participantCount > 0 ? Math.round((completedSubmissions / participantCount) * 100) : 0;
  const isCompleted = quiz.status === 'completed';
  const settings = quiz.content?.settings;

  return (
    <ProtectedRoute>
      <AppShell
        backHref="/dashboard"
        backLabel="Dashboard"
        eyebrow="Quiz results"
        title={quiz.title}
        subtitle={`Scheduled reveal · created ${new Date(quiz.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}`}
        headingActions={
          <>
            <Badge variant={isCompleted ? 'success' : 'live'} className="h-8 px-3 text-xs">
              {isCompleted ? <CheckCircle2 /> : null}
              {isCompleted ? 'Completed' : 'In progress'}
            </Badge>
            {!isCompleted && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/quiz/host?live=${quiz.id}`)}>
                Open host view
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-6">
          {/* Overview */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Participants" value={participantCount} tone="primary" icon={<Users />} hint={`${completedSubmissions} submitted`} />
            <StatTile label="Questions" value={totalQuestions} icon={<ListChecks />} />
            <StatTile label="Revealed" value={`${revealedCount}/${totalQuestions}`} tone="success" icon={<Eye />} hint={totalQuestions > 0 ? `${Math.round((revealedCount / totalQuestions) * 100)}% released` : undefined} />
            <StatTile label="Completion" value={`${completionRate}%`} tone="info" icon={<BarChart3 />} hint="of participants submitted" />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Leaderboard */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" /> {isCompleted ? 'Final leaderboard' : 'Leaderboard'}
                </CardTitle>
                <CardDescription>
                  {leaderboard.length > 0 ? `Top ${Math.min(10, leaderboard.length)} of ${leaderboard.length}` : 'Rankings appear once answers are revealed'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Leaderboard
                  maxRows={10}
                  emptyTitle="No rankings yet"
                  emptyDescription="Reveal questions from the host view to build the leaderboard."
                  rows={leaderboard.map((entry, index) => ({
                    rank: entry.rank ?? index + 1,
                    name: entry.participantName,
                    score: entry.score,
                    percentage: entry.questionsRevealed > 0 ? Math.round((entry.score / entry.questionsRevealed) * 100) : 0,
                    meta: entry.submissionTime ? `Submitted ${new Date(entry.submissionTime).toLocaleTimeString([], { timeStyle: 'short' })}` : undefined,
                  }))}
                />
              </CardContent>
            </Card>

            {/* Per-question breakdown */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Question breakdown
                </CardTitle>
                <CardDescription>Correct-answer rate and how answers were distributed, per question.</CardDescription>
                {totalQuestions > 0 && (
                  <div className="pt-2">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground tabular">
                      <span>Revealed</span>
                      <span>{revealedCount}/{totalQuestions}</span>
                    </div>
                    <Progress value={revealedCount} max={totalQuestions} tone="success" />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {participantCount === 0 ? (
                  <EmptyState
                    compact
                    icon={<Users />}
                    title="No participants yet"
                    description="This quiz hasn't received any submissions, so there is nothing to break down."
                  />
                ) : (
                  <QuestionBreakdown
                    questions={questions}
                    submissions={submissions}
                    revealedQuestions={quiz.content?.revealedQuestions}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings + timeline */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" /> Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border text-sm">
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-muted-foreground">Mode</dt>
                    <dd className="font-medium text-foreground">Scheduled reveal</dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-muted-foreground">Show correct answers</dt>
                    <dd><Badge variant={settings?.showCorrectAnswers ? 'success' : 'secondary'}>{settings?.showCorrectAnswers ? 'Yes' : 'No'}</Badge></dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-muted-foreground">Time limit</dt>
                    <dd className="font-medium text-foreground tabular">{settings?.timeLimit ? `${settings.timeLimit}s per question` : 'None'}</dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-muted-foreground">Passing score</dt>
                    <dd className="font-medium text-foreground tabular">{settings?.passingScore ? `${settings.passingScore}%` : 'None'}</dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-muted-foreground">Leaderboard</dt>
                    <dd className="font-medium text-foreground">{quiz.content?.leaderboardVisible ? 'Visible to participants' : 'Hidden'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" /> Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="relative space-y-4 border-l border-border pl-5">
                  <li className="relative">
                    <span className="absolute -left-[25px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
                    <p className="text-sm font-medium text-foreground">Created</p>
                    <p className="text-xs text-muted-foreground tabular">{new Date(quiz.created_at).toLocaleString()}</p>
                  </li>
                  <li className="relative">
                    <span className="absolute -left-[25px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-muted-foreground/60 ring-4 ring-background" />
                    <p className="text-sm font-medium text-foreground">Last updated</p>
                    <p className="text-xs text-muted-foreground tabular">{new Date(quiz.updated_at).toLocaleString()}</p>
                  </li>
                  <li className="relative">
                    <span className={`absolute -left-[25px] top-1 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-background ${isCompleted ? 'bg-success' : 'bg-warning animate-live-dot'}`} />
                    <p className="text-sm font-medium text-foreground">{isCompleted ? 'Completed' : 'Still running'}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {isCompleted ? 'All questions revealed' : `${totalQuestions - revealedCount} questions still hidden`}
                    </p>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

export default function QuizResultsPage() {
  return (
    <Suspense fallback={null}>
      <QuizResultsPageContent />
    </Suspense>
  );
}
