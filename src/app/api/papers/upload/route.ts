import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { prisma } from "@/lib/prisma";
import { fileManager } from "@/lib/gemini";

/**
 * POST /api/papers/upload
 *
 * Accepts a multipart form with:
 *   - pdf:   File  (the PDF to upload)
 *   - title: string (optional display name, defaults to filename)
 *
 * Workflow:
 *   1. Write the PDF to a temp file (Vercel /tmp is fine)
 *   2. Upload to Gemini File API — returns a stable URI
 *   3. Persist the URI + metadata in Supabase via Prisma
 *   4. Clean up temp file
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("pdf") as File | null;
  const title = (formData.get("title") as string) || "";

  if (!file || file.size === 0) {
    return NextResponse.json(
      { error: "No PDF file provided" },
      { status: 400 }
    );
  }

  // --- Write to a temp file (Gemini SDK needs a filesystem path) ---
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const tmpPath = join(tmpdir(), `${Date.now()}-${file.name}`);
  await writeFile(tmpPath, buffer);

  try {
    // --- Upload to Gemini File API ---
    const uploadResult = await fileManager.uploadFile(tmpPath, {
      mimeType: "application/pdf",
      displayName: title || file.name,
    });

    const geminiUri = uploadResult.file.uri;
    const geminiFileId = uploadResult.file.name; // resource name for deletion

    // --- Persist in Supabase ---
    const paper = await prisma.paper.create({
      data: {
        title: title || file.name,
        geminiUri,
        geminiFileId,
      },
    });

    // --- Clean up ---
    await unlink(tmpPath);

    return NextResponse.json({
      paperId: paper.id,
      title: paper.title,
      geminiUri,
    });
  } catch (err) {
    // Best-effort cleanup on failure
    await unlink(tmpPath).catch(() => {});

    console.error("[papers/upload] Gemini upload failed:", err);
    return NextResponse.json(
      { error: "Upload to Gemini File API failed", detail: String(err) },
      { status: 502 }
    );
  }
}
