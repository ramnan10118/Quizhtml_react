import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        // Redirect to login with error
        return NextResponse.redirect(new URL('/auth/login?error=confirmation_failed', requestUrl.origin))
      }

      // Successful confirmation - redirect to confirmation page
      return NextResponse.redirect(new URL('/auth/confirmed', requestUrl.origin))
    } catch (error) {
      console.error('Unexpected error during auth callback:', error)
      // Redirect to login with error
      return NextResponse.redirect(new URL('/auth/login?error=confirmation_failed', requestUrl.origin))
    }
  }

  // No code parameter - redirect to login
  return NextResponse.redirect(new URL('/auth/login?error=invalid_confirmation', requestUrl.origin))
}