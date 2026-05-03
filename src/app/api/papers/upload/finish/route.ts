import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/papers/upload/finish
 *
 * Saves the successfully uploaded Gemini file into Prisma.
 */
export async function POST(req: NextRequest) {
  try {
    const { title, geminiUri, geminiFileId } = await req.json();

    if (!geminiUri || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const paper = await prisma.paper.create({
      data: {
        title,
        geminiUri,
        geminiFileId,
      },
    });

    return NextResponse.json({
      paperId: paper.id,
      title: paper.title,
      geminiUri,
    });
  } catch (err) {
    console.error("[upload/finish]", err);
    return NextResponse.json({ error: "Failed to save paper metadata" }, { status: 500 });
  }
}
