import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/papers
 *
 * Returns all uploaded papers (id, title, uploadedAt, hasUri).
 * Used by the Lineage Engine UI to populate the paper selector.
 */
export async function GET() {
  const papers = await prisma.paper.findMany({
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      title: true,
      geminiUri: true,
      uploadedAt: true,
    },
  });

  return NextResponse.json(
    papers.map((p) => ({
      id: p.id,
      title: p.title,
      ready: !!p.geminiUri,
      uploadedAt: p.uploadedAt,
    }))
  );
}
