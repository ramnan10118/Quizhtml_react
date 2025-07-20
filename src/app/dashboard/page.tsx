'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface Template {
  id: string;
  title: string;
  description: string | null;
  type: 'quiz' | 'poll';
  status: 'draft' | 'live' | 'completed';
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      loadTemplates();
    }
  }, [user, authLoading, router]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'quiz' ? '📝' : '📊';
  };

  if (authLoading || loading) {
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
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Welcome back, {(profile?.full_name || user?.email || 'User')}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your quizzes and polls from your dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/quiz/setup')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                📝 Create Quiz
              </Button>
              <Button
                onClick={() => router.push('/polling')}
                variant="outline"
              >
                📊 Create Poll
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Templates</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {templates.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🟢</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Live Now</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {templates.filter(t => t.status === 'live').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📝</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Drafts</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {templates.filter(t => t.status === 'draft').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {templates.filter(t => t.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Templates</CardTitle>
              <div className="flex space-x-2">
                <Button
                  onClick={() => router.push('/templates')}
                  variant="outline"
                  size="sm"
                >
                  📁 View All
                </Button>
                <Button
                  onClick={() => router.push('/quiz/setup')}
                  size="sm"
                >
                  📝 New Quiz
                </Button>
                <Button
                  onClick={() => router.push('/polling')}
                  variant="outline"
                  size="sm"
                >
                  📊 New Poll
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <span className="text-4xl">📝</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No templates yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Create your first quiz or poll to get started
                </p>
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => router.push('/quiz/setup')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    📝 Create Quiz
                  </Button>
                  <Button
                    onClick={() => router.push('/polling')}
                    variant="outline"
                  >
                    📊 Create Poll
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">
                        {getTypeIcon(template.type)}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {template.title}
                        </h4>
                        {template.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {template.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Created {new Date(template.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(template.status)}`}>
                        {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
                      </span>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}