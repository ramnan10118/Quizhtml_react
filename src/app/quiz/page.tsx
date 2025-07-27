'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Header } from '@/components/layout/Header';
import { QuizModeSelector } from '@/components/quiz/QuizModeSelector';
import { QuizMode, QuizSettings } from '@/types/quiz';

export default function QuizPage() {
  const router = useRouter();

  const handleModeSelect = (mode: QuizMode, settings: QuizSettings) => {
    // Store selected mode and settings in session storage for the setup page
    sessionStorage.setItem('selectedQuizMode', mode);
    sessionStorage.setItem('selectedQuizSettings', JSON.stringify(settings));
    router.push('/quiz/setup');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 dark">
        <Header 
          title="Choose Quiz Mode" 
          subtitle="Select the type of quiz you want to create"
        />
        
        <main className="max-w-4xl mx-auto p-6">
          <QuizModeSelector onModeSelect={handleModeSelect} />
        </main>
      </div>
    </ProtectedRoute>
  );
}