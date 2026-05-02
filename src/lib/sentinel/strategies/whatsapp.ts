import { IngestionStrategy } from './base';
import { UniversalTask, WhatsAppPayloadSchema } from '../schema';
import { generateFingerprint } from '../../utils/crypto';

/**
 * WhatsApp Ingestion Strategy
 * Parses incoming WhatsApp messages into the UniversalTask format.
 */
export class WhatsAppStrategy implements IngestionStrategy<any> {
  parse(raw: any): Omit<UniversalTask, 'id'> {
    const data = WhatsAppPayloadSchema.parse(raw);

    return {
      source: 'WHATSAPP',
      externalId: data.id,
      fingerprint: generateFingerprint('WHATSAPP', data.id, data.content),
      title: `WhatsApp: ${data.author}`,
      content: data.content,
      priority: 'MEDIUM',
      metadata: {
        category: 'OTHER',
        tags: ['whatsapp', 'raw-signal'],
        quick_reference: null,
        confidence: 1.0,
        subject: 'General Chat',
        reasoning: 'Direct ingestion from WhatsApp listener',
      },
      createdAt: new Date(data.timestamp),
    };
  }
}
