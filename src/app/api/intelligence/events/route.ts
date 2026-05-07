import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInDays, parseISO } from "date-fns";
import { requireUser } from "@/lib/auth";

/**
 * GET /api/intelligence/events
 *
 * Returns all academic events sorted by date, with daysAway recomputed live.
 */
export async function GET() {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    const events = await prisma.academicEvent.findMany({
      where: { userId: user!.id },
      orderBy: { date: "asc" },
    });

    const today = new Date();
    const enriched = events.map((e) => {
      const daysAway = differenceInDays(e.date, today);
      return { ...e, daysAway };
    });

    const urgentCount = enriched.filter((e) => e.daysAway <= 30 && e.daysAway >= 0).length;

    return NextResponse.json({ events: enriched, urgentCount });
  } catch (err) {
    console.error("[intelligence/events] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

/**
 * POST /api/intelligence/events
 *
 * Manually create a single academic event.
 */
export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { title, eventType, subject, date, source } = body;

    if (!title || !eventType || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const event = await prisma.academicEvent.create({
      data: {
        title,
        eventType,
        subject: subject ?? null,
        date: parseISO(date),
        source: source ?? null,
        userId: user!.id,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (err) {
    console.error("[intelligence/events] POST error:", err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
