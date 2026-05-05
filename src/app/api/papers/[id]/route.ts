import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/papers/[id]
 *
 * Redirects to the permanent Supabase Storage public URL.
 * Falls back to an error if the paper has no Supabase URL.
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

    if (paper.supabaseUrl) {
      return NextResponse.redirect(paper.supabaseUrl);
    }

    return NextResponse.json(
      { error: "No PDF URL available. This paper was uploaded before Supabase storage was enabled. Please re-upload it." },
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
