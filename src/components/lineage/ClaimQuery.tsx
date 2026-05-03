"use client";

import { useState } from "react";
import type { PaperEntry, ExtractionResult } from "./types";

interface Props {
  papers: PaperEntry[];
  activePaperId: string | null;
  onSelectPaper: (id: string) => void;
  onResult: (result: ExtractionResult) => void;
}

/**
 * ClaimQuery — Form to query a claim against a selected paper.
 * Sends to POST /api/papers/query and emits the parsed result.
 */
export default function ClaimQuery({
  papers,
  activePaperId,
  onSelectPaper,
  onResult,
}: Props) {
  const [claim, setClaim] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readyPapers = papers.filter((p) => p.ready);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activePaperId || !claim.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/papers/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: activePaperId, claim: claim.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Query failed (${res.status})`);
      }

      const data = await res.json();

      onResult({
        ...data,
        claim: claim.trim(),
        _key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });

      setClaim("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4 flex-1">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-purple-400 animate-pulse" />
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">
          Query Claim
        </h2>
      </div>

      {/* Paper Selector */}
      <div className="space-y-2">
        <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block">
          Source Document
        </label>
        {readyPapers.length === 0 ? (
          <div className="text-[10px] text-gray-600 italic py-3 border border-dashed border-gray-800 px-3">
            No papers uploaded yet. Upload a PDF above to begin.
          </div>
        ) : (
          <div className="space-y-1">
            {readyPapers.map((paper) => (
              <button
                key={paper.id}
                onClick={() => onSelectPaper(paper.id)}
                className={`w-full text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 flex items-center gap-3 ${
                  activePaperId === paper.id
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                    : "border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                }`}
              >
                <svg
                  className="w-4 h-4 shrink-0 opacity-60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                <span className="truncate">{paper.title}</span>
                {activePaperId === paper.id && (
                  <span className="ml-auto text-[8px] text-cyan-500">
                    ACTIVE
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Claim Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block">
          Claim to Verify
        </label>
        <div className="relative">
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="e.g. Force equals mass times acceleration"
            disabled={!activePaperId || loading}
            rows={3}
            className={`
              w-full bg-transparent border px-3 py-2.5 text-sm leading-relaxed
              placeholder:text-gray-700 resize-none transition-all duration-200
              focus:outline-none
              ${
                !activePaperId
                  ? "border-gray-800 text-gray-700 cursor-not-allowed"
                  : "border-gray-700 text-white focus:border-purple-500"
              }
            `}
          />
        </div>

        <button
          type="submit"
          disabled={!activePaperId || !claim.trim() || loading}
          className={`
            w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] border-2
            transition-all duration-300 flex items-center justify-center gap-2
            ${
              loading
                ? "border-purple-500/50 text-purple-400 bg-purple-500/5"
                : !activePaperId || !claim.trim()
                ? "border-gray-800 text-gray-700 cursor-not-allowed"
                : "border-purple-500 text-purple-300 hover:bg-purple-500/10 hover:text-white"
            }
          `}
        >
          {loading ? (
            <>
              <div className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              Extract Lineage
            </>
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest border-l-4 border-red-500 text-red-400 bg-red-500/5">
          ✗ {error}
        </div>
      )}
    </div>
  );
}
