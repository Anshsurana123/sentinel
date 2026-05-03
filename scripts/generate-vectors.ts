import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// ═══════════════════════════════════════════════════════════════
//  SENTINEL LINEAGE ENGINE — JSON VECTOR GENERATOR
//  Processes a PDF into a vectorized JSON file for manual upload.
//
//  Uses the Gemini REST API directly to support gemini-embedding-001
//  with outputDimensionality (not yet exposed by @langchain/google-genai).
// ═══════════════════════════════════════════════════════════════

const BATCH_SIZE = 40;           // Chunks per embedding batch
const COOLDOWN_MS = 35000;       // 35s between batches (free tier: 100 reqs/min, 2×40=80/cycle)
const MAX_RETRIES = 3;           // Auto-retry on 429 before giving up
const EMBEDDING_MODEL = 'gemini-embedding-001';
const OUTPUT_DIMENSIONS = 768;
const PDF_PATH = path.resolve(__dirname, '..', 'physics_as_coursebook.pdf');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'physics_vectors.json');

interface VectorEntry {
  text: string;
  embedding: number[];
  metadata: {
    source: string;
    page: number;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls the Gemini batchEmbedContents REST endpoint directly.
 * This bypasses the outdated LangChain wrapper to support
 * gemini-embedding-001 with outputDimensionality.
 *
 * Includes automatic retry with backoff on 429 (rate limit) errors.
 */
async function batchEmbed(texts: string[], apiKey: string): Promise<number[][]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`;

  const requests = texts.map((text) => ({
    model: `models/${EMBEDDING_MODEL}`,
    content: { parts: [{ text }] },
    outputDimensionality: OUTPUT_DIMENSIONS,
  }));

  const body = JSON.stringify({ requests });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (response.ok) {
      const data = await response.json() as {
        embeddings: { values: number[] }[];
      };
      return data.embeddings.map((e) => e.values);
    }

    // Handle rate limiting with smart backoff
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const errorBody = await response.text();

      // Try to parse the retryDelay hint from the API response
      let waitSec = 10 * attempt; // fallback: 10s, 20s, 30s
      try {
        const parsed = JSON.parse(errorBody);
        const retryInfo = parsed?.error?.details?.find(
          (d: any) => d['@type']?.includes('RetryInfo')
        );
        if (retryInfo?.retryDelay) {
          const parsed_sec = parseFloat(retryInfo.retryDelay);
          if (!isNaN(parsed_sec) && parsed_sec > 0) waitSec = Math.ceil(parsed_sec) + 2;
        }
      } catch { /* use fallback */ }

      console.log(`[JSON-GEN] ⚠ Rate limited (429). Retrying in ${waitSec}s... (attempt ${attempt}/${MAX_RETRIES})`);
      await sleep(waitSec * 1000);
      continue;
    }

    // Non-retryable error or final attempt exhausted
    const errorBody = await response.text();
    throw new Error(`Gemini API ${response.status}: ${errorBody}`);
  }

  throw new Error('batchEmbed: max retries exhausted');
}

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error('[JSON-GEN] FATAL: Missing GOOGLE_API_KEY environment variable.');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════');
  console.log('[JSON-GEN] Vector Generator Initialized.');
  console.log(`[JSON-GEN] Source PDF: ${PDF_PATH}`);
  console.log(`[JSON-GEN] Output:     ${OUTPUT_PATH}`);
  console.log('═══════════════════════════════════════════════');

  // ───────────────────────────────────────────────
  // STAGE 1: LOAD PDF
  // ───────────────────────────────────────────────
  console.log('\n[JSON-GEN] STAGE 1 — Loading PDF into memory...');
  const loader = new PDFLoader(PDF_PATH);
  const rawDocs = await loader.load();
  console.log(`[JSON-GEN] Loaded ${rawDocs.length} page(s) from PDF.`);

  // ───────────────────────────────────────────────
  // STAGE 2: TEXT SPLITTING
  // ───────────────────────────────────────────────
  console.log('\n[JSON-GEN] STAGE 2 — Splitting text into chunks...');
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const chunks = await splitter.splitDocuments(rawDocs);
  console.log(`[JSON-GEN] Generated ${chunks.length} chunks. (size: 1000 / overlap: 200)`);

  // ───────────────────────────────────────────────
  // STAGE 3: EMBEDDING MODEL INFO
  // ───────────────────────────────────────────────
  console.log('\n[JSON-GEN] STAGE 3 — Embedding Configuration');
  console.log(`[JSON-GEN] Model: ${EMBEDDING_MODEL}`);
  console.log(`[JSON-GEN] Output Dimensions: ${OUTPUT_DIMENSIONS}`);
  console.log('[JSON-GEN] Method: Direct REST API (v1beta)');

  // ───────────────────────────────────────────────
  // STAGE 4: BATCHED VECTORIZATION WITH RATE LIMITING
  // ───────────────────────────────────────────────
  const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
  const vectorizedData: VectorEntry[] = [];

  console.log(`\n[JSON-GEN] STAGE 4 — Beginning batched vectorization. (${totalBatches} batches)`);
  console.log(`[JSON-GEN] Batch Size: ${BATCH_SIZE} | Cooldown: ${COOLDOWN_MS / 1000}s`);
  console.log('═══════════════════════════════════════════════\n');

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batchEnd = Math.min(i + BATCH_SIZE, chunks.length);
    const batch = chunks.slice(i, batchEnd);

    console.log(`[JSON-GEN] Vectorizing chunks ${i + 1}-${batchEnd}... (Batch ${batchNum}/${totalBatches})`);

    try {
      // Extract text content for batch embedding
      const texts = batch.map((chunk) => chunk.pageContent);
      const vectors = await batchEmbed(texts, apiKey);

      // Build vector entries for each chunk in the batch
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const pageNumber = chunk.metadata?.loc?.pageNumber ?? chunk.metadata?.page ?? 0;

        vectorizedData.push({
          text: chunk.pageContent,
          embedding: vectors[j],
          metadata: {
            source: 'physics_as_coursebook',
            page: pageNumber,
          },
        });
      }

      console.log(`[JSON-GEN] Batch ${batchNum}/${totalBatches} Complete. ✓ (${vectorizedData.length} total entries)`);
    } catch (error: any) {
      console.error(`[JSON-GEN] Batch ${batchNum} FAILED:`, error.message);
      console.log('[JSON-GEN] Attempting to continue with next batch...');
    }

    // Rate limit cooldown (skip after last batch)
    if (i + BATCH_SIZE < chunks.length) {
      console.log(`[JSON-GEN] Cooling down... (${COOLDOWN_MS / 1000}s)\n`);
      await sleep(COOLDOWN_MS);
    }
  }

  // ───────────────────────────────────────────────
  // STAGE 5: WRITE JSON OUTPUT
  // ───────────────────────────────────────────────
  console.log('\n[JSON-GEN] STAGE 5 — Writing vectorized data to JSON...');
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(vectorizedData, null, 2), 'utf-8');

  const fileSizeMB = (fs.statSync(OUTPUT_PATH).size / (1024 * 1024)).toFixed(2);

  console.log('\n═══════════════════════════════════════════════');
  console.log('[JSON-GEN] VECTORIZATION COMPLETE.');
  console.log(`[JSON-GEN] Total Entries: ${vectorizedData.length}`);
  console.log(`[JSON-GEN] Output File:   ${OUTPUT_PATH}`);
  console.log(`[JSON-GEN] File Size:     ${fileSizeMB} MB`);
  console.log(`[JSON-GEN] Dimensions:    ${OUTPUT_DIMENSIONS} per vector`);
  console.log('═══════════════════════════════════════════════');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n[JSON-GEN] UNRECOVERABLE ERROR:', err.message);
  process.exit(1);
});
