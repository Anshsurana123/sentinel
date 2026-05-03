import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export async function POST(req: NextRequest) {
  try {
    const { title, uniqueTitle } = await req.json();

    if (!title || !uniqueTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Since the browser hits a CORS error due to a Gemini bug, we verify the upload here
    const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY!);
    const files = await fileManager.listFiles();
    
    const uploadedFile = files.files?.find((f) => f.displayName === uniqueTitle);
    if (!uploadedFile) {
      return NextResponse.json({ error: "File upload verification failed" }, { status: 404 });
    }

    const paper = await prisma.paper.create({
      data: {
        title,
        geminiUri: uploadedFile.uri,
        geminiFileId: uploadedFile.name,
      },
    });

    return NextResponse.json({
      paperId: paper.id,
      title: paper.title,
      geminiUri: uploadedFile.uri,
    });
  } catch (err) {
    console.error("[upload/finish]", err);
    return NextResponse.json({ error: "Failed to save paper metadata" }, { status: 500 });
  }
}
