'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

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
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <span className="animate-spin text-2xl">🔄</span>
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecting to login...
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}