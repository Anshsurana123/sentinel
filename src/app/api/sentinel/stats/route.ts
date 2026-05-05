import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sentinel/stats
 *
 * Returns aggregate verdict counts, recent claims, and top papers by claim count.
 */
export async function GET() {
  try {
    const [total, supports, refutes, unrelated, recentClaims, topPapers] =
      await Promise.all([
        prisma.claim.count(),
        prisma.claim.count({ where: { verdict: "SUPPORTS" } }),
        prisma.claim.count({ where: { verdict: "REFUTES" } }),
        prisma.claim.count({ where: { verdict: "UNRELATED" } }),
        prisma.claim.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { paper: true },
        }),
        prisma.paper.findMany({
          take: 5,
          include: {
            _count: { select: { claims: true } },
          },
          orderBy: { claims: { _count: "desc" } },
        }),
      ]);

    return NextResponse.json({
      total,
      supports,
      refutes,
      unrelated,
      recentClaims: recentClaims.map((c) => ({
        text: c.text,
        verdict: c.verdict,
        paperTitle: c.paper.title,
        createdAt: c.createdAt.toISOString(),
      })),
      topPapers: topPapers.map((p) => ({
        title: p.title,
        claimCount: p._count.claims,
      })),
    });
  } catch (err) {
    console.error("[sentinel/stats] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
