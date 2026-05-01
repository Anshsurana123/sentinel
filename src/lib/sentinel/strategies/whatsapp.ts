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
        author: data.author,
        platform: 'whatsapp-web.js',
      },
      createdAt: new Date(data.timestamp),
    };
  }
}
