'use client'

import React, { useEffect } from 'react'
import { LoadingScreen } from '@/components/ui/Spinner'

export default function EmailConfirmedPage() {
  useEffect(() => {
    // Immediate redirect to dashboard
    window.location.href = 'https://audience-voice.onrender.com/dashboard'
  }, [])

  return <LoadingScreen label="Email confirmed. Redirecting..." />
}
