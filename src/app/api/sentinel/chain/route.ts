import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sentinel/chain?claimId=xxx
 *
 * Returns the full citation chain starting from the given claim.
 * Recursively fetches parent claims up to the root, then children down to leaves.
 * Returns ordered from root to leaf.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const claimId = searchParams.get("claimId");

  if (!claimId) {
    return NextResponse.json({ error: "claimId is required" }, { status: 400 });
  }

  try {
    // Fetch the starting claim with its paper
    const startClaim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { paper: true },
    });

    if (!startClaim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Build chain: walk up to root first
    const chain: typeof startClaim[] = [];

    // Walk up to root
    let current: typeof startClaim | null = startClaim;
    const visitedUp = new Set<string>();
    while (current && !visitedUp.has(current.id)) {
      visitedUp.add(current.id);
      current = await prisma.claim.findUnique({
        where: { id: current.parentId ?? undefined },
        include: { paper: true },
      });
    }

    // Now walk from root down to the start claim
    const rootIds = Array.from(visitedUp).reverse();
    for (const id of rootIds) {
      const claim = await prisma.claim.findUnique({
        where: { id },
        include: { paper: true },
      });
      if (claim) chain.push(claim);
    }

    // Walk down from start claim to leaves (breadth-first, single path for simplicity)
    const visitedDown = new Set<string>([startClaim.id]);
    let leaf: typeof startClaim | null = startClaim;
    while (leaf) {
      const child: typeof startClaim | null = await prisma.claim.findFirst({
        where: { parentId: leaf.id },
        include: { paper: true },
      });
      if (child && !visitedDown.has(child.id)) {
        visitedDown.add(child.id);
        chain.push(child);
        leaf = child;
      } else {
        leaf = null;
      }
    }

    return NextResponse.json({ chain });
  } catch (err) {
    console.error("[sentinel/chain] Error:", err);
    return NextResponse.json({ error: "Failed to fetch chain" }, { status: 500 });
  }
}
