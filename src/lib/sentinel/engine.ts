import { DiscordStrategy } from './strategies/discord';
import { CanvasStrategy } from './strategies/canvas';
import { WhatsAppStrategy } from './strategies/whatsapp';
import { IngestionStrategy } from './strategies/base';
import { UniversalTaskSchema, UniversalTask } from './schema';
import { SemanticParser } from './nlp';
import { prisma } from '../prisma';

/**
 * The IngestionEngine Coordinator
 * Enhanced with Semantic Filtering to discard non-actionable noise.
 */
export class IngestionEngine {
  private static strategies: Record<string, IngestionStrategy<any>> = {
    DISCORD: new DiscordStrategy(),
    CANVAS: new CanvasStrategy(),
    WHATSAPP: new WhatsAppStrategy(),
  };

  static async process(source: string, payload: any): Promise<UniversalTask | null> {
    const strategy = this.strategies[source.toUpperCase()];
    if (!strategy) throw new Error(`Unsupported source: ${source}`);

    const parsed = strategy.parse(payload);

    // 1. Hardware-Level Deduplication Check
    const existingTask = await prisma.universalTask.findUnique({
      where: { fingerprint: parsed.fingerprint }
    });

    if (existingTask) {
      console.log(`[Sentinel] Dedupe Hit: ${parsed.fingerprint}`);
      return existingTask as any;
    }

    // 2. Semantic Filtering (Powered by Cerebras)
    const nlpData = await SemanticParser.extract(parsed.content || '');
    
    if (!nlpData) {
      console.log(`[Sentinel Filter] Signal discarded as noise: ${parsed.fingerprint}`);
      return null;
    }

    // 3. Final Persistence with Enrichment
    const savedTask = await prisma.universalTask.create({
      data: {
        fingerprint: parsed.fingerprint,
        source: parsed.source as any,
        externalId: parsed.externalId,
        title: nlpData.title || parsed.title,
        content: parsed.content,
        priority: nlpData.priority,
        expiresAt: nlpData.deadline ? new Date(nlpData.deadline) : null,
        metadata: {
          ...parsed.metadata,
          confidence: nlpData.confidence,
          subject: nlpData.subject,
          reasoning: nlpData.reasoning,
          enriched_at: new Date().toISOString()
        }
      }
    });

    return savedTask as any;
  }
}
