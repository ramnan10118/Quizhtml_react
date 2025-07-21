import { NextResponse } from 'next/server';
import { initializeSheetHeaders } from '@/lib/sheets';

export async function POST() {
  try {
    await initializeSheetHeaders();
    return NextResponse.json({ success: true, message: 'Sheet headers initialized' });
  } catch (error) {
    console.error('Error initializing sheet headers:', error);
    return NextResponse.json(
      { error: 'Failed to initialize sheet headers' },
      { status: 500 }
    );
  }
}