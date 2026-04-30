import { IngestionStrategy } from './base';
import { UniversalTask, CanvasPayloadSchema } from '../schema';
import { generateFingerprint } from '../../utils/crypto';

export class CanvasStrategy implements IngestionStrategy<any> {
  parse(raw: any): Omit<UniversalTask, 'id'> {
    const data = CanvasPayloadSchema.parse(raw);
    
    return {
      source: 'CANVAS',
      externalId: String(data.id),
      fingerprint: generateFingerprint('CANVAS', String(data.id), data.title),
      title: data.title,
      content: data.description || 'No description provided',
      priority: 'HIGH', // Canvas alerts are usually high priority
      metadata: {
        todoDate: data.todo_date
      },
      createdAt: new Date(),
    };
  }
}
