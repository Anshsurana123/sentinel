import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/sentinel/claims
 *
 * Saves a new claim to the database.
 * Body: { text, verdict, exactSentence?, pageNumber?, context?, paperId, parentId? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, verdict, exactSentence, pageNumber, context, paperId, parentId } = body;

    if (!text || !verdict || !paperId) {
      return NextResponse.json(
        { error: "text, verdict, and paperId are required" },
        { status: 400 }
      );
    }

    const claim = await prisma.claim.create({
      data: {
        text,
        verdict,
        exactSentence: exactSentence ?? null,
        pageNumber: pageNumber ?? null,
        context: context ?? null,
        paperId,
        parentId: parentId ?? null,
      },
      include: { paper: true },
    });

    return NextResponse.json({ claim }, { status: 201 });
  } catch (err) {
    console.error("[sentinel/claims] Error:", err);
    return NextResponse.json(
      { error: "Failed to create claim" },
      { status: 500 }
    );
  }
}
