'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PollingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/polling/host');
  }, [router]);

  return null;
}