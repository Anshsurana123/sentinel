import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

const fileManagerPromise = import("@google/generative-ai/server").then(
  ({ GoogleAIFileManager }) => new GoogleAIFileManager(process.env.GOOGLE_API_KEY!)
);

/**
 * POST /api/papers/upload
 *
 * Unified upload endpoint: receives the PDF file directly, uploads to
 * Supabase Storage (for react-pdf viewing) AND Gemini File API (for AI
 * querying), then creates the Paper record in Prisma.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;
    const title = formData.get("title") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const displayName = title || file.name.replace(/\.pdf$/i, "");
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Upload to Supabase Storage for permanent PDF viewing
    const { error: storageError } = await supabase.storage
      .from("papers")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (storageError) {
      console.error("[upload] Supabase storage error:", storageError);
      return NextResponse.json(
        { error: "Storage upload failed" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("papers")
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // 2. Upload to Gemini File API for AI querying
    const fileManager = await fileManagerPromise;
    const uploadResult = await fileManager.uploadFile(buffer, {
      mimeType: "application/pdf",
      displayName,
    });

    // 3. Save to database
    const paper = await prisma.paper.create({
      data: {
        title: displayName,
        geminiUri: uploadResult.file.uri,
        geminiFileId: uploadResult.file.name,
        supabaseUrl: publicUrl,
      },
    });

    return NextResponse.json({
      paperId: paper.id,
      title: paper.title,
      publicUrl,
    });
  } catch (err) {
    console.error("[upload] Error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
