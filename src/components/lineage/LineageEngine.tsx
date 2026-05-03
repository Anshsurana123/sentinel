"use client";

import { useState, useCallback } from "react";
import PaperUploader from "./PaperUploader";
import ClaimQuery from "./ClaimQuery";
import LineageGraph from "./LineageGraph";
import type { ExtractionResult, PaperEntry } from "./types";

/**
 * LineageEngine — The orchestrator component.
 *
 * Layout:
 *   ┌──────────────────────────────────────────┐
 *   │  Left Panel: Upload + Query Controls     │
 *   │  Right Panel: Lineage Node Graph         │
 *   └──────────────────────────────────────────┘
 */
export default function LineageEngine() {
  const [papers, setPapers] = useState<PaperEntry[]>([]);
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);

  // Fetch papers on mount and after uploads
  const refreshPapers = useCallback(async () => {
    try {
      const res = await fetch("/api/papers");
      const data = await res.json();
      setPapers(data);
    } catch (err) {
      console.error("[LineageEngine] Failed to fetch papers:", err);
    }
  }, []);

  // Called after a successful upload
  const handleUploadComplete = useCallback(
    (paperId: string) => {
      setActivePaperId(paperId);
      refreshPapers();
    },
    [refreshPapers]
  );

  // Called after a successful query
  const handleQueryResult = useCallback((result: ExtractionResult) => {
    setResults((prev) => [result, ...prev]);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-57px)]">
      {/* ─── Left Panel: Controls ─── */}
      <div className="w-full lg:w-[420px] lg:min-w-[420px] border-r border-gray-800 flex flex-col">
        {/* Upload Section */}
        <PaperUploader
          onUploadComplete={handleUploadComplete}
          onMount={refreshPapers}
        />

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* Query Section */}
        <ClaimQuery
          papers={papers}
          activePaperId={activePaperId}
          onSelectPaper={setActivePaperId}
          onResult={handleQueryResult}
        />
      </div>

      {/* ─── Right Panel: Graph ─── */}
      <div className="flex-1 relative overflow-hidden bg-[#050505]">
        <LineageGraph results={results} />
      </div>
    </div>
  );
}
