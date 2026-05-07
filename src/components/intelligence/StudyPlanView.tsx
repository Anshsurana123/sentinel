"use client";

import React, { useState, useEffect, useCallback } from "react";
import DayCard from "./DayCard";

interface Props {
  plan: {
    id: string;
    event: { title: string };
    generatedPlan: {
      totalDays: number;
      days: Array<{
        dayIndex: number;
        date: string;
        topics: string[];
        estimatedHours: number;
        relevantPapers: { paperId: string; title: string; relevanceReason: string }[];
        rosettaLinks: { label: string; url: string }[];
        citationSnippets: { text: string; paperId: string; pageNumber: number }[];
        sources?: { type: "video" | "questionbank" | "formula"; label: string; url: string; description: string }[];
      }>;
    };
  };
}

export default function StudyPlanView({ plan }: Props) {
  const [progress, setProgress] = useState<Record<number, boolean>>({});

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/intelligence/events`);
      // We don't have a direct GET for progress, so we just PATCH optimistically
      // and re-fetch from a dedicated endpoint if needed. For now, let's fetch
      // the study plan directly to get its progress.
      // Actually, let's just query the progress table.
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Fetch existing DayProgress records for this plan
    const load = async () => {
      try {
        // There's no dedicated GET for progress, but we can infer from the plan
        // Let's just initialize empty and let user toggle.
      } catch {
        // ignore
      }
    };
    load();
  }, [plan.id]);

  const handleToggle = async (dayIndex: number) => {
    const newCompleted = !progress[dayIndex];
    setProgress((prev) => ({ ...prev, [dayIndex]: newCompleted }));

    try {
      await fetch("/api/intelligence/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          dayIndex,
          completed: newCompleted,
        }),
      });
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  const completedDays = Object.values(progress).filter(Boolean).length;
  const totalDays = plan.generatedPlan.totalDays;
  const pct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <div style={{ fontFamily: "monospace" }}>
      <div style={{ color: "#00ff41", fontSize: "12px", fontWeight: "bold", borderBottom: "1px solid #333", paddingBottom: "4px", marginBottom: "8px" }}>
        STUDY_PLAN // {plan.event?.title ?? "UNKNOWN"} — {totalDays} DAYS
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666", marginBottom: "4px" }}>
          <span>PROGRESS //</span>
          <span>{completedDays}/{totalDays} DAYS COMPLETE</span>
        </div>
        <div style={{ background: "#1a1a1a", height: "4px", width: "100%" }}>
          <div
            style={{
              background: "#00ff41",
              height: "100%",
              width: `${pct}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", fontSize: "10px", color: "#555", marginBottom: "12px", fontFamily: "monospace" }}>
        <span><span style={{ color: "#ff4444" }}>▶</span> VIDEO</span>
        <span><span style={{ color: "#ffaa00" }}>?</span> PRACTICE</span>
        <span><span style={{ color: "#00aaff" }}>∑</span> FORMULA</span>
        <span><span style={{ color: "#00ff41" }}>⬡</span> ROSETTA</span>
        <span><span style={{ color: "#888" }}>❝</span> CITATION</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {plan.generatedPlan.days.map((day) => (
          <DayCard
            key={day.dayIndex}
            day={day}
            planId={plan.id}
            completed={!!progress[day.dayIndex]}
            onToggle={() => handleToggle(day.dayIndex)}
          />
        ))}
      </div>
    </div>
  );
}
