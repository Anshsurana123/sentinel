import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const fileManagerPromise = import("@google/generative-ai/server").then(
  ({ GoogleAIFileManager }) => new GoogleAIFileManager(process.env.GOOGLE_API_KEY!)
);

/**
 * POST /api/papers/[id]/refresh
 *
 * Re-uploads a PDF to the Gemini File API when the previous URI has expired,
 * then updates the Paper record with the new URI and file ID.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const paper = await prisma.paper.findUnique({ where: { id } });
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const fileManager = await fileManagerPromise;
    const uploadResult = await fileManager.uploadFile(
      Buffer.from(await file.arrayBuffer()),
      {
        mimeType: "application/pdf",
        displayName: paper.title,
      }
    );

    await prisma.paper.update({
      where: { id },
      data: {
        geminiUri: uploadResult.file.uri,
        geminiFileId: uploadResult.file.name,
      },
    });

    return NextResponse.json({ success: true, paperId: id });
  } catch (err) {
    console.error("[papers/refresh] Error:", err);
    return NextResponse.json(
      { error: "Failed to refresh paper" },
      { status: 500 }
    );
  }
}
