'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Template {
  id: string;
  title: string;
  description: string | null;
  type: 'quiz' | 'poll';
  status: 'draft' | 'live' | 'completed';
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Delete Template State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    router.push(`/quiz/setup?template=${templateId}`);
  };

  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateToDelete.id)
        .eq('user_id', user?.id); // Extra security check

      if (error) throw error;

      // Remove from local state immediately
      setTemplates(templates.filter(template => template.id !== templateToDelete.id));
      setShowDeleteModal(false);
      
      // Show success message with dissolve animation
      setSuccessMessage(`Template "${templateToDelete.title}" deleted successfully!`);
      setTimeout(() => setSuccessMessage(''), 2500);
      
      setTemplateToDelete(null);
      
    } catch (err) {
      console.error('Failed to delete template:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setTemplateToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 dark">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Quiz Buzzer Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user?.email}
              </span>
              
              {/* Create New Buttons */}
              <div className="flex space-x-3">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/quiz/setup?fresh=true')}>
                    🎯 New Quiz
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => router.push('/polling/host')}>
                    🗳️ New Poll
                  </Button>
              </div>
              
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              My Templates
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your saved quiz and poll templates
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading templates...</span>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          ) : templates.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="mb-6">
                <div className="w-24 h-24 bg-gray-100 dark:bg-dark-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📝</span>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No templates yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                  Create your first quiz or poll to get started with interactive experiences.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="w-full sm:w-auto" size="lg" onClick={() => router.push('/quiz/setup?fresh=true')}>
                    🎯 Create Quiz
                  </Button>
                  <Button variant="secondary" className="w-full sm:w-auto" size="lg" onClick={() => router.push('/polling/host')}>
                    🗳️ Create Poll
                  </Button>
              </div>
            </div>
          ) : (
            /* Templates List */
            <div>
              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 px-4 py-2 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm notification-fade">
                  ✅ {successMessage}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100 truncate">
                      {template.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>{Array.isArray(template.content?.questions) ? template.content.questions.length : 0} questions</span>
                        <span>{formatDate(template.updated_at)}</span>
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        <Button
                          onClick={() => handleLoadTemplate(template.id)}
                          className="flex-1"
                          size="sm"
                        >
                          Load Template
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(template)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            </div>
          )}

        </main>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && templateToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl text-red-500">⚠️</span>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Delete Template</h2>
                  </div>
                  <button
                    onClick={handleDeleteCancel}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    disabled={isDeleting}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Are you sure you want to delete this template?
                </p>
                
                <div className="bg-gray-50 dark:bg-dark-700 p-3 rounded-lg mb-6">
                  <p className="font-medium text-gray-900 dark:text-gray-100">"{templateToDelete.title}"</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {Array.isArray(templateToDelete.content?.questions) ? templateToDelete.content.questions.length : 0} questions • {formatDate(templateToDelete.created_at)}
                  </p>
                </div>
                
                <p className="text-sm text-red-600 dark:text-red-400 mb-6">
                  This action cannot be undone.
                </p>

                <div className="flex justify-end space-x-3">
                  <Button 
                    onClick={handleDeleteCancel} 
                    variant="outline"
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Template'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}