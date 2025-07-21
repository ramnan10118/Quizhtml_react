'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function ModeSelectionPage() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 dark">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300">
            Quiz Buzzer
          </Link>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Choose Your Mode
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Select the type of interactive experience you want to create
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Quiz Mode Card */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Quiz Competition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Interactive trivia competition with real-time buzzers and scoring
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">13 engaging trivia questions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Lightning-fast buzzer system</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Real-time scoring & rankings</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Mobile-optimized experience</span>
                  </div>
                </div>
                <Link href="/quiz?fresh=true" className="block">
                  <Button className="w-full" size="lg">
                    Start Quiz
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Polling Mode Card */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🗳️</span>
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Live Polling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Create instant polls with custom questions and real-time responses
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Custom question creation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Up to 6 answer options</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Live result visualization</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Real-time vote tracking</span>
                  </div>
                </div>
                <Link href="/polling" className="block">
                  <Button variant="secondary" className="w-full" size="lg">
                    Start Polling
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Use Cases */}
          <div className="mt-16 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-8">Perfect for Any Event</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="space-y-2">
                <div className="text-2xl">🏢</div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Corporate</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Team building & training</p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl">🎓</div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Education</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Classroom engagement</p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl">🎉</div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Entertainment</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Parties & events</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}