'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Auto redirect based on authentication status
  React.useEffect(() => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/mode');
    }
  }, [router, user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300">
            Quiz Buzzer
          </Link>
          <div className="flex items-center space-x-4">
{user ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      
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
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => router.push('/mode')}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
              >
                Get Started
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
          <div className="flex items-center justify-center">
            <Button
              onClick={() => router.push('/mode')}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}