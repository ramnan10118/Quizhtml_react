import { supabase } from './supabase'

export interface Template {
  id: string
  user_id: string
  title: string
  description: string | null
  type: 'quiz' | 'poll'
  status: 'draft' | 'live' | 'completed'
  content: Record<string, unknown> // JSON content (questions, options, etc.)
  created_at: string
  updated_at: string
}

export interface CreateTemplateData {
  title: string
  description?: string
  type: 'quiz' | 'poll'
  content: Record<string, unknown>
  status?: 'draft' | 'live' | 'completed'
}

export interface UpdateTemplateData {
  title?: string
  description?: string
  content?: Record<string, unknown>
  status?: 'draft' | 'live' | 'completed'
}

export const templates = {
  // Create a new template
  async create(data: CreateTemplateData): Promise<Template> {
    const { data: template, error } = await supabase
      .from('templates')
      .insert({
        title: data.title,
        description: data.description || null,
        type: data.type,
        content: data.content,
        status: data.status || 'draft',
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (error) throw error
    return template
  },

  // Get all templates for the current user
  async getAll(): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get templates by status
  async getByStatus(status: 'draft' | 'live' | 'completed'): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get templates by type
  async getByType(type: 'quiz' | 'poll'): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get a single template by ID
  async getById(id: string): Promise<Template | null> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  },

  // Update a template
  async update(id: string, updates: UpdateTemplateData): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a template
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Duplicate a template
  async duplicate(id: string, newTitle?: string): Promise<Template> {
    const original = await this.getById(id)
    if (!original) throw new Error('Template not found')

    const { data, error } = await supabase
      .from('templates')
      .insert({
        title: newTitle || `${original.title} (Copy)`,
        description: original.description,
        type: original.type,
        content: original.content,
        status: 'draft',
        user_id: original.user_id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update template status
  async updateStatus(id: string, status: 'draft' | 'live' | 'completed'): Promise<Template> {
    return this.update(id, { status })
  },

  // Search templates by title
  async search(query: string): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get templates with pagination
  async getPaginated(page: number = 1, limit: number = 10): Promise<{
    templates: Template[]
    total: number
    hasMore: boolean
  }> {
    const offset = (page - 1) * limit

    // Get count
    const { count, error: countError } = await supabase
      .from('templates')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    // Get paginated data
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      templates: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    }
  }
}