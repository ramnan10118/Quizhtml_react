'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function PollingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/polling/host');
  }, [router]);

  return (
    <ProtectedRoute>
      <div></div>
    </ProtectedRoute>
  );
}