import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/papers/[id]
 *
 * Redirects to the Supabase Storage public URL for the PDF.
 * Never proxies/pipes the file through Vercel — avoids the 4.5MB
 * response-body limit and the 10s serverless timeout.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const paper = await prisma.paper.findUnique({
      where: { id },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Redirect the browser directly to Supabase Storage — never pipe through Vercel
    if (paper.supabaseUrl) {
      return NextResponse.redirect(paper.supabaseUrl);
    }

    return NextResponse.json(
      { error: "No PDF URL found for this paper" },
      { status: 404 }
    );
  } catch (err) {
    console.error("[papers/get] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch paper" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/papers/[id]
 *
 * Deletes the paper from the database and attempts to delete
 * the associated file from Gemini to free up space.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const paper = await prisma.paper.findUnique({
      where: { id },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Attempt to delete from Gemini to free up space
    if (paper.geminiFileId) {
      try {
        const { GoogleAIFileManager } = await import("@google/generative-ai/server");
        const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY!);
        await fileManager.deleteFile(paper.geminiFileId);
      } catch (err) {
        console.error("[papers/delete] Failed to delete file from Gemini:", err);
      }
    }

    // Delete related claims first, then delete the paper
    await prisma.claim.deleteMany({
      where: { paperId: id },
    });

    await prisma.paper.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[papers/delete] Error deleting paper:", err);
    return NextResponse.json(
      { error: "Failed to delete paper" },
      { status: 500 }
    );
  }
}
