import 'dotenv/config';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import clientPromise from '../src/lib/sentinel/mongodb';

// ═══════════════════════════════════════════════════════════════
//  SENTINEL LINEAGE ENGINE — PDF SHREDDER
//  Ingests academic PDFs into the Atlas vector knowledge base.
// ═══════════════════════════════════════════════════════════════

const BATCH_SIZE = 40;           // Chunks per embedding batch
const COOLDOWN_MS = 5000;        // 5s delay between batches (free-tier protection)
const DB_NAME = 'sentinel_lineage';
const COLLECTION_NAME = 'knowledge_base';
const INDEX_NAME = 'vector_index';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.error('═══════════════════════════════════════════════');
    console.error('[SHREDDER] FATAL: No PDF path provided.');
    console.error('  Usage: npx tsx scripts/ingest-pdf.ts <path-to-pdf>');
    console.error('═══════════════════════════════════════════════');
    process.exit(1);
  }

  if (!process.env.GOOGLE_API_KEY) {
    console.error('[SHREDDER] FATAL: Missing GOOGLE_API_KEY environment variable.');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════');
  console.log('[SHREDDER] System Initialized.');
  console.log(`[SHREDDER] Target: ${pdfPath}`);
  console.log('═══════════════════════════════════════════════');

  // ───────────────────────────────────────────────
  // STAGE 1: LOAD PDF
  // ───────────────────────────────────────────────
  console.log('\n[SHREDDER] STAGE 1 — Loading PDF into memory...');
  const loader = new PDFLoader(pdfPath);
  const rawDocs = await loader.load();
  console.log(`[SHREDDER] Loaded ${rawDocs.length} page(s) from PDF.`);

  // ───────────────────────────────────────────────
  // STAGE 2: TEXT SPLITTING
  // ───────────────────────────────────────────────
  console.log('\n[SHREDDER] STAGE 2 — Splitting text into chunks...');
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const chunks = await splitter.splitDocuments(rawDocs);
  console.log(`[SHREDDER] Generated ${chunks.length} chunks. (size: 1000 / overlap: 200)`);

  // ───────────────────────────────────────────────
  // STAGE 3: CONNECT TO ATLAS
  // ───────────────────────────────────────────────
  console.log('\n[SHREDDER] STAGE 3 — Connecting to MongoDB Atlas...');
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);
  console.log(`[SHREDDER] Connected. Target: ${DB_NAME}.${COLLECTION_NAME}`);

  // ───────────────────────────────────────────────
  // STAGE 4: INITIALIZE EMBEDDINGS MODEL
  // ───────────────────────────────────────────────
  console.log('\n[SHREDDER] STAGE 4 — Initializing Gemini Embedding Model...');
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    modelName: 'embedding-001',  // 768-dimension model
  });
  console.log('[SHREDDER] Embedding Model: embedding-001 (768 dimensions)');

  // ───────────────────────────────────────────────
  // STAGE 5: BATCHED INGESTION WITH RATE LIMITING
  // ───────────────────────────────────────────────
  const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
  console.log(`\n[SHREDDER] STAGE 5 — Beginning batched ingestion. (${totalBatches} batches)`);
  console.log(`[SHREDDER] Batch Size: ${BATCH_SIZE} | Cooldown: ${COOLDOWN_MS / 1000}s`);
  console.log('═══════════════════════════════════════════════\n');

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = chunks.slice(i, i + BATCH_SIZE);

    console.log(`[SHREDDER] Processing Batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`);

    try {
      await MongoDBAtlasVectorSearch.fromDocuments(
        batch,
        embeddings,
        {
          collection,
          indexName: INDEX_NAME,
          textKey: 'text',
          embeddingKey: 'embedding',
        }
      );

      console.log(`[SHREDDER] Batch ${batchNum}/${totalBatches} Complete. ✓`);
    } catch (error: any) {
      console.error(`[SHREDDER] Batch ${batchNum} FAILED:`, error.message);
      console.log('[SHREDDER] Attempting to continue with next batch...');
    }

    // Rate limit cooldown (skip after last batch)
    if (i + BATCH_SIZE < chunks.length) {
      console.log(`[SHREDDER] Cooling down... (${COOLDOWN_MS / 1000}s)\n`);
      await sleep(COOLDOWN_MS);
    }
  }

  // ───────────────────────────────────────────────
  // COMPLETE
  // ───────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════');
  console.log('[SHREDDER] INGESTION COMPLETE.');
  console.log(`[SHREDDER] ${chunks.length} chunks embedded into ${DB_NAME}.${COLLECTION_NAME}`);
  console.log(`[SHREDDER] Atlas Index: ${INDEX_NAME} (768 dims)`);
  console.log('═══════════════════════════════════════════════');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n[SHREDDER] UNRECOVERABLE ERROR:', err.message);
  process.exit(1);
});
