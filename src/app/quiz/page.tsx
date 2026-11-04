'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
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
      <AppShell
        backHref="/dashboard"
        backLabel="Dashboard"
        eyebrow="New quiz · step 1 of 2"
        title="Choose a quiz mode"
        subtitle="Pick how participants will play. You can add questions on the next step."
        maxWidth="xl"
      >
        <QuizModeSelector onModeSelect={handleModeSelect} isHost />
      </AppShell>
    </ProtectedRoute>
  );
}
