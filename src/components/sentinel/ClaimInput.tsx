"use client";

import React, { useState } from "react";

interface Paper {
  id: string;
  title: string;
  ready: boolean;
}

interface ClaimInputProps {
  papers: Paper[];
  onSubmit: (claim: string, paperId: string) => void;
  loading: boolean;
}

export default function ClaimInput({ papers, onSubmit, loading }: ClaimInputProps) {
  const [claim, setClaim] = useState("");
  const [paperId, setPaperId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim() || !paperId) return;
    onSubmit(claim.trim(), paperId);
  };

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: "monospace" }}>
      <div
        style={{
          color: "#00ff41",
          marginBottom: "8px",
          fontWeight: "bold",
          borderBottom: "1px solid #333",
          paddingBottom: "4px",
          fontSize: "12px",
        }}
      >
        CLAIM_INPUT //
      </div>

      <div style={{ marginBottom: "8px" }}>
        <select
          value={paperId}
          onChange={(e) => setPaperId(e.target.value)}
          disabled={loading}
          style={{
            width: "100%",
            background: "#0a0a0a",
            border: "1px solid #333",
            color: paperId ? "#fff" : "#666",
            padding: "8px",
            fontFamily: "monospace",
            fontSize: "12px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="">SELECT_PAPER //</option>
          {papers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} {!p.ready ? "[NOT_READY]" : ""}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <textarea
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          disabled={loading}
          placeholder="ENTER_CLAIM //"
          rows={4}
          style={{
            width: "100%",
            background: "#0a0a0a",
            border: "1px solid #333",
            color: "#fff",
            padding: "8px",
            fontFamily: "monospace",
            fontSize: "12px",
            outline: "none",
            resize: "vertical",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !claim.trim() || !paperId}
        style={{
          width: "100%",
          background: "#0a0a0a",
          border: "1px solid #00ff41",
          color: loading ? "#555" : "#00ff41",
          padding: "8px",
          fontFamily: "monospace",
          fontSize: "12px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {loading ? "QUERYING //░░░░░░░░" : "EXECUTE_QUERY //"}
      </button>
    </form>
  );
}
