import { Priority } from '@prisma/client';

export interface SemanticExtraction {
  title: string;
  deadline?: string;
  priority: Priority;
  confidence: number;
  subject: string;
  reasoning: string;
}

export interface IntentClassification {
  distraction: boolean;
  reason: string;
}

/**
 * SemanticParser Service - Powered by Cerebras
 * 
 * Two pipelines:
 *   1. classifyIntent() — Lightweight binary classifier for distraction detection
 *   2. extract()        — Full task extraction with structured JSON output
 */
export class SemanticParser {
  private static API_KEY = process.env.CEREBRAS_API_KEY;
  private static CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';
  private static TIMEOUT_MS = 3000;

  /**
   * PIPELINE 1: Intent Classifier
   * Lightweight call — only determines if a message is a distraction.
   * Uses a minimal prompt for speed and low token cost.
   */
  static async classifyIntent(text: string): Promise<IntentClassification> {
    if (!this.API_KEY || this.API_KEY === 'your_api_key_here') {
      // No API key — fallback to "not a distraction" so messages pass through
      return { distraction: false, reason: 'No API key configured' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(this.CEREBRAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama3.1-8b',
          messages: [{
            role: 'system',
            content: `You are a student focus guard. Classify if a Discord message is a DISTRACTION from studying.
Distractions include: gaming invites, hanging out, watching shows, social plans, memes, off-topic chat.
NOT distractions: homework questions, study groups, academic deadlines, project discussions.
Return JSON: {"distraction": true/false, "reason": "brief explanation"}`
          }, {
            role: 'user',
            content: text
          }],
          response_format: { type: 'json_object' }
        })
      });

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Cerebras Error: ${response.status}`);

      const json = await response.json();
      const content = json.choices[0].message.content.trim();
      const sanitized = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);

      return JSON.parse(sanitized);

    } catch (error: any) {
      console.error('[Intent Classifier Error]:', error.message);
      // On error, default to NOT a distraction (fail-open for messages)
      return { distraction: false, reason: 'Classification failed' };
    }
  }

  /**
   * PIPELINE 2: Full Task Extractor
   * Extracts structured academic task data from messages.
   */
  static async extract(text: string): Promise<SemanticExtraction | null> {
    if (!this.API_KEY || this.API_KEY === 'your_api_key_here') {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(this.CEREBRAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama3.1-8b',
          messages: [{
            role: 'system',
            content: `You are an expert student task extractor.
RULES:
1. If the message contains NO actionable task, deadline, or academic signal, return: {"actionable": false}
2. If actionable, return JSON with keys: "actionable" (true), "title", "deadline" (ISO string or null), "priority" (LOW, MEDIUM, HIGH, CRITICAL), "confidence" (0.0-1.0), "subject", "reasoning".
3. "reasoning" should be a brief sentence explaining why this priority was chosen.
4. Respond ONLY with valid JSON. No markdown. No conversational text.`
          }, {
            role: 'user',
            content: text
          }],
          response_format: { type: 'json_object' }
        })
      });

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Cerebras Error: ${response.status}`);

      const json = await response.json();
      const content = json.choices[0].message.content.trim();
      const sanitized = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
      const parsed = JSON.parse(sanitized);

      if (parsed.actionable === false) return null;

      return parsed;

    } catch (error: any) {
      console.error('[Task Extractor Error]:', error.message);
      return null;
    }
  }
}
