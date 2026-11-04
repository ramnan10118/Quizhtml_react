import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Server-side helpers for API routes. Verifies the caller's Supabase access
// token (sent as "Authorization: Bearer <token>") and applies a small
// per-user rate limit so anonymous traffic cannot burn OpenAI credit.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function requireUser(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Authentication is not configured' }, { status: 500 });
  }
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Sign in to use this feature' }, { status: 401 });
  }
  const client = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
  }
  return { userId: data.user.id };
}

const WINDOW_MS = 60 * 1000;
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, maxPerMinute: number): NextResponse | null {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= maxPerMinute) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute and try again.' }, { status: 429 });
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10000) buckets.clear();
  return null;
}
