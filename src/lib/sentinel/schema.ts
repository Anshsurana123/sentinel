import { z } from 'zod';

export const SourceType = z.enum(['DISCORD', 'CANVAS', 'WHATSAPP', 'SYSTEM', 'WEBHOOK']);

export const CategoryEnum = z.enum(['PHYSICS', 'CHEMISTRY', 'MATH', 'CS', 'DEV', 'BUSINESS', 'LIFE']);

export const UniversalTaskSchema = z.object({
  id: z.string().uuid().optional(),
  fingerprint: z.string(), // SHA-256 hash for deduplication
  source: SourceType,
  externalId: z.string(),  // Original ID from source (e.g., Discord Message ID)
  title: z.string().min(1),
  content: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  metadata: z.record(z.string(), z.any()), // Keep record for DB flexibility but we type it in code
  createdAt: z.date(),
  expiresAt: z.date().optional(),
});

export type UniversalTask = z.infer<typeof UniversalTaskSchema>;

// Raw Ingestion Schemas
export const DiscordPayloadSchema = z.object({
  content: z.string(),
  id: z.string(),
  author: z.object({ id: z.string(), username: z.string() }),
  timestamp: z.string(),
});

export const CanvasPayloadSchema = z.object({
  title: z.string(),
  id: z.number(),
  description: z.string().optional(),
  todo_date: z.string().optional(),
});

export const WhatsAppPayloadSchema = z.object({
  id: z.string(),
  content: z.string(),
  author: z.string(),     // phone number or contact name
  timestamp: z.string(),
});

export type IngestionPayload = 
  | { source: 'DISCORD'; data: z.infer<typeof DiscordPayloadSchema> }
  | { source: 'CANVAS'; data: z.infer<typeof CanvasPayloadSchema> }
  | { source: 'WHATSAPP'; data: z.infer<typeof WhatsAppPayloadSchema> };
