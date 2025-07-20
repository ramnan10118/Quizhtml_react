import { NextRequest, NextResponse } from 'next/server'
import { templates } from '@/lib/templates'

// GET /api/templates/[id] - Get a single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const template = await templates.getById(id)
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/templates/[id] - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, content, status } = body

    const template = await templates.update(id, {
      title,
      description,
      content,
      status
    })

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await templates.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}