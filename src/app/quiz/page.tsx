'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function QuizPage() {
  const router = useRouter();

  useEffect(() => {
    // Preserve query parameters when redirecting
    const urlParams = new URLSearchParams(window.location.search);
    const queryString = urlParams.toString();
    const setupUrl = queryString ? `/quiz/setup?${queryString}` : '/quiz/setup';
    router.replace(setupUrl);
  }, [router]);

  return (
    <ProtectedRoute>
      null
    </ProtectedRoute>
  );
}