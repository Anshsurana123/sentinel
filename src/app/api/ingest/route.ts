import { NextRequest, NextResponse } from 'next/server';
import { IngestionEngine } from '@/lib/sentinel/engine';

export async function POST(req: NextRequest) {
  const start = Date.now();
  
  try {
    const { source, payload } = await req.json();

    if (!source || !payload) {
      return NextResponse.json({ error: 'Missing source or payload' }, { status: 400 });
    }

    // Process through Ingestion Engine
    const task = await IngestionEngine.process(source, payload);
    const latency = Date.now() - start;

    // Handle signals discarded as noise
    if (!task) {
      return NextResponse.json({ 
        status: 'filtered', 
        message: 'Signal discarded as noise by AI social filter',
        latency_ms: latency
      }, { status: 200 });
    }

    // Success response for actionable tasks
    return NextResponse.json({ 
      status: 'success', 
      task_id: task.id,
      fingerprint: task.fingerprint,
      enriched: !!(task.metadata as any)?.enriched_at,
      latency_ms: latency
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Ingest API Error]:', error.message);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}
