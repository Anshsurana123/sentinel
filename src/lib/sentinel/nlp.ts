import { Priority } from '@prisma/client';

export interface SemanticExtraction {
  title: string;
  deadline?: string;
  priority: Priority;
  confidence: number;
  subject: string;
  reasoning: string;
  category: 'PHYSICS' | 'CHEMISTRY' | 'MATH' | 'CS' | 'DEV' | 'BUSINESS' | 'LIFE';
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
      return JSON.parse(content);
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
            content: `You are a ruthless, highly efficient Chief of Staff. Extract tasks and deadlines from the incoming message.
            
            RULES:
            1. If no task or actionable intel is present, return: {"actionable": false}
            2. Classify the task into EXACTLY one category: PHYSICS, CHEMISTRY, MATH, CS, DEV, BUSINESS, LIFE.
            3. If the category is PHYSICS, CHEMISTRY, MATH, or CS, act as a Cambridge AS-Level tutor. Fill "quick_reference" with a 1-2 sentence core concept, formula, or critical correction related to the topic.
            4. Provide exactly 1-3 relevant "tags" (e.g. ["kinematics", "past-paper"]).
            5. Priority MUST be one of: LOW, MEDIUM, HIGH, CRITICAL.
            
            Return JSON: 
            {
              "actionable": true,
              "title": "Clear task summary",
              "deadline": "ISO string or null",
              "priority": "HIGH",
              "category": "PHYSICS",
              "tags": ["kinematics"],
              "quick_reference": "Formula for acceleration: a = (v-u)/t. Ensure units are m/s^2.",
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
      const content = json.choices[0].message.content.trim();
      const parsed = JSON.parse(content);

      if (parsed.actionable === false) return null;
      return parsed;

    } catch (error: any) {
      console.error('[Task Extractor Error]:', error.message);
      return null;
    }
  }
}
