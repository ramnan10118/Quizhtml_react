'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { templates, Template } from '@/lib/templates';

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'live' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'quiz' | 'poll'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadTemplates();
    }
  }, [user, authLoading, router]);

  const loadTemplates = async () => {
    try {
      const allTemplates = await templates.getAll();
      setUserTemplates(allTemplates);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      await templates.delete(id);
      setUserTemplates(prev => prev.filter(t => t.id !== id));
      setError('Template deleted successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (id: string, title: string) => {
    try {
      const duplicated = await templates.duplicate(id, `${title} (Copy)`);
      setUserTemplates(prev => [duplicated, ...prev]);
      setError('Template duplicated successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to duplicate template');
    }
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

  const filteredTemplates = userTemplates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || template.status === statusFilter;
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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
                My Templates
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage and organize your quiz and poll templates
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/quiz/setup')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                📝 New Quiz
              </Button>
              <Button
                onClick={() => router.push('/polling')}
                variant="outline"
              >
                📊 New Poll
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
              >
                ← Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className={`mb-6 p-3 rounded-lg text-sm ${
            error.includes('successfully') 
              ? 'bg-green-100 border border-green-300 text-green-700'
              : 'bg-red-100 border border-red-300 text-red-700'
          }`}>
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'live' | 'completed')}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | 'quiz' | 'poll')}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Types</option>
                  <option value="quiz">Quiz</option>
                  <option value="poll">Poll</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="mb-4">
                <span className="text-4xl">📝</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {userTemplates.length === 0 ? 'No templates yet' : 'No templates found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {userTemplates.length === 0 
                  ? 'Create your first quiz or poll template to get started'
                  : 'Try adjusting your search or filters'
                }
              </p>
              {userTemplates.length === 0 && (
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
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{getTypeIcon(template.type)}</span>
                      <div>
                        <CardTitle className="text-sm font-medium line-clamp-1">
                          {template.title}
                        </CardTitle>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getStatusColor(template.status)} mt-1`}>
                          {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                    {template.content?.questions ? (template.content.questions as unknown[]).length : 0} questions • 
                    Created {new Date(template.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => router.push(`/templates/${template.id}`)}
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDuplicateTemplate(template.id, template.title)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      Copy
                    </Button>
                    <Button
                      onClick={() => handleDeleteTemplate(template.id)}
                      variant="destructive"
                      size="sm"
                      className="text-xs"
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
  );
}