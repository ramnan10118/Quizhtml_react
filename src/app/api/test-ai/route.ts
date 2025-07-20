import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test if environment variables are accessible
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const apiKeyPrefix = process.env.OPENAI_API_KEY?.substring(0, 10) || 'not-found';
    
    return NextResponse.json({
      status: 'API route working',
      hasApiKey,
      apiKeyPrefix,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Test failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      status: 'POST test working',
      receivedData: body,
      hasApiKey: !!process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'POST test failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}