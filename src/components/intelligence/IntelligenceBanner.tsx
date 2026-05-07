"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function IntelligenceBanner() {
  const [urgentCount, setUrgentCount] = useState(0);

  useEffect(() => {
    fetch("/api/intelligence/events")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.urgentCount === "number") {
          setUrgentCount(data.urgentCount);
        }
      })
      .catch(() => {
        // Silently fail — never crash the feed
      });
  }, []);

  if (urgentCount === 0) return null;

  return (
    <div
      style={{
        background: "#000",
        borderLeft: "4px solid #00ff41",
        padding: "12px 16px",
        marginBottom: "16px",
        fontFamily: "monospace",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <span style={{ color: "#00ff41", fontSize: "14px" }}>⚠</span>
      <span style={{ color: "#00ff41", fontSize: "12px", fontWeight: "bold" }}>
        {urgentCount} EXAM{urgentCount > 1 ? "S" : ""} IN THE NEXT 30 DAYS
      </span>
      <Link
        href="/intelligence"
        style={{
          marginLeft: "auto",
          color: "#00ff41",
          fontSize: "11px",
          textDecoration: "none",
          border: "1px solid #00ff41",
          padding: "2px 8px",
        }}
      >
        VIEW_INTELLIGENCE →
      </Link>
    </div>
  );
}
