import { supabase } from './supabase'
import { QuizQuestion } from '@/types/quiz'

export interface QuizDraft {
  id: string
  user_id: string
  title: string
  description: string | null
  type: string
  status: string
  content: QuizQuestion[]
  created_at: string
  updated_at: string
  questions: QuizQuestion[] | null
}

export interface CreateQuizDraftData {
  title: string
  questions: QuizQuestion[]
}

export const quizDrafts = {
  // Save a new quiz draft
  async save(data: CreateQuizDraftData): Promise<QuizDraft> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: draft, error } = await supabase
      .from('drafts')
      .insert({
        title: data.title,
        user_id: user.id,
        type: 'quiz',
        status: 'draft',
        content: data.questions,
        questions: data.questions,
      })
      .select()
      .single()

    if (error) throw error
    return draft as QuizDraft
  },

  // Get all quiz drafts for the current user
  async getAll(): Promise<QuizDraft[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'quiz')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as QuizDraft[]
  },

  // Get a single quiz draft by ID
  async getById(id: string): Promise<QuizDraft | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'quiz')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as QuizDraft
  },

  // Delete a quiz draft
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'quiz')

    if (error) throw error
  }
}