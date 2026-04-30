import { UniversalTask } from '../schema';

/**
 * Base interface for all ingestion strategies.
 * Implements the Strategy Pattern for decoupling source-specific logic.
 */
export interface IngestionStrategy<T> {
  parse(raw: T): Omit<UniversalTask, 'id'>;
}
