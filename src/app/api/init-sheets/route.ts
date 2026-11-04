import { NextResponse } from 'next/server';
import { initializeSheetHeaders } from '@/lib/sheets';

// One-time setup helper for the analytics spreadsheet. Development only.
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }
  try {
    await initializeSheetHeaders();
    return NextResponse.json({ success: true, message: 'Sheet headers initialized' });
  } catch (error) {
    console.error('Error initializing sheet headers:', error);
    return NextResponse.json({ error: 'Failed to initialize sheet headers' }, { status: 500 });
  }
}
