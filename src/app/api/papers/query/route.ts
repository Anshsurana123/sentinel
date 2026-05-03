import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { genAI } from "@/lib/gemini";

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

/**
 * POST /api/papers/query
 *
 * Body JSON:
 *   - paperId: string   (the Paper record ID from Supabase)
 *   - claim:   string   (the claim to fact-check against the document)
 *
 * Returns the extraction result with verdict, exact sentence, and page number.
 */
export async function POST(req: NextRequest) {
  let body: { paperId?: string; claim?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { paperId, claim } = body;

  if (!paperId || !claim) {
    return NextResponse.json(
      { error: "Both 'paperId' and 'claim' are required" },
      { status: 400 }
    );
  }

  // --- Look up the paper ---
  const paper = await prisma.paper.findUnique({ where: { id: paperId } });

  if (!paper?.geminiUri) {
    return NextResponse.json(
      { error: "Paper not found or not yet uploaded to Gemini" },
      { status: 404 }
    );
  }

  // --- Query Gemini with the file URI + claim ---
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: EXTRACTION_SYSTEM_PROMPT,
  });

  const result = await model.generateContent([
    {
      fileData: {
        mimeType: "application/pdf",
        fileUri: paper.geminiUri,
      },
    },
    {
      text: `Find text in this document relevant to the following claim: "${claim}"`,
    },
  ]);

  const raw = result.response.text();

  // Strip any accidental markdown fences the model might emit
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(clean);
    return NextResponse.json({
      ...parsed,
      paperTitle: paper.title,
      paperId: paper.id,
    });
  } catch {
    console.error("[papers/query] JSON parse failed. Raw output:", raw);
    return NextResponse.json(
      { error: "Gemini returned unparseable output", raw },
      { status: 500 }
    );
  }
}
