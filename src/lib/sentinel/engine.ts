import { DiscordStrategy } from './strategies/discord';
import { CanvasStrategy } from './strategies/canvas';
import { WhatsAppStrategy } from './strategies/whatsapp';
import { IngestionStrategy } from './strategies/base';
import { UniversalTaskSchema, UniversalTask } from './schema';
import { SemanticParser } from './nlp';
import { prisma } from '../prisma';
import { pushToCalendar } from './gcal';

/**
 * The IngestionEngine Coordinator
 * Orchestrates cross-platform signal ingestion, deduplication, and AI-driven enrichment.
 */
export class IngestionEngine {
  private static strategies: Record<string, IngestionStrategy<any>> = {
    DISCORD: new DiscordStrategy(),
    CANVAS: new CanvasStrategy(),
    WHATSAPP: new WhatsAppStrategy(),
  };

  /**
   * Process incoming signals from various sources.
   * Enforces strict category taxonomy and AI-generated AS-Level contextual notes.
   */
  static async process(source: string, payload: any): Promise<UniversalTask | null> {
    const sourceKey = source.toUpperCase();
    const strategy = this.strategies[sourceKey];
    
    if (!strategy) {
      console.error(`[Engine] Unsupported signal source: ${source}`);
      throw new Error(`Unsupported source: ${source}`);
    }

    try {
      const parsed = strategy.parse(payload);

      // 1. Hardware-Level Deduplication Check (Fingerprint)
      const existingTask = await prisma.universalTask.findUnique({
        where: { fingerprint: parsed.fingerprint }
      });

      if (existingTask) {
        console.log(`[Engine] Dedupe Hit: ${parsed.fingerprint}`);
        return existingTask as any;
      }

      // 2. Semantic Filtering & Enrichment (Powered by Cerebras)
      const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const nlpData = await SemanticParser.extract(parsed.content || '', now);
      
      if (!nlpData) {
        console.log(`[Engine Filter] Signal discarded as non-actionable noise: ${parsed.fingerprint}`);
        return null;
      }

      // 3. Metadata Validation & Persistence
      const taskMetadata = {
        category: nlpData.category,
        tags: nlpData.tags.slice(0, 3).map(t => t.toLowerCase().replace(/\s+/g, '-')),
        quick_reference: nlpData.category === 'STUDY' ? nlpData.quick_reference : null,
        confidence: nlpData.confidence,
        subject: nlpData.subject,
        reasoning: nlpData.reasoning,
        enriched_at: new Date().toISOString()
      };

      // Final Zod verification before saving
      const finalTaskData = {
        fingerprint: parsed.fingerprint,
        source: parsed.source,
        externalId: parsed.externalId,
        title: nlpData.title || parsed.title,
        content: parsed.content,
        priority: nlpData.priority,
        metadata: taskMetadata,
        expiresAt: nlpData.deadline ? new Date(nlpData.deadline) : null,
      };

      // Safely validate the task against the schema
      const validation = UniversalTaskSchema.safeParse({ ...finalTaskData, createdAt: new Date() });
      if (!validation.success) {
        console.error(`[Engine Validation Error] Task schema mismatch:`, JSON.stringify(validation.error.format(), null, 2));
        return null; 
      }

      const savedTask = await prisma.universalTask.create({
        data: {
          ...finalTaskData,
          metadata: taskMetadata as any,
          createdAt: new Date(),
        }
      });

      console.log(`[Engine Success] Ingested ${sourceKey} signal: ${savedTask.title} [${nlpData.category}]`);

      // 4. Google Calendar Integration
      // Only push if a deadline was successfully extracted and resolved
      if (nlpData.deadline) {
        try {
          await pushToCalendar(
            savedTask.title,
            nlpData.quick_reference || savedTask.content || 'Synced from Sentinel',
            nlpData.deadline
          );
        } catch (calError) {
          // Failure to push to calendar should NOT crash the ingestion flow
          console.warn('[Engine Hook] Failed to sync to Google Calendar, but task was saved.');
        }
      }

      return savedTask as any;

    } catch (error: any) {
      console.error(`[Engine Critical Error] Processing failed for ${sourceKey}:`, error.message);
      return null; 
    }
  }
}
