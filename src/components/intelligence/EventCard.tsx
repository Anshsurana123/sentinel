"use client";

import React from "react";

interface Props {
  event: {
    id: string;
    title: string;
    eventType: string;
    subject: string | null;
    date: string;
    daysAway: number;
  };
  onPlanThis: (eventId: string) => void;
}

export default function EventCard({ event, onPlanThis }: Props) {
  const borderColor =
    event.daysAway <= 7 ? "#ef4444" : event.daysAway <= 14 ? "#ff9500" : "#00ff41";

  const formattedDate = new Date(event.date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      style={{
        border: `1px solid ${borderColor}`,
        background: "#0a0a0a",
        padding: "12px",
        fontFamily: "monospace",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "3px",
          height: "100%",
          background: borderColor,
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "#fff", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>
            {event.subject || "Unknown Subject"}
          </div>
          <div style={{ color: "#999", fontSize: "11px", marginBottom: "6px" }}>
            {event.title}
          </div>
        </div>
        <span
          style={{
            border: `1px solid ${borderColor}`,
            color: borderColor,
            fontSize: "9px",
            padding: "2px 6px",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          {event.eventType}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
        <div style={{ color: "#666", fontSize: "10px" }}>{formattedDate}</div>
        <div style={{ color: borderColor, fontSize: "11px", fontWeight: "bold" }}>
          T-{event.daysAway} DAYS
        </div>
      </div>

      <button
        onClick={() => onPlanThis(event.id)}
        style={{
          marginTop: "8px",
          width: "100%",
          background: "#000",
          border: "1px solid #00ff41",
          color: "#00ff41",
          padding: "4px 8px",
          fontFamily: "monospace",
          fontSize: "10px",
          cursor: "pointer",
          textTransform: "uppercase",
        }}
      >
        PLAN_THIS →
      </button>
    </div>
  );
}
