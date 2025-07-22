'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp, user } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      await signUp(formData.email, formData.password, formData.fullName || undefined)
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to create account')
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Check your email
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We&apos;ve sent you a confirmation link to complete your account setup.
              </p>
              <div className="space-y-3">
                <Link href="/auth/login">
                  <Button className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
                <Link href="/mode">
                  <Button variant="outline" className="w-full">
                    Continue without account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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
            Create your account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name (Optional)
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>

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
                  placeholder="Create a password (min. 6 characters)"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
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
                    <span>Creating account...</span>
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign in
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