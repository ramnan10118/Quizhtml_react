'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, user } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.push('/mode')
    }
  }, [user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(formData.email, formData.password)
      router.push('/mode')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <span className="animate-spin text-2xl">🔄</span>
          <span className="text-gray-600 dark:text-gray-400">Redirecting...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Quiz Buzzer
          </Link>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <span className="animate-spin">🔄</span>
                    <span>Signing in...</span>
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don&apos;t have an account?{' '}
                  <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign up
                  </Link>
                </p>
                <p className="text-sm">
                  <Link href="/mode" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    Continue without account
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}