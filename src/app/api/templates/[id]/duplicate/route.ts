import { NextRequest, NextResponse } from 'next/server'
import { templates } from '@/lib/templates'

// POST /api/templates/[id]/duplicate - Duplicate a template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title } = body

    const duplicatedTemplate = await templates.duplicate(id, title)

    return NextResponse.json({
      success: true,
      template: duplicatedTemplate
    })
  } catch (error) {
    console.error('Error duplicating template:', error)
    return NextResponse.json(
      { 
        error: 'Failed to duplicate template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}