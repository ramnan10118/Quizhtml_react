import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (will be generated later)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          type: 'quiz' | 'poll'
          status: 'draft' | 'live' | 'completed'
          content: Record<string, unknown> // JSON content
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          type: 'quiz' | 'poll'
          status?: 'draft' | 'live' | 'completed'
          content: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          type?: 'quiz' | 'poll'
          status?: 'draft' | 'live' | 'completed'
          content?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}