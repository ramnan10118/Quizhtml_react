import { supabase } from './supabase'
import { QuizQuestion } from '@/types/quiz'
import { PollCreateData } from '@/types/polling'

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

export interface PollDraft {
  id: string
  user_id: string
  title: string
  description: string | null
  type: string
  status: string
  content: PollCreateData
  created_at: string
  updated_at: string
}

export interface CreatePollDraftData {
  title: string
  question: string
  options: string[]
}

export interface LivePoll {
  id: string
  user_id: string
  title: string
  description: string | null
  type: string
  status: string
  content: {
    question: string
    options: string[]
    showResults: boolean
    votes: Record<string, number> // voterName -> optionIndex
  }
  created_at: string
  updated_at: string
}

export interface CreateLivePollData {
  title: string
  question: string
  options: string[]
}

export interface LiveQuiz {
  id: string
  user_id: string
  title: string
  description: string | null
  type: string
  status: string
  content: {
    questions: QuizQuestion[]
    mode: 'scheduled'
    settings: {
      timeLimit?: number
      allowRetakes?: boolean
      showCorrectAnswers?: boolean
      passingScore?: number
    }
    revealedQuestions: { questionIndex: number; isRevealed: boolean; revealedAt?: number }[]
    submissions: any[]
    leaderboard: any[]
    leaderboardVisible: boolean
  }
  created_at: string
  updated_at: string
}

export interface CreateLiveQuizData {
  title: string
  questions: QuizQuestion[]
  settings: {
    timeLimit?: number
    allowRetakes?: boolean
    showCorrectAnswers?: boolean
    passingScore?: number
  }
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
      .eq('status', 'draft')
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

export const pollDrafts = {
  // Save a new poll draft
  async save(data: CreatePollDraftData): Promise<PollDraft> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const pollData: PollCreateData = {
      question: data.question,
      options: data.options
    }

    const { data: draft, error } = await supabase
      .from('drafts')
      .insert({
        title: data.title,
        user_id: user.id,
        type: 'poll',
        status: 'draft',
        content: pollData,
      })
      .select()
      .single()

    if (error) throw error
    return draft as PollDraft
  },

  // Get all poll drafts for the current user
  async getAll(): Promise<PollDraft[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'poll')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as PollDraft[]
  },

  // Get a single poll draft by ID
  async getById(id: string): Promise<PollDraft | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'poll')
      .eq('status', 'draft')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as PollDraft
  },

  // Delete a poll draft
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'poll')
      .eq('status', 'draft')

    if (error) throw error
  }
}

export const livePolls = {
  // Launch a new live poll
  async launch(data: CreateLivePollData): Promise<LivePoll> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const pollContent = {
      question: data.question,
      options: data.options,
      showResults: false,
      votes: {}
    }

    const { data: livePoll, error } = await supabase
      .from('drafts')
      .insert({
        title: data.title,
        user_id: user.id,
        type: 'poll',
        status: 'live',
        content: pollContent,
      })
      .select()
      .single()

    if (error) throw error
    return livePoll as LivePoll
  },

  // Get all live polls for the current user
  async getAll(): Promise<LivePoll[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'poll')
      .eq('status', 'live')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as LivePoll[]
  },

  // Get a single live poll by ID
  async getById(id: string): Promise<LivePoll | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'poll')
      .eq('status', 'live')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as LivePoll
  },

  // Close a live poll (changes status to 'completed')
  async close(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('drafts')
      .update({ status: 'completed' })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'poll')
      .eq('status', 'live')

    if (error) throw error
  },

  // Update poll content (for vote tracking)
  async updateContent(id: string, content: LivePoll['content']): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('drafts')
      .update({ content })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'poll')
      .eq('status', 'live')

    if (error) throw error
  },

  // Delete a live poll
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'poll')
      .eq('status', 'live')

    if (error) throw error
  }
}

export const quizHistory = {
  // Get all quiz history (drafts + completed quizzes) for the current user
  async getAll(): Promise<(QuizDraft | LiveQuiz)[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'quiz')
      .in('status', ['draft', 'completed'])
      .order('updated_at', { ascending: false })

    if (error) throw error
    return (data || []) as (QuizDraft | LiveQuiz)[]
  },

  // Get a single quiz (draft or completed) by ID
  async getById(id: string): Promise<QuizDraft | LiveQuiz | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'quiz')
      .in('status', ['draft', 'completed'])
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as QuizDraft | LiveQuiz
  },
}

export const liveQuizzes = {
  // Launch a new live quiz
  async launch(data: CreateLiveQuizData): Promise<LiveQuiz> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const quizContent = {
      questions: data.questions,
      mode: 'scheduled' as const,
      settings: data.settings,
      revealedQuestions: data.questions.map((_, index) => ({
        questionIndex: index,
        isRevealed: false,
        revealedAt: undefined
      })),
      submissions: [],
      leaderboard: [],
      leaderboardVisible: false
    }

    const { data: liveQuiz, error } = await supabase
      .from('drafts')
      .insert({
        title: data.title,
        user_id: user.id,
        type: 'quiz',
        status: 'live',
        content: quizContent,
      })
      .select()
      .single()

    if (error) throw error
    return liveQuiz as LiveQuiz
  },

  // Get all live quizzes for the current user
  async getAll(): Promise<LiveQuiz[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'quiz')
      .eq('status', 'live')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as LiveQuiz[]
  },

  // Get a single live quiz by ID
  async getById(id: string): Promise<LiveQuiz | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'quiz')
      .eq('status', 'live')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as LiveQuiz
  },

  // Update revealed questions and auto-complete if all revealed
  async updateRevealedQuestions(id: string, revealedQuestions: { questionIndex: number; isRevealed: boolean; revealedAt?: number }[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current quiz content
    const currentQuiz = await this.getById(id)
    if (!currentQuiz) throw new Error('Quiz not found')

    const updatedContent = {
      ...currentQuiz.content,
      revealedQuestions
    }

    // Check if all questions are revealed
    const allRevealed = revealedQuestions.every(q => q.isRevealed)
    const newStatus = allRevealed ? 'completed' : 'live'

    const { error } = await supabase
      .from('drafts')
      .update({ 
        content: updatedContent,
        status: newStatus
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'quiz')

    if (error) throw error
  },

  // Update quiz content (for submissions, leaderboard, etc.)
  async updateContent(id: string, content: LiveQuiz['content']): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('drafts')
      .update({ content })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'quiz')
      .eq('status', 'live')

    if (error) throw error
  },

  // Force complete a live quiz (in case needed)
  async complete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('drafts')
      .update({ status: 'completed' })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'quiz')
      .eq('status', 'live')

    if (error) throw error
  },

  // Delete a live quiz
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'quiz')
      .eq('status', 'live')

    if (error) throw error
  }
}