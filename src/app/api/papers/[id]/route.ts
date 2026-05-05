import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/papers/[id]
 *
 * Proxies the PDF from Gemini File API so the browser can render it
 * via react-pdf without exposing the API key.
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

    if (!paper.geminiFileId || !paper.geminiUri) {
      return NextResponse.json(
        { error: "No file available for this paper" },
        { status: 404 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    // Attempt media download via Gemini REST API
    const downloadUrl = `https://generativelanguage.googleapis.com/v1beta/${paper.geminiFileId}?key=${apiKey}&alt=media`;

    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok) {
      const errText = await fileRes.text().catch(() => "Unknown error");
      console.error("[papers/get] Gemini download failed:", errText);

      if (fileRes.status === 404 || fileRes.status === 410) {
        return NextResponse.json(
          { expired: true, paperId: id, paperTitle: paper.title },
          { status: 410 }
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch PDF from storage" },
        { status: 502 }
      );
    }

    const blob = await fileRes.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(
          paper.title
        )}.pdf"`,
      },
    });
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
