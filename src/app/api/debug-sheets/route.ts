import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Get sheet info
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId!,
    });

    // Try to get data from different possible sheet names
    let data = null;
    let actualRange = '';
    
    const possibleSheetNames = ['Sheet1', 'Audience voice', sheetInfo.data.sheets?.[0]?.properties?.title];
    
    for (const sheetName of possibleSheetNames) {
      if (sheetName) {
        try {
          data = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId!,
            range: `${sheetName}!A:G`,
          });
          actualRange = `${sheetName}!A:G`;
          break;
        } catch {
          console.log(`Failed to access sheet: ${sheetName}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sheetTitle: sheetInfo.data.properties?.title,
      sheets: sheetInfo.data.sheets?.map(s => ({
        title: s.properties?.title,
        id: s.properties?.sheetId,
        index: s.properties?.index
      })),
      data: data?.data.values || [],
      range: actualRange,
      spreadsheetId: spreadsheetId,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}