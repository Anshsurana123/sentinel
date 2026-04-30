import { Priority } from '@prisma/client';

export interface SemanticExtraction {
  title: string;
  deadline?: string;
  priority: Priority;
  confidence: number;
  subject: string;
}

/**
 * SemanticParser Service - Powered by Cerebras
 * Optimized for ultra-low latency JSON extraction.
 */
export class SemanticParser {
  private static API_KEY = process.env.CEREBRAS_API_KEY;
  private static CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';
  private static TIMEOUT_MS = 3000;

  static async extract(text: string): Promise<SemanticExtraction> {
    if (!this.API_KEY || this.API_KEY === 'your_api_key_here') {
      console.warn('[NLP] Cerebras API key missing.');
      return { 
        title: text.slice(0, 50), 
        priority: 'LOW', 
        confidence: 0, 
        subject: 'Unknown' 
      };
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
            content: `You are an expert student task extractor. Extract Subject, Task Title, and Deadline from student messages. 
            RULES:
            1. Respond ONLY with valid JSON.
            2. No conversational text. No markdown formatting.
            3. Keys: "title", "deadline" (ISO string), "priority" (LOW, MEDIUM, HIGH, CRITICAL), "confidence" (0.0-1.0), "subject".
            4. If it's casual chat or noise, set priority LOW and confidence 1.0.`
          }, {
            role: 'user',
            content: text
          }],
          response_format: { type: 'json_object' }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Explicit Error Logging for Cerebras
        const errorText = await response.text();
        console.error(`[CEREBRAS API ERROR]: Status ${response.status} - ${errorText}`);
        throw new Error(`Cerebras API Failure: ${response.status}`);
      }

      const json = await response.json();
      const content = json.choices[0].message.content.trim();

      const sanitizedContent = content.substring(
        content.indexOf('{'),
        content.lastIndexOf('}') + 1
      );

      return JSON.parse(sanitizedContent);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[CEREBRAS API ERROR]: Request Timeout (Exceeded 3000ms)');
      } else {
        console.error('[CEREBRAS API ERROR]:', error.message);
      }
      
      return { 
        title: text.slice(0, 50), 
        priority: 'MEDIUM', 
        confidence: 0.1, 
        subject: 'Extraction-Error' 
      };
    }
  }
}
