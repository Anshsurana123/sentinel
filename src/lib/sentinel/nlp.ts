import { Priority } from '@prisma/client';

export interface SemanticExtraction {
  title: string;
  deadline?: string;
  priority: Priority;
  confidence: number;
  subject: string;
  reasoning: string;
  category: 'STUDY' | 'WORK' | 'CHILL' | 'OTHER';
  tags: string[];
  quick_reference: string | null;
  actionable: boolean;
}

export interface IntentClassification {
  distraction: boolean;
  reason: string;
}

/**
 * SemanticParser Service - Powered by Cerebras
 */
export class SemanticParser {
  private static API_KEY = process.env.CEREBRAS_API_KEY;
  private static CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';
  private static TIMEOUT_MS = 3000;

  static async classifyIntent(text: string): Promise<IntentClassification> {
    if (!this.API_KEY || this.API_KEY === 'your_api_key_here') {
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
            content: `You are a student focus guard. Classify if a message is a DISTRACTION from studying.
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
      return JSON.parse(json.choices[0].message.content);
    } catch (error: any) {
      console.error('[Intent Classifier Error]:', error.message);
      return { distraction: false, reason: 'Classification failed' };
    }
  }

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
            content: `You are a ruthless, highly efficient Chief of Staff analyzing incoming messages.
            
            RULES:
            1. You are an elite intel extractor. You must capture ANY of the following Signals: explicit tasks, upcoming events (e.g., tests, meetings), deadlines, or critical academic information. Even if a message is just a statement of fact (like 'chem test today'), it is a high-priority Signal.
            2. Map academic topics (Physics, Chemistry, Math, CS) to the category: STUDY.
            3. Map coding, development, and business logistics to the category: WORK.
            4. Map social, gaming, and general life to CHILL or OTHER.
            5. CRITICAL: If the category is STUDY, you MUST act as a Cambridge AS-Level tutor. Extract the core academic concept and write a 1-2 sentence "quick_reference" containing a vital formula, definition, or concept reminder. 
            6. For non-STUDY categories, return null for "quick_reference".
            7. Generate 1-3 lowercase, hyphenated "tags" (e.g. ["past-paper", "kinematics"]).
            8. If the message is just a normal chat message (e.g - heyy whats up) then return {"actionable": false}
            Return JSON: 
            {
              "actionable": true,
              "title": "Clear task summary",
              "deadline": "ISO string or null",
              "priority": "HIGH",
              "category": "STUDY",
              "tags": ["past-paper", "mechanics"],
              "quick_reference": "Work Done = Force x displacement in the direction of force (W=Fs cosθ).",
              "confidence": 0.95,
              "subject": "Main topic",
              "reasoning": "Why this priority"
            }`
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
      const parsed = JSON.parse(json.choices[0].message.content);

      if (parsed.actionable === false) return null;
      return parsed;

    } catch (error: any) {
      console.error('[Task Extractor Error]:', error.message);
      return null;
    }
  }
}
