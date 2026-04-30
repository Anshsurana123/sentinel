import { createHash } from 'crypto';

/**
 * Generates a SHA-256 fingerprint for deduplication.
 * Ensures the same content from the same source isn't processed twice.
 */
export function generateFingerprint(source: string, externalId: string, content: string): string {
  return createHash('sha256')
    .update(`${source}:${externalId}:${content}`)
    .digest('hex');
}
