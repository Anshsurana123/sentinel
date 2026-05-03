import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { genAI } from "@/lib/gemini";
import { GoogleAIFileManager } from "@google/generative-ai/server";

// Allow this route to run up to 60 seconds on Vercel to handle large Gemini queries
export const maxDuration = 60;

/**
 * The system prompt turns Gemini into a strict, deterministic extraction tool.
 * It ONLY returns JSON — no preamble, no markdown fences, no explanation.
 */
const EXTRACTION_SYSTEM_PROMPT = `You are a strict, exact-match academic extraction tool.
Your ONLY job is to find text in the provided document that supports or refutes a given claim.
You must return ONLY a valid JSON object. No preamble. No markdown. No explanation.
The JSON must have this exact shape:
{
  "found": boolean,
  "exact_sentence": "the verbatim sentence from the document, copied character-for-character",
  "page_number": number or null,
  "context": "one sentence of surrounding context to help locate it",
  "verdict": "SUPPORTS" | "REFUTES" | "UNRELATED"
}
If you cannot find relevant text, set found to false and exact_sentence to null.`;

const LEARNING_SYSTEM_PROMPT = `You are a strict, helpful academic tutor.
Your ONLY job is to answer the user's question using ONLY information found in the provided document.
You must return ONLY a valid JSON object. No preamble. No markdown. No explanation.
The JSON must have this exact shape:
{
  "found": boolean,
  "answer": "your direct, helpful answer to the question based on the text",
  "exact_sentence": "a verbatim quote from the document that backs up your answer",
  "page_number": number or null,
  "context": "one sentence of surrounding context",
  "verdict": "ANSWERED" | "NOT_FOUND"
}
If you cannot find relevant text to answer the question, set found to false, answer to null, and verdict to "NOT_FOUND".`;

/**
 * POST /api/papers/query
 */
export async function POST(req: NextRequest) {
  let body: { paperId?: string; claim?: string; mode?: "fact_check" | "learn" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { paperId, claim, mode = "fact_check" } = body;
  if (!paperId || !claim) {
    return NextResponse.json({ error: "Both 'paperId' and 'claim' are required" }, { status: 400 });
  }

  // --- Look up the paper ---
  const paper = await prisma.paper.findUnique({ where: { id: paperId } });

  if (!paper?.geminiUri || !paper?.geminiFileId) {
    return NextResponse.json({ error: "Paper not found or not yet uploaded to Gemini" }, { status: 404 });
  }

  // --- Check File State ---
  try {
    const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY!);
    const geminiFile = await fileManager.getFile(paper.geminiFileId);
    
    if (geminiFile.state === "PROCESSING") {
      return NextResponse.json({ error: "Gemini is still indexing this PDF. Please wait a minute and try again." }, { status: 422 });
    } else if (geminiFile.state === "FAILED") {
      return NextResponse.json({ error: "Gemini failed to index this PDF. It might be corrupt or unreadable." }, { status: 422 });
    }
  } catch (err) {
    console.error("[papers/query] Failed to check file state:", err);
  }

  // --- Query Gemini with the file URI + claim ---
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: mode === "learn" ? LEARNING_SYSTEM_PROMPT : EXTRACTION_SYSTEM_PROMPT,
  });

  try {
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: "application/pdf",
          fileUri: paper.geminiUri,
        },
      },
      {
        text: mode === "learn" 
          ? `Answer this question using the document: "${claim}"`
          : `Find text in this document relevant to the following claim: "${claim}"`,
      },
    ]);

    const raw = result.response.text();
    const clean = raw.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(clean);
    return NextResponse.json({
      ...parsed,
      paperTitle: paper.title,
      paperId: paper.id,
    });
  } catch (err) {
    console.error("[papers/query] Gemini Generation Error:", err);
    
    // Check if it's a quota issue
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.includes("Quota")) {
      return NextResponse.json({ error: "Gemini API free tier quota exceeded. Please try again later." }, { status: 429 });
    }
    
    return NextResponse.json({ error: "Failed to extract lineage from document." }, { status: 500 });
  }
}
