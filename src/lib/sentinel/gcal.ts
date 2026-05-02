import { google } from 'googleapis';

/**
 * Google Calendar Integration Service
 * Uses a Service Account to push tasks with deadlines to the user's calendar.
 * All events default to the Asia/Kolkata timezone.
 */

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];
const TIMEZONE = 'Asia/Kolkata';

// Properly format the private key to handle newline characters in environment variables
const privateKey = process.env.GOOGLE_PRIVATE_KEY 
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') 
  : undefined;

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: privateKey,
  scopes: SCOPES,
});

const calendar = google.calendar({ version: 'v3', auth });

/**
 * Pushes a task with a deadline to Google Calendar.
 * Events are set for 1 hour duration by default.
 */
export async function pushToCalendar(taskTitle: string, description: string, expiresAt: string) {
  if (!process.env.GOOGLE_CALENDAR_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.warn('[Calendar Utility] Missing Google Service Account credentials. Skipping push.');
    return;
  }

  try {
    const startTime = new Date(expiresAt);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default to 1 hour duration

    const event = {
      summary: `[SENTINEL] ${taskTitle}`,
      description: description || 'No description provided by Sentinel.',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: TIMEZONE,
      },
      reminders: {
        useDefault: true,
      },
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: event,
    });

    console.log(`[Calendar Success] Event created: ${response.data.htmlLink}`);
    return response.data.id;

  } catch (error: any) {
    console.error('[Calendar Error] Failed to push event to Google Calendar:', error.message);
    throw error;
  }
}
