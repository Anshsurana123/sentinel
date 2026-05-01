import { Priority } from '@prisma/client';

export interface SemanticExtraction {
  title: string;
  deadline?: string;
  priority: Priority;
  confidence: number;
  subject: string;
  reasoning: string;
}

/**
 * SemanticParser Service - Powered by Cerebras
 * Optimized for ultra-low latency JSON extraction and signal filtering.
 */
export class SemanticParser {
  private static API_KEY = process.env.CEREBRAS_API_KEY;
  private static CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';
  private static TIMEOUT_MS = 3000;

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
            1. If the message contains NO actionable task, deadline, or academic signal (e.g. casual chat, gaming noise), return: {"actionable": false}
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

      const sanitizedContent = content.substring(
        content.indexOf('{'),
        content.lastIndexOf('}') + 1
      );

      const parsed = JSON.parse(sanitizedContent);

      // If the AI marked this as non-actionable, return null
      if (parsed.actionable === false) return null;

      return parsed;

    } catch (error: any) {
      console.error('[NLP Filter Error]:', error.message);
      return null;
    }
  }
}
