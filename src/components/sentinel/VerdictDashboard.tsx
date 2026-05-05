"use client";

import React, { useEffect, useState } from "react";

interface Stats {
  total: number;
  supports: number;
  refutes: number;
  unrelated: number;
  recentClaims: Array<{
    text: string;
    verdict: string;
    paperTitle: string;
    createdAt: string;
  }>;
  topPapers: Array<{ title: string; claimCount: number }>;
}

export default function VerdictDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = React.useCallback(() => {
    fetch("/api/sentinel/stats")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setStats(data);
      })
      .catch((err) => console.error("[VerdictDashboard] fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const pct = (n: number) => (stats && stats.total > 0 ? Math.round((n / stats.total) * 100) : 0);

  const badgeColor = (verdict: string) => {
    if (verdict === "SUPPORTS") return "#00ff41";
    if (verdict === "REFUTES") return "#ef4444";
    return "#6b7280";
  };

  if (loading && !stats) {
    return (
      <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#00ff41", padding: "12px" }}>
        <div>LOADING_STATS //░░░░░░░░</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#666", padding: "12px" }}>
        STATS_UNAVAILABLE //
      </div>
    );
  }

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
        VERDICT_DASHBOARD //
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "12px" }}>
        <StatBox label="SUPPORTED" count={stats.supports} pct={pct(stats.supports)} color="#00ff41" />
        <StatBox label="REFUTED" count={stats.refutes} pct={pct(stats.refutes)} color="#ef4444" />
        <StatBox label="UNRELATED" count={stats.unrelated} pct={pct(stats.unrelated)} color="#6b7280" />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ color: "#666", marginBottom: "4px", fontSize: "10px" }}>RECENT_QUERIES //</div>
        {stats.recentClaims.length === 0 && (
          <div style={{ color: "#444", fontSize: "11px" }}>No queries yet</div>
        )}
        {stats.recentClaims.map((c, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 0",
              borderBottom: "1px solid #1a1a1a",
            }}
          >
            <span style={{ color: "#ccc", fontSize: "11px", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.text}
            </span>
            <span style={{ color: badgeColor(c.verdict), fontSize: "10px", fontWeight: "bold" }}>
              {c.verdict}
            </span>
          </div>
        ))}
      </div>

      <div>
        <div style={{ color: "#666", marginBottom: "4px", fontSize: "10px" }}>TOP_SOURCES //</div>
        {stats.topPapers.length === 0 && (
          <div style={{ color: "#444", fontSize: "11px" }}>No sources yet</div>
        )}
        {stats.topPapers.map((p, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
              borderBottom: "1px solid #1a1a1a",
            }}
          >
            <span style={{ color: "#ccc", fontSize: "11px" }}>{p.title}</span>
            <span style={{ color: "#00ff41", fontSize: "11px" }}>{p.claimCount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "8px" }}>
      <div style={{ color: "#666", fontSize: "9px", marginBottom: "4px" }}>{label} //</div>
      <div style={{ color, fontSize: "20px", fontWeight: "bold", marginBottom: "4px" }}>{count}</div>
      <div style={{ background: "#1a1a1a", height: "4px", width: "100%" }}>
        <div
          style={{
            background: color,
            height: "100%",
            width: `${pct}%`,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <div style={{ color: "#444", fontSize: "9px", marginTop: "2px" }}>{pct}%</div>
    </div>
  );
}
