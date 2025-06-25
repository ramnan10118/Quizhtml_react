'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuizPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/quiz/host');
  }, [router]);

  return null;
}