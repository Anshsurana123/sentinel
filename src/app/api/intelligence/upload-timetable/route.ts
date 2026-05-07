import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInDays, parseISO } from "date-fns";
import { requireUser } from "@/lib/auth";

/**
 * POST /api/intelligence/upload-timetable
 *
 * Accepts a PDF or image of an academic timetable, sends to Gemini,
 * extracts structured events, and saves them to the database.
 */
export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "application/octet-stream";

    const prompt = `You are an academic timetable parser. Extract ALL important dates from this timetable.
Return ONLY a valid JSON array with no markdown, no explanation, no backticks.
Each item must have these exact fields:
{
  "title": "string — exam/test/deadline name",
  "eventType": "exam" | "mock" | "test" | "deadline" | "other",
  "subject": "string — subject name or null",
  "date": "ISO 8601 date string — YYYY-MM-DD"
}
If you cannot determine a field, use null. Return [] if no dates found.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[intelligence/upload-timetable] Gemini error:", errText);
      return NextResponse.json(
        { success: false, error: "gemini_request_failed", raw: errText },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip accidental markdown fences
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let events: Array<{
      title: string;
      eventType: string;
      subject: string | null;
      date: string;
    }> = [];

    try {
      events = JSON.parse(cleaned);
      if (!Array.isArray(events)) throw new Error("Not an array");
    } catch (parseErr) {
      console.error("[intelligence/upload-timetable] Parse failed:", parseErr);
      return NextResponse.json(
        { success: false, error: "parse_failed", raw: rawText },
        { status: 422 }
      );
    }

    const today = new Date();
    const createdEvents = [];

    for (const ev of events) {
      if (!ev.title || !ev.date) continue;

      const eventDate = parseISO(ev.date);
      const daysAway = differenceInDays(eventDate, today);

      const existing = await prisma.academicEvent.findFirst({
        where: {
          userId: user!.id,
          title: ev.title,
          date: eventDate,
        },
      });

      if (existing) continue;

      const created = await prisma.academicEvent.create({
        data: {
          title: ev.title,
          eventType: ev.eventType || "other",
          subject: ev.subject ?? null,
          date: eventDate,
          daysAway,
          source: file.name,
          userId: user!.id,
        },
      });

      createdEvents.push(created);
    }

    return NextResponse.json({
      success: true,
      events: createdEvents,
      count: createdEvents.length,
    });
  } catch (err) {
    console.error("[intelligence/upload-timetable] error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
