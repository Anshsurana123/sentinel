import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paper = await prisma.paper.findUnique({
      where: { id: params.id },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Attempt to delete from Gemini to free up space
    if (paper.geminiFileId) {
      try {
        const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY!);
        await fileManager.deleteFile(paper.geminiFileId);
      } catch (err) {
        console.error("[papers/delete] Failed to delete file from Gemini:", err);
      }
    }

    await prisma.paper.delete({
      where: { id: params.id },
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
