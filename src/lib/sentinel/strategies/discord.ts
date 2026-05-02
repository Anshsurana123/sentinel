import { IngestionStrategy } from './base';
import { UniversalTask, DiscordPayloadSchema } from '../schema';
import { generateFingerprint } from '../../utils/crypto';

export class DiscordStrategy implements IngestionStrategy<any> {
  parse(raw: any): Omit<UniversalTask, 'id'> {
    const data = DiscordPayloadSchema.parse(raw);
    
    return {
      source: 'DISCORD',
      externalId: data.id,
      fingerprint: generateFingerprint('DISCORD', data.id, data.content),
      title: `Discord Msg: ${data.author.username}`,
      content: data.content,
      priority: data.content.includes('!') ? 'HIGH' : 'MEDIUM',
      metadata: { 
        category: 'OTHER',
        tags: ['discord', 'raw-signal'],
        quick_reference: null,
        confidence: 1.0,
        subject: 'General Chat',
        reasoning: 'Direct ingestion from Discord listener',
        authorId: data.author.id,
      },
      createdAt: new Date(data.timestamp),
    };
  }
}
