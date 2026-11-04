'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Supabase uses the PKCE flow: the code verifier lives in this browser's
// storage, so the code must be exchanged here, not in a server route.
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Confirming your account...');

  useEffect(() => {
    const code = searchParams.get('code');
    const errorDescription = searchParams.get('error_description');

    if (errorDescription) {
      router.replace(`/auth/login?error=${encodeURIComponent(errorDescription)}`);
      return;
    }
    if (!code) {
      router.replace('/auth/login?error=invalid_confirmation');
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error('Error exchanging code for session:', error);
        router.replace('/auth/login?error=confirmation_failed');
        return;
      }
      setMessage('Account confirmed. Redirecting...');
      router.replace('/auth/confirmed');
    });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
      <p className="text-gray-600 dark:text-gray-300">{message}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackContent />
    </Suspense>
  );
}
