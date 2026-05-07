import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

/**
 * PATCH /api/intelligence/progress
 *
 * Mark a day as complete or incomplete.
 */
export async function PATCH(req: NextRequest) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    const { planId, dayIndex, completed } = await req.json();

    if (!planId || typeof dayIndex !== "number") {
      return NextResponse.json({ error: "Missing planId or dayIndex" }, { status: 400 });
    }

    const plan = await prisma.studyPlan.findFirst({
      where: {
        id: planId,
        event: { userId: user!.id },
      },
      select: { id: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const progress = await prisma.dayProgress.upsert({
      where: {
        planId_dayIndex: {
          planId,
          dayIndex,
        },
      },
      update: {
        completed: !!completed,
        completedAt: completed ? new Date() : null,
      },
      create: {
        planId,
        dayIndex,
        completed: !!completed,
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, progress });
  } catch (err) {
    console.error("[intelligence/progress] error:", err);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
