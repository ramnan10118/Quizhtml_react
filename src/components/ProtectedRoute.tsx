'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingScreen } from '@/components/ui/Spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <LoadingScreen label="Checking your session..." />
  }

  if (!user) {
    return fallback || (
      <div className="app-bg flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold text-foreground">Sign in required</h2>
          <p className="mt-1 text-sm text-muted-foreground">Redirecting you to the login page…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
