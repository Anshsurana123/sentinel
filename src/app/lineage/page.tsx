"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import PaperUploader from "@/components/lineage/PaperUploader";
import ClaimQuery from "@/components/lineage/ClaimQuery";
import LineageGraph from "@/components/lineage/LineageGraph";
import CitationChain from "@/components/sentinel/CitationChain";
import VerdictDashboard from "@/components/sentinel/VerdictDashboard";
import type { ExtractionResult, PaperEntry } from "@/components/lineage/types";

const ClaimGraph = dynamic(() => import("@/components/sentinel/ClaimGraph"), {
  ssr: false,
});
const PDFHighlighter = dynamic(() => import("@/components/sentinel/PDFHighlighter"), {
  ssr: false,
});

export default function LineagePage() {
  const [papers, setPapers] = useState<PaperEntry[]>([]);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [currentResult, setCurrentResult] = useState<ExtractionResult | null>(null);
  const [chainRootId, setChainRootId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showChainInput, setShowChainInput] = useState(false);

  const refreshPapers = useCallback(async () => {
    try {
      const res = await fetch("/api/papers");
      const data = await res.json();
      setPapers(data);
    } catch (err) {
      console.error("[LineagePage] Failed to fetch papers:", err);
    }
  }, []);

  useEffect(() => {
    refreshPapers();
  }, [refreshPapers]);

  const handleUploadComplete = useCallback(
    (paperId: string) => {
      setActivePaperId(paperId);
      refreshPapers();
    },
    [refreshPapers]
  );

  const handleDeletePaper = useCallback(
    async (paperId: string) => {
      try {
        await fetch(`/api/papers/${paperId}`, { method: "DELETE" });
        if (activePaperId === paperId) {
          setActivePaperId(null);
        }
        refreshPapers();
      } catch (err) {
        console.error("[LineagePage] Failed to delete paper:", err);
      }
    },
    [activePaperId, refreshPapers]
  );

  const handleQueryResult = useCallback(
    async (result: ExtractionResult) => {
      setCurrentResult(result);
      setResults((prev) => [result, ...prev]);
      setPdfUrl(null);
      setShowChainInput(false);

      // Save claim to DB for citation chain + stats
      try {
        const saveRes = await fetch("/api/sentinel/claims", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: result.claim,
            verdict: result.verdict ?? "UNRELATED",
            exactSentence: result.exact_sentence ?? null,
            pageNumber: result.page_number ?? null,
            context: result.context ?? null,
            paperId: result.paperId,
            parentId: chainRootId,
          }),
        });
        const saved = await saveRes.json();
        if (saved.claim) {
          setChainRootId(saved.claim.id);
        }
      } catch (err) {
        console.error("[LineagePage] Failed to save claim:", err);
      }

      // Show PDF highlighter if we have a pinpointed sentence
      if (result.found && result.exact_sentence && result.page_number != null) {
        setPdfUrl(`/api/papers/${result.paperId}`);
      }
    },
    [chainRootId]
  );

  const handleExtendChain = useCallback(() => {
    setShowChainInput(true);
    const el = document.getElementById("query-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Map lineage results into the shape ClaimGraph expects
  const graphResults = results.map((r) => ({
    found: r.found,
    exact_sentence: r.exact_sentence ?? undefined,
    page_number: r.page_number ?? undefined,
    context: r.context ?? undefined,
    verdict: r.verdict,
    paperTitle: r.paperTitle,
    paperId: r.paperId,
    claim: r.claim,
  }));

  return (
    <main className="min-h-screen font-mono text-white bg-black selection:bg-white selection:text-black">
      {/* ─── Header ─── */}
      <header className="border-b border-gray-800 px-6 md:px-12 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors"
        >
          ← SENTINEL FEED
        </Link>
        <h1 className="text-sm font-black uppercase tracking-[0.2em]">
          Lineage Engine
        </h1>
      </header>

      {/* ─── 3-Column Grid ─── */}
      <div
        className="grid gap-3 p-3"
        style={{
          gridTemplateColumns: "280px 1fr 280px",
        }}
      >
        {/* ═══ LEFT COLUMN ═══ */}
        <div className="flex flex-col gap-3">
          {/* Ingest Source Document */}
          <div className="border border-gray-800 bg-[#0a0a0a]">
            <PaperUploader
              onUploadComplete={handleUploadComplete}
              onMount={refreshPapers}
            />
          </div>

          {/* Query Controls */}
          <div
            id="query-section"
            className={`border bg-[#0a0a0a] transition-all ${
              showChainInput ? "border-[#00ff41]" : "border-gray-800"
            }`}
          >
            <ClaimQuery
              papers={papers}
              activePaperId={activePaperId}
              onSelectPaper={setActivePaperId}
              onResult={handleQueryResult}
              onDeletePaper={handleDeletePaper}
            />
          </div>

          {/* Citation Chain */}
          <div className="border border-gray-800 bg-[#0a0a0a] p-3">
            <CitationChain
              claimId={chainRootId}
              onExtendChain={handleExtendChain}
            />
          </div>
        </div>

        {/* ═══ CENTER COLUMN ═══ */}
        <div className="flex flex-col gap-3">
          {/* Claim Graph (react-flow) */}
          <div className="border border-gray-800 bg-[#0a0a0a] p-3">
            <div
              className="text-xs font-bold border-b border-gray-800 pb-1 mb-2 tracking-wider"
              style={{ color: "#00ff41" }}
            >
              CLAIM_GRAPH //
            </div>
            <div style={{ height: "350px" }}>
              <ClaimGraph results={graphResults} />
            </div>
          </div>

          {/* PDF Highlighter */}
          {currentResult?.found &&
            pdfUrl &&
            currentResult.exact_sentence &&
            currentResult.page_number != null && (
              <div className="border border-gray-800 bg-[#0a0a0a] p-3">
                <div
                  className="text-xs font-bold border-b border-gray-800 pb-1 mb-2 tracking-wider"
                  style={{ color: "#00ff41" }}
                >
                  PDF_HIGHLIGHTER //
                </div>
                <PDFHighlighter
                  pdfUrl={pdfUrl}
                  exactSentence={currentResult.exact_sentence}
                  pageNumber={currentResult.page_number}
                />
              </div>
            )}

          {/* Legacy Lineage Graph */}
          <div className="border border-gray-800 bg-[#0a0a0a] p-3 flex-1 min-h-[300px]">
            <div
              className="text-xs font-bold border-b border-gray-800 pb-1 mb-2 tracking-wider"
              style={{ color: "#a855f7" }}
            >
              LINEAGE_GRAPH //
            </div>
            <LineageGraph results={results} />
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="border border-gray-800 bg-[#0a0a0a] p-3">
          <VerdictDashboard />
        </div>
      </div>
    </main>
  );
}
