"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Props {
  day: {
    dayIndex: number;
    date: string;
    topics: string[];
    estimatedHours: number;
    relevantPapers: { paperId: string; title: string; relevanceReason: string }[];
    rosettaLinks: { label: string; url: string }[];
    citationSnippets: { text: string; paperId: string; pageNumber: number }[];
    sources?: { type: "video" | "questionbank" | "formula"; label: string; url: string; description: string; verified?: boolean }[];
  };
  planId: string;
  completed: boolean;
  onToggle: () => void;
}

export default function DayCard({ day, completed, onToggle }: Props) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(day.date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div
      style={{
        border: "1px solid #1a1a1a",
        background: completed ? "#0a0a0a" : "#000",
        fontFamily: "monospace",
        opacity: completed ? 0.5 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          padding: "8px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          borderLeft: `3px solid ${completed ? "#333" : "#00ff41"}`,
        }}
      >
        <div>
          <span
            style={{
              color: completed ? "#555" : "#fff",
              fontSize: "12px",
              fontWeight: "bold",
              textDecoration: completed ? "line-through" : "none",
            }}
          >
            DAY {day.dayIndex}
          </span>
          <span style={{ color: "#666", fontSize: "10px", marginLeft: "8px" }}>
            {formattedDate} — {day.estimatedHours}H
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          style={{
            background: "transparent",
            border: `1px solid ${completed ? "#333" : "#00ff41"}`,
            color: completed ? "#333" : "#00ff41",
            padding: "2px 8px",
            fontFamily: "monospace",
            fontSize: "9px",
            cursor: "pointer",
          }}
        >
          {completed ? "✗ MARK INCOMPLETE" : "✓ MARK COMPLETE"}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: "8px 12px", borderTop: "1px solid #1a1a1a" }}>
          <div style={{ marginBottom: "8px" }}>
            <div style={{ color: "#666", fontSize: "9px", marginBottom: "4px" }}>TOPICS //</div>
            {day.topics.map((t) => (
              <span
                key={t}
                style={{
                  display: "inline-block",
                  background: "#0a0a0a",
                  border: "1px solid #333",
                  color: "#ccc",
                  padding: "2px 6px",
                  fontSize: "10px",
                  marginRight: "4px",
                  marginBottom: "4px",
                }}
              >
                {t}
              </span>
            ))}
          </div>

          {day.relevantPapers.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ color: "#666", fontSize: "9px", marginBottom: "4px" }}>PAPERS //</div>
              {day.relevantPapers.map((p) => (
                <div key={p.paperId} style={{ fontSize: "10px", color: "#00ff41", marginBottom: "2px" }}>
                  → {p.title}
                </div>
              ))}
            </div>
          )}

          {day.rosettaLinks.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ color: "#666", fontSize: "9px", marginBottom: "4px" }}>EQUATIONS //</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {day.rosettaLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    style={{
                      display: "inline-block",
                      background: "#000",
                      border: "1px solid #00ff41",
                      color: "#00ff41",
                      padding: "2px 8px",
                      fontSize: "10px",
                      textDecoration: "none",
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* SOURCES */}
          {(day.sources ?? []).length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <div style={{
                fontSize: "10px",
                color: "#555",
                letterSpacing: "2px",
                marginBottom: "8px",
                textTransform: "uppercase"
              }}>
                ── SOURCES ──
              </div>

              {/* Videos */}
              {(day.sources ?? []).filter(s => s.type === "video").map((src, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  marginBottom: "6px",
                  padding: "6px 8px",
                  border: "1px solid #1a1a1a",
                  background: "#0d0d0d"
                }}>
                  <span style={{ color: "#ff4444", fontSize: "10px", minWidth: "20px", marginTop: "1px" }}>▶</span>
                  <div>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#ff4444", fontSize: "11px", fontFamily: "monospace", textDecoration: "none" }}
                    >
                      {src.label}
                      {src.verified && (
                        <span style={{
                          fontSize: "8px",
                          color: "#00ff41",
                          border: "1px solid #00ff41",
                          padding: "1px 4px",
                          marginLeft: "6px",
                          letterSpacing: "1px",
                          verticalAlign: "middle"
                        }}>
                          LIVE
                        </span>
                      )}
                    </a>
                    <div style={{ color: "#555", fontSize: "10px", marginTop: "2px" }}>{src.description}</div>
                  </div>
                </div>
              ))}

              {/* Question Banks */}
              {(day.sources ?? []).filter(s => s.type === "questionbank").map((src, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  marginBottom: "6px",
                  padding: "6px 8px",
                  border: "1px solid #1a1a1a",
                  background: "#0d0d0d"
                }}>
                  <span style={{ color: "#ffaa00", fontSize: "10px", minWidth: "20px", marginTop: "1px" }}>?</span>
                  <div>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#ffaa00", fontSize: "11px", fontFamily: "monospace", textDecoration: "none" }}
                    >
                      {src.label}
                      {src.verified && (
                        <span style={{
                          fontSize: "8px",
                          color: "#00ff41",
                          border: "1px solid #00ff41",
                          padding: "1px 4px",
                          marginLeft: "6px",
                          letterSpacing: "1px",
                          verticalAlign: "middle"
                        }}>
                          LIVE
                        </span>
                      )}
                    </a>
                    <div style={{ color: "#555", fontSize: "10px", marginTop: "2px" }}>{src.description}</div>
                  </div>
                </div>
              ))}

              {/* Formula Sheets */}
              {(day.sources ?? []).filter(s => s.type === "formula").map((src, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  marginBottom: "6px",
                  padding: "6px 8px",
                  border: "1px solid #1a1a1a",
                  background: "#0d0d0d"
                }}>
                  <span style={{ color: "#00aaff", fontSize: "10px", minWidth: "20px", marginTop: "1px" }}>∑</span>
                  <div>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#00aaff", fontSize: "11px", fontFamily: "monospace", textDecoration: "none" }}
                    >
                      {src.label}
                      {src.verified && (
                        <span style={{
                          fontSize: "8px",
                          color: "#00ff41",
                          border: "1px solid #00ff41",
                          padding: "1px 4px",
                          marginLeft: "6px",
                          letterSpacing: "1px",
                          verticalAlign: "middle"
                        }}>
                          LIVE
                        </span>
                      )}
                    </a>
                    <div style={{ color: "#555", fontSize: "10px", marginTop: "2px" }}>{src.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {day.citationSnippets.length > 0 && (
            <div>
              <div style={{ color: "#666", fontSize: "9px", marginBottom: "4px" }}>CITATIONS //</div>
              {day.citationSnippets.map((c, i) => (
                <blockquote
                  key={i}
                  style={{
                    borderLeft: "2px solid #00ff41",
                    paddingLeft: "8px",
                    margin: "0 0 4px 0",
                    color: "#aaa",
                    fontSize: "10px",
                    fontStyle: "italic",
                  }}
                >
                  &quot;{c.text}&quot;
                  <span style={{ color: "#666", marginLeft: "8px" }}>
                    (p.{c.pageNumber})
                  </span>
                </blockquote>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
