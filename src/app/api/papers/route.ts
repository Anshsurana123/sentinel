import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/papers
 *
 * Returns all uploaded papers with their Supabase public URLs.
 */
export async function GET() {
  const papers = await prisma.paper.findMany({
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      title: true,
      geminiUri: true,
      supabaseUrl: true,
      uploadedAt: true,
    },
  });

  return NextResponse.json(
    papers.map((p) => ({
      id: p.id,
      title: p.title,
      ready: !!p.geminiUri,
      supabaseUrl: p.supabaseUrl,
      uploadedAt: p.uploadedAt,
    }))
  );
}
