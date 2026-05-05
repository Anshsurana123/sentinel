"use client";

import React, { useEffect, useState } from "react";

interface ChainItem {
  id: string;
  text: string;
  verdict: string;
  paperTitle: string;
  pageNumber: number | null;
  exactSentence: string | null;
}

interface CitationChainProps {
  claimId: string | null;
  onExtendChain: () => void;
}

export default function CitationChain({ claimId, onExtendChain }: CitationChainProps) {
  const [chain, setChain] = useState<ChainItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!claimId) {
      setChain([]);
      return;
    }

    setLoading(true);
    fetch(`/api/sentinel/chain?claimId=${encodeURIComponent(claimId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.chain) {
          setChain(
            data.chain.map((c: ChainItem & { paper?: { title: string } }) => ({
              ...c,
              paperTitle: c.paper?.title ?? "Unknown",
            }))
          );
        }
      })
      .catch((err) => console.error("[CitationChain] fetch error:", err))
      .finally(() => setLoading(false));
  }, [claimId]);

  const borderColor = (verdict: string) => {
    if (verdict === "SUPPORTS") return "#00ff41";
    if (verdict === "REFUTES") return "#ef4444";
    return "#6b7280";
  };

  return (
    <div style={{ fontFamily: "monospace", fontSize: "12px" }}>
      <div
        style={{
          color: "#00ff41",
          marginBottom: "8px",
          fontWeight: "bold",
          borderBottom: "1px solid #333",
          paddingBottom: "4px",
        }}
      >
        CITATION_CHAIN //
      </div>

      {loading && (
        <div style={{ color: "#00ff41", padding: "8px 0" }}>
          LOADING_CHAIN //░░░░░░░░
        </div>
      )}

      {!loading && chain.length === 0 && (
        <div style={{ color: "#666", padding: "8px 0" }}>
          NO_CHAIN // Submit a claim to build lineage
        </div>
      )}

      {chain.map((item, index) => (
        <div
          key={item.id}
          style={{
            borderLeft: `3px solid ${borderColor(item.verdict)}`,
            background: "#0a0a0a",
            borderTop: "1px solid #1a1a1a",
            borderRight: "1px solid #1a1a1a",
            borderBottom: "1px solid #1a1a1a",
            padding: "8px 10px",
            marginBottom: "6px",
            animation: "slideIn 0.3s ease forwards",
            animationDelay: `${index * 100}ms`,
            opacity: 0,
          }}
        >
          <div style={{ color: "#fff", marginBottom: "4px", fontSize: "11px" }}>
            {item.text}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: borderColor(item.verdict),
                fontWeight: "bold",
                fontSize: "10px",
              }}
            >
              {item.verdict}
            </span>
            <span style={{ color: "#666", fontSize: "10px" }}>
              {item.paperTitle}
              {item.pageNumber ? `, p.${item.pageNumber}` : ""}
            </span>
          </div>
          {index < chain.length - 1 && (
            <div
              style={{
                color: "#666",
                fontSize: "10px",
                marginTop: "4px",
                paddingLeft: "8px",
              }}
            >
              │ leads to
            </div>
          )}
        </div>
      ))}

      {chain.length > 0 && (
        <button
          onClick={onExtendChain}
          style={{
            background: "#0a0a0a",
            border: "1px solid #00ff41",
            color: "#00ff41",
            padding: "6px 12px",
            fontFamily: "monospace",
            fontSize: "11px",
            cursor: "pointer",
            marginTop: "8px",
            width: "100%",
          }}
        >
          + ADD_TO_CHAIN
        </button>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
