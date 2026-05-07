"use client";

import React, { useState, useEffect, useRef } from "react";

interface Props {
  eventId: string;
  eventTitle: string;
  onPlanGenerated: (plan: any) => void;
}

const MESSAGES = [
  "PARSING TOPICS...",
  "QUERYING PAPER LIBRARY...",
  "BUILDING DAY PLAN WITH GEMINI...",
  "SEARCHING YOUTUBE FOR LECTURES...",
  "FINDING PRACTICE PROBLEMS...",
  "FETCHING FORMULA SHEETS...",
  "ASSEMBLING FINAL PLAN...",
];

export default function PlanGenerator({ eventId, eventTitle, onPlanGenerated }: Props) {
  const [topics, setTopics] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (loading) {
      intervalRef.current = setInterval(() => {
        setMessageIndex((i) => (i + 1) % MESSAGES.length);
      }, 600);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setMessageIndex(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading]);

  const handleGenerate = async () => {
    if (!topics.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/intelligence/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, uncoveredTopics: topics.trim() }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Plan generation failed");
        return;
      }

      onPlanGenerated(data.plan);
      setTopics("");
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "monospace", border: "1px solid #333", padding: "12px", background: "#0a0a0a" }}>
      <div style={{ color: "#00ff41", fontSize: "12px", fontWeight: "bold", borderBottom: "1px solid #333", paddingBottom: "4px", marginBottom: "8px" }}>
        GENERATE_PLAN // {eventTitle}
      </div>

      <div style={{ color: "#666", fontSize: "11px", marginBottom: "8px" }}>
        What topics haven't you covered yet?
      </div>

      <textarea
        value={topics}
        onChange={(e) => setTopics(e.target.value)}
        placeholder="e.g. Thermodynamics, Quantum entanglement, Wave optics..."
        rows={3}
        disabled={loading}
        style={{
          width: "100%",
          background: "#000",
          border: "1px solid #333",
          color: "#fff",
          padding: "8px",
          fontFamily: "monospace",
          fontSize: "12px",
          outline: "none",
          resize: "vertical",
          marginBottom: "8px",
        }}
      />

      <button
        onClick={handleGenerate}
        disabled={loading || !topics.trim()}
        style={{
          width: "100%",
          background: loading ? "#0a0a0a" : "#000",
          border: "1px solid #00ff41",
          color: loading ? "#555" : "#00ff41",
          padding: "8px",
          fontFamily: "monospace",
          fontSize: "11px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {loading ? (
          <span className="animate-pulse">{MESSAGES[messageIndex]}</span>
        ) : (
          "GENERATE PLAN >>"
        )}
      </button>

      {error && (
        <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "8px" }}>
          ✗ {error}
        </div>
      )}
    </div>
  );
}
