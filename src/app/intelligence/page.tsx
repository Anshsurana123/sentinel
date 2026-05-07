"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import TimetableUploader from "@/components/intelligence/TimetableUploader";
import EventCard from "@/components/intelligence/EventCard";
import PlanGenerator from "@/components/intelligence/PlanGenerator";
import StudyPlanView from "@/components/intelligence/StudyPlanView";
import SignOutButton from "@/components/SignOutButton";

const IntelligenceBanner = dynamic(
  () => import("@/components/intelligence/IntelligenceBanner"),
  { ssr: false }
);

interface AcademicEvent {
  id: string;
  title: string;
  eventType: string;
  subject: string | null;
  date: string;
  daysAway: number;
}

interface StudyPlan {
  id: string;
  event: { title: string };
  uncoveredTopics: string;
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
    }>;
  };
}

export default function IntelligencePage() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [quotaCount, setQuotaCount] = useState(0);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/intelligence/events");
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch (err) {
      console.error("[IntelligencePage] Failed to fetch events:", err);
    }
  }, []);

  const fetchQuota = useCallback(async () => {
    try {
      const res = await fetch("/api/intelligence/quota");
      const data = await res.json();
      if (typeof data.calls === "number") setQuotaCount(data.calls);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchEvents().finally(() => setLoading(false));
    fetchQuota();
  }, [fetchEvents, fetchQuota]);

  const handleUploadComplete = () => {
    fetchEvents();
  };

  const handlePlanThis = (eventId: string) => {
    setSelectedEventId(eventId);
    setActivePlan(null);
  };

  const handlePlanGenerated = (plan: StudyPlan) => {
    setActivePlan(plan);
    setSelectedEventId(null);
    fetchQuota();
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <main className="min-h-screen font-mono text-white bg-black selection:bg-white selection:text-black">
      {/* Header / Shared Nav */}
      <header className="border-b border-gray-800 px-6 md:px-12 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors"
        >
          ← SENTINEL FEED
        </Link>
        <nav className="flex gap-6">
          <Link
            href="/lineage"
            className="text-[10px] font-bold uppercase tracking-[0.2em] pb-1 border-b-2 border-transparent text-gray-600 hover:text-white transition-colors"
          >
            LINEAGE_ENGINE
          </Link>
          <Link
            href="/rosetta"
            className="text-[10px] font-bold uppercase tracking-[0.2em] pb-1 border-b-2 border-transparent text-gray-600 hover:text-white transition-colors"
          >
            ROSETTA_STONE
          </Link>
          <Link
            href="/intelligence"
            className="text-[10px] font-bold uppercase tracking-[0.2em] pb-1 border-b-2 border-[#00ff41] text-[#00ff41]"
          >
            INTELLIGENCE
          </Link>
          <SignOutButton />
        </nav>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {/* Page Title */}
        <header className="border-b-2 border-[#00ff41] pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter">
              SENTINEL_INTELLIGENCE //
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
              Academic Event Planner
            </p>
          </div>
          <span style={{ fontSize: "9px", color: "#333", fontFamily: "monospace" }}>
            TAVILY CALLS THIS SESSION: {quotaCount}
          </span>
        </header>

        {/* Banner */}
        <IntelligenceBanner />

        {/* Upload Timetable */}
        <div className="border border-gray-800 bg-[#0a0a0a] p-4">
          <TimetableUploader onUploadComplete={handleUploadComplete} />
        </div>

        {/* Upcoming Exams */}
        <div>
          <div
            className="text-xs font-bold border-b border-gray-800 pb-1 mb-3 tracking-wider"
            style={{ color: "#00ff41" }}
          >
            UPCOMING_EXAMS //
          </div>

          {loading && (
            <div style={{ color: "#00ff41", fontSize: "12px", padding: "12px" }}>
              LOADING_EVENTS //░░░░░░░░
            </div>
          )}

          {!loading && events.length === 0 && (
            <div style={{ color: "#666", fontSize: "12px", padding: "12px" }}>
              NO_EVENTS // Upload a timetable to get started
            </div>
          )}

          {!loading && events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPlanThis={handlePlanThis}
                />
              ))}
            </div>
          )}
        </div>

        {/* Plan Generator */}
        {selectedEvent && (
          <div className="border border-gray-800 bg-[#0a0a0a] p-4">
            <PlanGenerator
              eventId={selectedEvent.id}
              eventTitle={selectedEvent.title}
              onPlanGenerated={handlePlanGenerated}
            />
          </div>
        )}

        {/* Study Plan View */}
        {activePlan && (
          <div className="border border-gray-800 bg-[#0a0a0a] p-4">
            <StudyPlanView plan={activePlan} />
          </div>
        )}
      </div>
    </main>
  );
}
