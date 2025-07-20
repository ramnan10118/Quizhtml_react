import { NextRequest, NextResponse } from 'next/server'
import { templates } from '@/lib/templates'

// GET /api/templates - Get all templates for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'draft' | 'live' | 'completed' | null
    const type = searchParams.get('type') as 'quiz' | 'poll' | null
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let result

    if (search) {
      result = { templates: await templates.search(search), total: 0, hasMore: false }
    } else if (status) {
      result = { templates: await templates.getByStatus(status), total: 0, hasMore: false }
    } else if (type) {
      result = { templates: await templates.getByType(type), total: 0, hasMore: false }
    } else if (page > 1 || limit < 50) {
      result = await templates.getPaginated(page, limit)
    } else {
      result = { templates: await templates.getAll(), total: 0, hasMore: false }
    }

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, type, content, status } = body

    if (!title || !type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, content' },
        { status: 400 }
      )
    }

    const template = await templates.create({
      title,
      description,
      type,
      content,
      status
    })

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}