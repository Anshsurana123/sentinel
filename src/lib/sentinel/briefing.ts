import { prisma } from '../prisma';
import { startOfDay, endOfDay, subHours } from 'date-fns';

/**
 * Morning Briefing Service
 * Generates a tactical summary of the day's targets and missed knowledge.
 */
export async function generateDailyBriefing(): Promise<string | null> {
  const API_KEY = process.env.CEREBRAS_API_KEY;
  const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';

  if (!API_KEY) return "SENTINEL ERROR: No API Key for Intelligence Briefing.";

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const windowStart = subHours(now, 18);

    // Query Prisma for relevant signals
    const [todayTasks, missedIntel] = await Promise.all([
      prisma.universalTask.findMany({
        where: {
          expiresAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.universalTask.findMany({
        where: {
          createdAt: {
            gte: windowStart,
          },
          // Assuming 'not seen' means recently created tasks for now
          // We can refine this if we add a 'seen' status later.
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (todayTasks.length === 0 && missedIntel.length === 0) {
      return null; // Nothing to report
    }

    // Format the prompt for Cerebras
    const taskSummary = todayTasks.map(t => `- [${t.priority}] ${t.title}`).join('\n');
    const intelSummary = missedIntel.map(t => `- ${t.title} (${(t.metadata as any)?.category || 'GENERAL'})`).join('\n');

    const response = await fetch(CEREBRAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: [{
          role: 'system',
          content: `You are an elite military aide. Summarize these tasks into a brutalist, high-contrast briefing. 
          Use exactly these sections:
          [TARGETS FOR TODAY] - Tasks with immediate deadlines.
          [CRITICAL DEADLINES] - High/Critical priority items.
          [MISSED KNOWLEDGE] - Recent signals from the last 18 hours.
          
          Keep it short, sharp, and actionable. Use monospace-style formatting (e.g., [x], >>). No conversational filler.`
        }, {
          role: 'user',
          content: `TODAY'S SIGNALS:\n${taskSummary}\n\nRECENT INTEL:\n${intelSummary}`
        }],
        temperature: 0.2,
      })
    });

    if (!response.ok) throw new Error(`Cerebras Intelligence Error: ${response.status}`);
    const json = await response.json();
    return json.choices[0].message.content.trim();

  } catch (error: any) {
    console.error('[Briefing Error] Failed to generate daily briefing:', error.message);
    return "SENTINEL ERROR: Intelligence extraction failed.";
  }
}
