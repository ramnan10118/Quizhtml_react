'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // If user is logged in, redirect to dashboard
  React.useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <span className="animate-spin text-2xl">🔄</span>
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
              Create Amazing{' '}
              <span className="text-blue-600">Quizzes</span> & <span className="text-green-600">Polls</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Build interactive quizzes and polls with real-time features. Perfect for education, events, and team building.
            </p>
            
            {!user && (
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button
                  onClick={() => router.push('/auth/signup')}
                  className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
                >
                  Get Started Free
                </Button>
                <Button
                  onClick={() => router.push('/auth/login')}
                  variant="outline"
                  className="text-lg px-8 py-3"
                >
                  Sign In
                </Button>
              </div>
            )}

            <div className="mt-8">
              <Button
                onClick={() => router.push('/mode')}
                variant="outline"
                className="text-sm"
              >
                Try without account →
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white dark:bg-dark-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Everything you need to engage your audience
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Powerful features to create, manage, and analyze your content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="text-center">
                  <span className="text-4xl mb-4 block">🎯</span>
                  <CardTitle>Interactive Quizzes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Create engaging quizzes with real-time buzzer system and instant scoring
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-center">
                  <span className="text-4xl mb-4 block">📊</span>
                  <CardTitle>Live Polls</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Gather instant feedback with live polling and real-time results
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-center">
                  <span className="text-4xl mb-4 block">🤖</span>
                  <CardTitle>AI-Powered</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Generate questions automatically and enhance content with AI assistance
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 dark:bg-blue-700 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of educators and event organizers using our platform
          </p>
          {!user && (
            <div className="flex items-center justify-center gap-x-6">
              <Button
                onClick={() => router.push('/auth/signup')}
                className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
              >
                Create Free Account
              </Button>
              <Button
                onClick={() => router.push('/mode')}
                variant="outline"
                className="text-white border-white hover:bg-blue-700 text-lg px-8 py-3"
              >
                Try Demo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}