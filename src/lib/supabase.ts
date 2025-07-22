import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on your schema
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
      drafts: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          type: string
          status: string
          content: Record<string, unknown>
          created_at: string
          updated_at: string
          questions: Record<string, unknown> | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          type: string
          status?: string
          content: Record<string, unknown>
          created_at?: string
          updated_at?: string
          questions?: Record<string, unknown> | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          type?: string
          status?: string
          content?: Record<string, unknown>
          created_at?: string
          updated_at?: string
          questions?: Record<string, unknown> | null
        }
      }
    }
  }
}