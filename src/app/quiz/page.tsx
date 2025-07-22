'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function QuizPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to setup page
    router.replace('/quiz/setup');
  }, [router]);

  return (
    <ProtectedRoute>
      <div></div>
    </ProtectedRoute>
  );
}