"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import PaperUploader from "@/components/lineage/PaperUploader";
import ClaimQuery from "@/components/lineage/ClaimQuery";
import LineageGraph from "@/components/lineage/LineageGraph";
import CitationChain from "@/components/sentinel/CitationChain";
import VerdictDashboard from "@/components/sentinel/VerdictDashboard";
import { detectEquations } from "@/lib/equationDetector";
import type { ExtractionResult, PaperEntry } from "@/components/lineage/types";

const ClaimGraph = dynamic(() => import("@/components/sentinel/ClaimGraph"), {
  ssr: false,
});
const PDFHighlighter = dynamic(() => import("@/components/sentinel/PDFHighlighter"), {
  ssr: false,
});

function URLParamsHandler({ onClaim }: { onClaim: (claim: string | null) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const claim = searchParams.get("claim");
    onClaim(claim ? decodeURIComponent(claim) : null);
  }, [searchParams, onClaim]);
  return null;
}

export default function LineagePage() {
  const [papers, setPapers] = useState<PaperEntry[]>([]);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [currentResult, setCurrentResult] = useState<ExtractionResult | null>(null);
  const [chainRootId, setChainRootId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showChainInput, setShowChainInput] = useState(false);
  const [claim, setClaim] = useState("");
  const [incomingClaim, setIncomingClaim] = useState<string | null>(null);

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

  useEffect(() => {
    if (incomingClaim) {
      setClaim(incomingClaim);
      const el = document.getElementById("query-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [incomingClaim]);

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

  const handleUnfoldInRosetta = (equation: string) => {
    const encoded = encodeURIComponent(equation);
    window.open(`/rosetta?eq=${encoded}&autoparse=true`, "_blank");
  };

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

  const detectedEquations = currentResult?.exact_sentence
    ? detectEquations(currentResult.exact_sentence)
    : [];

  return (
    <main className="min-h-screen font-mono text-white bg-black selection:bg-white selection:text-black">
      <Suspense fallback={null}>
        <URLParamsHandler onClaim={setIncomingClaim} />
      </Suspense>

      {/* ─── Header / Shared Nav ─── */}
      <header className="border-b border-gray-800 px-6 md:px-12 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors"
        >
          ← SENTINEL FEED
        </Link>
        <nav className="flex gap-6">
          <Link
            href="/lineage"
            className="text-[10px] font-bold uppercase tracking-[0.2em] pb-1 border-b-2 border-[#00ff41] text-[#00ff41]"
          >
            LINEAGE_ENGINE
          </Link>
          <Link
            href="/rosetta"
            className="text-[10px] font-bold uppercase tracking-[0.2em] pb-1 border-b-2 border-transparent text-gray-600 hover:text-white transition-colors"
          >
            ROSETTA_STONE
          </Link>
        </nav>
      </header>

      {/* ─── Incoming from Rosetta Banner ─── */}
      {incomingClaim && (
        <div
          className="mx-3 mt-3 border border-[#00ff41] bg-black p-3 flex items-center gap-3"
          style={{ fontFamily: "monospace", fontSize: "12px" }}
        >
          <span className="animate-pulse text-[#00ff41]">⚡</span>
          <span className="text-[#00ff41] font-bold">INCOMING_FROM_ROSETTA //</span>
          <span className="text-gray-400">Equation pre-loaded. Select a paper and hit Extract Lineage.</span>
        </div>
      )}

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
              claimValue={claim}
              onClaimChange={setClaim}
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
                  paperId={currentResult.paperId}
                />
              </div>
            )}

          {/* Equations Detected Panel */}
          {detectedEquations.length > 0 && (
            <div
              className="border border-[#00ff41] p-3"
              style={{ background: "#00ff4108", fontFamily: "monospace" }}
            >
              <div
                className="text-xs font-bold pb-2 mb-2 border-b border-[#00ff41]/30 tracking-wider"
                style={{ color: "#00ff41" }}
              >
                EQUATIONS_DETECTED //
              </div>
              <div className="flex flex-col gap-2">
                {detectedEquations.map((eq) => (
                  <div
                    key={eq}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-white font-mono">{eq}</span>
                    <button
                      onClick={() => handleUnfoldInRosetta(eq)}
                      className="text-[10px] font-bold uppercase tracking-widest border border-[#00ff41] bg-black text-[#00ff41] px-3 py-1 hover:bg-[#00ff41] hover:text-black transition-all duration-150"
                    >
                      UNFOLD IN ROSETTA →
                    </button>
                  </div>
                ))}
              </div>
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
