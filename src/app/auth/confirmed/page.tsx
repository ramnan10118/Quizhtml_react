'use client'

import React, { useEffect } from 'react'

export default function EmailConfirmedPage() {
  useEffect(() => {
    // Immediate redirect to dashboard
    window.location.href = 'https://audience-voice.onrender.com/dashboard'
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <span className="animate-spin text-2xl">🔄</span>
        <span className="text-gray-600 dark:text-gray-400">Redirecting...</span>
      </div>
    </div>
  )
}