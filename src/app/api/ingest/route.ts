import { NextRequest, NextResponse } from 'next/server';
import { IngestionEngine } from '@/lib/sentinel/engine';

/**
 * POST /api/ingest
 * High-Performance Aggregation Endpoint.
 * Logic Flow: Envelope Validation -> Strategy Parsing -> DB Dedupe -> NLP Enrichment -> Persistence.
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { source, data } = body;

    if (!source || !data) {
      return NextResponse.json(
        { error: 'Malformed Envelope: source and data are required.' }, 
        { status: 400 }
      );
    }

    // Engine handles Dedupe, Enrichment, and DB Write
    const task = await IngestionEngine.process(source, data);

    const latency = Date.now() - startTime;
    console.log(`[Sentinel Ingest] Success | Source: ${source} | Latency: ${latency}ms`);

    return NextResponse.json({ 
      status: 'success', 
      task_id: (task as any).id,
      fingerprint: task.fingerprint,
      enriched: !!(task as any).metadata?.extracted_at,
      latency_ms: latency
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Sentinel Critical Failure]', error);

    const isValidationError = error.name === 'ZodError';
    
    return NextResponse.json({ 
      status: 'error', 
      type: isValidationError ? 'SCHEMA_VIOLATION' : 'PERSISTENCE_FAILURE',
      message: error.message
    }, { status: isValidationError ? 422 : 500 });
  }
}
