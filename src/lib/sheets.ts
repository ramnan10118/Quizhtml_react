import { google } from 'googleapis';

// Initialize Google Sheets client
const getGoogleSheetsClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
};

export interface TopicLogEntry {
  timestamp: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  success: boolean;
  errorMessage?: string;
  sessionId?: string;
}

export async function logTopicToSheets(entry: TopicLogEntry) {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      console.error('Google Sheets spreadsheet ID not configured');
      return;
    }

    const values = [
      [
        entry.timestamp,
        entry.topic,
        entry.difficulty,
        entry.questionCount,
        entry.success ? 'Success' : 'Failed',
        entry.errorMessage || '',
        entry.sessionId || ''
      ]
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Topics!A:G', // Use correct sheet name
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    console.log('Google Sheets append response:', response.data);

    console.log('Topic logged to Google Sheets successfully');
  } catch (error) {
    console.error('Error logging to Google Sheets:', error);
    // Don't throw error - we don't want to break the app if logging fails
  }
}

export async function initializeSheetHeaders() {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      console.error('Google Sheets spreadsheet ID not configured');
      return;
    }

    // Check if headers already exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Topics!A1:G1',
    });

    if (!response.data.values || response.data.values.length === 0) {
      // Add headers
      const headers = [
        'Timestamp',
        'Topic',
        'Difficulty',
        'Question Count',
        'Status',
        'Error Message',
        'Session ID'
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Topics!A1:G1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });

      console.log('Sheet headers initialized');
    }
  } catch (error) {
    console.error('Error initializing sheet headers:', error);
  }
}