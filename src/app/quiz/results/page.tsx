'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 dark">
          <Header title="Loading Results..." subtitle="Please wait" />
          <main className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">🔄</div>
                <p className="text-gray-600 dark:text-gray-400">Loading quiz results...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !quiz) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 dark">
          <Header title="Results Not Found" subtitle="Unable to load quiz data" />
          <main className="max-w-4xl mx-auto p-6">
            <Card>
              <CardContent className="text-center py-16">
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {error || 'Quiz results not available'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  This quiz may have been deleted or is no longer accessible.
                </p>
                <Button onClick={handleBackToDashboard}>
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const revealedCount = quiz.content?.revealedQuestions?.filter(q => q.isRevealed).length || 0;
  const totalQuestions = quiz.content?.questions?.length || 0;
  const participantCount = quiz.content?.submissions?.length || 0;
  const leaderboard = quiz.content?.leaderboard || [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 dark">
        <Header 
          title={`Results: ${quiz.title}`} 
          subtitle={`${totalQuestions} questions • ${participantCount} participants • ${quiz.status === 'completed' ? 'Completed' : 'In Progress'}`}
        >
          <Button onClick={handleBackToDashboard} variant="outline" size="sm">
            Back to Dashboard
          </Button>
        </Header>

        <main className="max-w-6xl mx-auto p-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
                <div className="text-sm text-muted-foreground">Total Questions</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{revealedCount}</div>
                <div className="text-sm text-muted-foreground">Questions Revealed</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{participantCount}</div>
                <div className="text-sm text-muted-foreground">Participants</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${quiz.status === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                  {quiz.status === 'completed' ? '✅' : '⏳'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {quiz.status === 'completed' ? 'Completed' : 'In Progress'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🏆</span>
                  <span>Final Leaderboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-300'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-medium">{entry.participantName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{entry.score} points</div>
                        {entry.submissionTime && (
                          <div className="text-xs text-muted-foreground">
                            Submitted {new Date(entry.submissionTime).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quiz Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Timeline</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Created: {new Date(quiz.created_at).toLocaleString()}</div>
                    <div>Last Updated: {new Date(quiz.updated_at).toLocaleString()}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Settings</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Mode: Scheduled Quiz</div>
                    <div>Show Correct Answers: {quiz.content?.settings?.showCorrectAnswers ? 'Yes' : 'No'}</div>
                    {quiz.content?.settings?.timeLimit && (
                      <div>Time Limit: {quiz.content.settings.timeLimit}s per question</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {participantCount === 0 && (
            <Card className="mt-6">
              <CardContent className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No Participants Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  This quiz hasn&apos;t received any submissions.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
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
