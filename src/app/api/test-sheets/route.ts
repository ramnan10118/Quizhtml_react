import { NextResponse } from 'next/server';
import { logTopicToSheets } from '@/lib/sheets';

export async function POST() {
  try {
    console.log('Testing Google Sheets integration...');
    
    await logTopicToSheets({
      timestamp: new Date().toISOString(),
      topic: 'Test Topic - Manual',
      difficulty: 'Medium',
      questionCount: 5,
      success: true,
      sessionId: 'test-session-123'
    });
    
    console.log('Test entry logged successfully');
    return NextResponse.json({ success: true, message: 'Test entry logged to sheets' });
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to log test entry', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}