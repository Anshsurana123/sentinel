"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { ExtractionResult } from "./types";

interface Props {
  results: ExtractionResult[];
}

/* ─── Color constants by verdict ─── */
const VERDICT_COLORS = {
  SUPPORTS: { stroke: "#22c55e", fill: "#22c55e", bg: "rgba(34,197,94,0.08)", text: "#86efac", label: "SUPPORTS" },
  REFUTES:  { stroke: "#ef4444", fill: "#ef4444", bg: "rgba(239,68,68,0.08)", text: "#fca5a5", label: "REFUTES"  },
  UNRELATED:{ stroke: "#6b7280", fill: "#6b7280", bg: "rgba(107,114,128,0.08)", text: "#9ca3af", label: "UNRELATED"},
} as const;

/* ─── Node positioning ─── */
const CLAIM_X = 160;
const PAPER_X = 620;
const START_Y = 100;
const GAP_Y = 200;

/**
 * LineageGraph — Renders extraction results as an SVG node graph.
 *
 * Layout:
 *   [Claim Node] ── verdict edge ──→ [Paper Node]
 *                                         │
 *                                    page / sentence
 */
export default function LineageGraph({ results }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute required SVG height
  const requiredH = results.length > 0
    ? START_Y + results.length * GAP_Y + 60
    : dims.h;
  const svgH = Math.max(dims.h, requiredH);

  /* Animated dot along the edge path */
  const AnimatedEdge = useCallback(
    ({
      x1, y1, x2, y2, color, index,
    }: { x1: number; y1: number; x2: number; y2: number; color: string; index: number }) => {
      const midX = (x1 + x2) / 2;
      const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
      return (
        <g>
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="6 4"
            opacity={0.4}
          />
          {/* Animated traveling dot */}
          <circle r={3} fill={color}>
            <animateMotion
              dur={`${2 + index * 0.3}s`}
              repeatCount="indefinite"
              path={path}
            />
          </circle>
        </g>
      );
    },
    []
  );

  if (results.length === 0) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full flex flex-col items-center justify-center gap-6 select-none"
      >
        {/* Empty state — animated grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }} />

        {/* Pulsing radar icon */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border border-gray-800 rounded-full" />
          <div className="absolute inset-2 border border-gray-800 rounded-full" />
          <div className="absolute inset-4 border border-gray-800 rounded-full" />
          <div className="absolute inset-0 border-2 border-purple-500/30 rounded-full animate-ping" />
          <div className="absolute inset-[38%] bg-purple-500/60 rounded-full" />
        </div>

        <div className="text-center z-10 space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-500">
            Lineage Graph Idle
          </p>
          <p className="text-[9px] text-gray-700 tracking-widest max-w-[280px]">
            Upload a source document and submit a claim to trace its academic lineage
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />

      <svg
        width={Math.max(dims.w, 800)}
        height={svgH}
        className="relative z-10"
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {results.map((r, i) => {
          const y = START_Y + i * GAP_Y;
          const vc = VERDICT_COLORS[r.verdict] || VERDICT_COLORS.UNRELATED;

          // Dynamic X positions based on container width
          const claimX = Math.min(CLAIM_X, dims.w * 0.2);
          const paperX = Math.max(PAPER_X, dims.w * 0.7);

          const claimNodeW = 240;
          const paperNodeW = 280;
          const claimNodeH = 70;
          const paperNodeH = r.found ? 140 : 70;

          return (
            <g
              key={r._key}
              className="animate-fadeIn"
              style={{ animation: `fadeSlideIn 0.6s ease-out ${i * 0.15}s both` }}
            >
              {/* ─── Edge (Claim → Paper) ─── */}
              <AnimatedEdge
                x1={claimX + claimNodeW / 2 + claimNodeW / 2}
                y1={y + claimNodeH / 2}
                x2={paperX - paperNodeW / 2}
                y2={y + claimNodeH / 2}
                color={vc.stroke}
                index={i}
              />

              {/* ─── Verdict badge on the edge ─── */}
              <g transform={`translate(${(claimX + claimNodeW / 2 + paperX - paperNodeW / 2) / 2 + claimNodeW / 4}, ${y + claimNodeH / 2 - 12})`}>
                <rect
                  x={-36}
                  y={-10}
                  width={72}
                  height={20}
                  rx={3}
                  fill="#0a0a0a"
                  stroke={vc.stroke}
                  strokeWidth={1}
                />
                <text
                  textAnchor="middle"
                  y={4}
                  className="text-[8px] font-bold uppercase"
                  fill={vc.text}
                  style={{ fontSize: "8px", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em" }}
                >
                  {vc.label}
                </text>
              </g>

              {/* ─── Claim Node ─── */}
              <g transform={`translate(${claimX}, ${y})`}>
                <rect
                  x={-claimNodeW / 2}
                  y={-claimNodeH / 2}
                  width={claimNodeW}
                  height={claimNodeH}
                  rx={4}
                  fill="#0a0a0a"
                  stroke="#a855f7"
                  strokeWidth={1.5}
                />
                {/* Header bar */}
                <rect
                  x={-claimNodeW / 2}
                  y={-claimNodeH / 2}
                  width={claimNodeW}
                  height={18}
                  rx={4}
                  fill="rgba(168,85,247,0.15)"
                />
                <text
                  x={-claimNodeW / 2 + 10}
                  y={-claimNodeH / 2 + 13}
                  fill="#c084fc"
                  style={{ fontSize: "7px", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.15em" }}
                >
                  CLAIM
                </text>
                {/* Claim text (truncated) */}
                <foreignObject
                  x={-claimNodeW / 2 + 8}
                  y={-claimNodeH / 2 + 24}
                  width={claimNodeW - 16}
                  height={claimNodeH - 32}
                >
                  <p
                    style={{
                      fontSize: "10px",
                      fontFamily: "monospace",
                      color: "#e5e7eb",
                      lineHeight: "1.4",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as const,
                      margin: 0,
                    }}
                  >
                    {`"${r.claim}"`}
                  </p>
                </foreignObject>
              </g>

              {/* ─── Paper / Result Node ─── */}
              <g transform={`translate(${paperX}, ${y})`}>
                <rect
                  x={-paperNodeW / 2}
                  y={-claimNodeH / 2}
                  width={paperNodeW}
                  height={paperNodeH}
                  rx={4}
                  fill="#0a0a0a"
                  stroke={vc.stroke}
                  strokeWidth={1.5}
                  filter="url(#glow)"
                />
                {/* Header bar */}
                <rect
                  x={-paperNodeW / 2}
                  y={-claimNodeH / 2}
                  width={paperNodeW}
                  height={18}
                  rx={4}
                  fill={vc.bg}
                />
                <text
                  x={-paperNodeW / 2 + 10}
                  y={-claimNodeH / 2 + 13}
                  fill={vc.text}
                  style={{ fontSize: "7px", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.15em" }}
                >
                  SOURCE
                </text>
                {/* Paper title */}
                <text
                  x={-paperNodeW / 2 + 10}
                  y={-claimNodeH / 2 + 36}
                  fill="#e5e7eb"
                  style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 700 }}
                >
                  {r.paperTitle.length > 30
                    ? r.paperTitle.slice(0, 30) + "…"
                    : r.paperTitle}
                </text>

                {r.found && r.page_number != null && (
                  <text
                    x={-paperNodeW / 2 + 10}
                    y={-claimNodeH / 2 + 52}
                    fill="#6b7280"
                    style={{ fontSize: "8px", fontFamily: "monospace", letterSpacing: "0.1em" }}
                  >
                    {`PAGE ${r.page_number}`}
                  </text>
                )}

                {/* Exact sentence */}
                {r.found && r.exact_sentence && (
                  <foreignObject
                    x={-paperNodeW / 2 + 8}
                    y={-claimNodeH / 2 + 60}
                    width={paperNodeW - 16}
                    height={paperNodeH - 68}
                  >
                    <p
                      style={{
                        fontSize: "9px",
                        fontFamily: "monospace",
                        color: vc.text,
                        lineHeight: "1.5",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical" as const,
                        borderLeft: `2px solid ${vc.stroke}`,
                        paddingLeft: "8px",
                        margin: 0,
                      }}
                    >
                      {`"${r.exact_sentence}"`}
                    </p>
                  </foreignObject>
                )}

                {!r.found && (
                  <text
                    x={-paperNodeW / 2 + 10}
                    y={-claimNodeH / 2 + 52}
                    fill="#4b5563"
                    style={{ fontSize: "9px", fontFamily: "monospace", fontStyle: "italic" }}
                  >
                    No matching text found in document
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
