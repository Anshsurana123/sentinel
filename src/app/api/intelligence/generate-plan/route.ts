import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInDays, addDays, format } from "date-fns";
import type { GeneratedStudyPlan, StudyPlanDay, TopicSource } from "@/types/intelligence";
import { fetchSourcesForDay } from "@/lib/tavily";
import { requireUser } from "@/lib/auth";

const CHUNK_SIZE = 7;

function extractJSON(text: string): string {
  text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in response");
  }
  return text.slice(firstBrace, lastBrace + 1);
}

/**
 * POST /api/intelligence/generate-plan
 *
 * Given an event ID and uncovered topics, generates a full study plan using Gemini.
 * Plan generation is chunked into 7-day segments to stay within token limits.
 * After Gemini chunks are assembled, Tavily fetches real verified sources per day.
 */
export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    const { eventId, uncoveredTopics } = await req.json();

    if (!eventId || !uncoveredTopics?.trim()) {
      return NextResponse.json(
        { error: "Missing eventId or uncoveredTopics" },
        { status: 400 }
      );
    }

    const event = await prisma.academicEvent.findFirst({
      where: { id: eventId, userId: user!.id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const today = new Date();
    const daysUntilExam = Math.max(1, differenceInDays(event.date, today));

    const papers = await prisma.paper.findMany({
      orderBy: { uploadedAt: "desc" },
      select: { id: true, title: true },
    });

    const paperList = papers.map((p) => `- ID: ${p.id} | Title: ${p.title}`).join("\n");
    const totalChunks = Math.ceil(daysUntilExam / CHUNK_SIZE);

    type ChunkDay = {
      dayIndex: number;
      date: string;
      topics: string[];
      estimatedHours: number;
      relevantPaperIds: string[];
      rosettaEquations: string[];
      sources: TopicSource[];
    };

    const allChunkDays: ChunkDay[] = [];

    for (let chunk = 0; chunk < totalChunks; chunk++) {
      const chunkStart = chunk * CHUNK_SIZE + 1;
      const chunkEnd = Math.min((chunk + 1) * CHUNK_SIZE, daysUntilExam);
      const chunkStartDate = addDays(today, chunkStart - 1);

      const prompt = `You are an expert academic study planner. Generate a day-by-day study plan.

Exam: ${event.title}
Subject: ${event.subject || "General"}
Generate ONLY days ${chunkStart} to ${chunkEnd} (out of ${daysUntilExam} total days).
Start date for day ${chunkStart}: ${format(chunkStartDate, "yyyy-MM-dd")}
Topics the student hasn't covered: ${uncoveredTopics}

Available papers in their library:
${paperList}

Rules:
1. Distribute topics evenly. Final 2 days of the ENTIRE plan (days ${daysUntilExam - 1} and ${daysUntilExam}) = revision only.
2. For each day, suggest which paper IDs are most relevant (match by keywords). If none match, use [].
3. For each topic, suggest 1-3 common physics/math equations as short strings (e.g. "F=ma", "E=mc^2"). If none apply, use [].
4. estimatedHours must be between 1 and 4.
5. Return ONLY valid JSON. No markdown. No backticks. No explanation.

Return this exact structure:
{
  "days": [
    {
      "dayIndex": number,
      "date": "YYYY-MM-DD",
      "topics": ["string"],
      "estimatedHours": number,
      "relevantPaperIds": ["string"],
      "rosettaEquations": ["string"]
    }
  ]
}`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.3,
            },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error(
          `[intelligence/generate-plan] Gemini error chunk ${chunk + 1}/${totalChunks}:`,
          {
            status: geminiRes.status,
            statusText: geminiRes.statusText,
            response: errText,
          }
        );
        return NextResponse.json(
          { error: `Gemini request failed on chunk ${chunk + 1}` },
          { status: 502 }
        );
      }

      const geminiData = await geminiRes.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      let chunkParsed: { days: ChunkDay[] };
      try {
        const cleaned = extractJSON(rawText);
        chunkParsed = JSON.parse(cleaned);
      } catch (parseErr: any) {
        console.error(
          `[intelligence/generate-plan] Parse failed chunk ${chunk + 1}/${totalChunks}:`,
          {
            message: parseErr?.message,
            stack: parseErr?.stack,
            rawTextPreview: rawText.slice(0, 500),
          }
        );
        return NextResponse.json(
          { error: "parse_failed", raw: rawText, chunk: chunk + 1 },
          { status: 422 }
        );
      }

      if (chunkParsed.days && Array.isArray(chunkParsed.days)) {
        allChunkDays.push(...chunkParsed.days);
      }
    }

    // ─── Tavily Source Enrichment ─────────────────────────────────────────────
    // Process days sequentially to protect Tavily free tier quota
    // Each day = up to 3 Tavily calls (video + questionbank + formula run in parallel within the day)

    const enrichedDays: ChunkDay[] = [];

    for (const day of allChunkDays) {
      try {
        const { video, questionbank, formula } = await fetchSourcesForDay(
          day.topics,
          event.subject ?? "general"
        );

        const sources: TopicSource[] = [];

        if (video) {
          sources.push({
            type: "video",
            label: video.label,
            url: video.url,
            description: video.description,
            verified: true,
          });
        }

        if (questionbank) {
          sources.push({
            type: "questionbank",
            label: questionbank.label,
            url: questionbank.url,
            description: questionbank.description,
            verified: true,
          });
        }

        if (formula) {
          sources.push({
            type: "formula",
            label: formula.label,
            url: formula.url,
            description: formula.description,
            verified: true,
          });
        }

        enrichedDays.push({ ...day, sources });
      } catch {
        // Tavily failed for this day — push day with empty sources, never fail the plan
        enrichedDays.push({ ...day, sources: [] });
      }
    }

    const finalDays = enrichedDays;

    // ─── Final enrichment: papers, rosetta, citations ─────────────────────────
    const studyPlanDays: StudyPlanDay[] = [];

    for (const day of finalDays) {
      const relevantPapers = day.relevantPaperIds
        .map((pid) => {
          const paper = papers.find((p) => p.id === pid);
          if (!paper) return null;
          return {
            paperId: paper.id,
            title: paper.title,
            relevanceReason: "Keyword match on topic",
          };
        })
        .filter(Boolean) as StudyPlanDay["relevantPapers"];

      const rosettaLinks = day.rosettaEquations.map((eq) => ({
        label: eq,
        url: `/rosetta?eq=${encodeURIComponent(eq)}&autoparse=true`,
      }));

      let citationSnippets: StudyPlanDay["citationSnippets"] = [];
      if (day.relevantPaperIds.length > 0) {
        try {
          const claims = await prisma.claim.findMany({
            where: {
              paperId: { in: day.relevantPaperIds.slice(0, 2) },
              verdict: "SUPPORTS",
            },
            take: 2,
            select: {
              exactSentence: true,
              paperId: true,
              pageNumber: true,
            },
          });

          citationSnippets = claims
            .filter((c) => c.exactSentence)
            .map((c) => ({
              text: c.exactSentence!,
              paperId: c.paperId,
              pageNumber: c.pageNumber ?? 1,
            }));
        } catch (citeErr) {
          console.error(
            `[intelligence/generate-plan] Citation fetch failed for day ${day.dayIndex}:`
          );
        }
      }

      studyPlanDays.push({
        dayIndex: day.dayIndex,
        date: day.date,
        topics: day.topics,
        estimatedHours: day.estimatedHours,
        relevantPapers,
        rosettaLinks,
        citationSnippets,
        sources: day.sources,
      });
    }

    const generatedPlan: GeneratedStudyPlan = {
      totalDays: daysUntilExam,
      examTitle: event.title,
      subject: event.subject ?? "",
      days: studyPlanDays,
    };

    const plan = await prisma.studyPlan.create({
      data: {
        eventId: event.id,
        uncoveredTopics,
        generatedPlan: generatedPlan as any,
      },
      include: {
        event: true,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    console.error("[intelligence/generate-plan] error:", err);
    return NextResponse.json(
      { error: "Plan generation failed" },
      { status: 500 }
    );
  }
}
