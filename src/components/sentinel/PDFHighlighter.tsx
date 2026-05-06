"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

interface PDFHighlighterProps {
  pdfUrl: string;
  exactSentence: string;
  pageNumber: number;
  paperId: string;
}

export default function PDFHighlighter({
  pdfUrl,
  exactSentence,
  pageNumber,
  paperId,
}: PDFHighlighterProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(pageNumber || 1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set up PDF.js worker on client only — avoids SSR crash


  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(pageNumber || 1);
    setLoadError(null);
    setIsExpired(false);
  };

  const onDocumentLoadError = async (error: Error) => {
    console.error("PDF load error:", error);
    try {
      const res = await fetch(pdfUrl);
      if (res.status === 410) {
        setIsExpired(true);
        return;
      }
    } catch {
      // ignore fetch failure
    }
    setLoadError(error.message);
  };

  const customTextRenderer = useCallback(
    ({ str }: { str: string }): string => {
      if (!exactSentence || !str || str.trim().length < 2) return str;

      const stopWords = new Set(["the", "and", "for", "are", "but", "not", "you", "all", "can", "her", "was", "one", "our", "out", "had", "has", "have", "that", "with", "this", "from", "they", "will", "been", "were", "said", "each", "which", "their", "time", "more", "very", "when", "come", "here", "just", "like", "long", "make", "many", "over", "such", "take", "than", "them", "well", "also"]);

      const significantWords = exactSentence
        .split(/\s+/)
        .filter(w => w.length >= 4 && !stopWords.has(w.toLowerCase().replace(/[^a-z]/g, "")))
        .map(w => w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
        .filter(Boolean);

      if (significantWords.length === 0) return str;

      const strClean = str.toLowerCase().replace(/[^a-z0-9\s]/g, "");
      const hasMatch = significantWords.some(word => strClean.includes(word));

      if (!hasMatch) return str;

      return `<mark style="background:#00ff4133;color:#00ff41;border-bottom:2px solid #00ff41;padding:0 2px">${str}</mark>`;
    },
    [exactSentence]
  );

  const handleRefresh = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !paperId) return;
    setIsRefreshing(true);
    const formData = new FormData();
    formData.append("pdf", file);
    await fetch(`/api/papers/${paperId}/refresh`, {
      method: "POST",
      body: formData,
    });
    setIsExpired(false);
    setIsRefreshing(false);
    window.location.reload();
  };

  if (isExpired) {
    return (
      <div
        style={{
          fontFamily: "monospace",
          padding: "16px",
          border: "1px solid #ff9500",
          background: "#0a0a0a",
        }}
      >
        <div style={{ color: "#ff9500", marginBottom: "8px", fontWeight: "bold" }}>
          URI_EXPIRED //
        </div>
        <div style={{ color: "#666", fontSize: "12px", marginBottom: "12px" }}>
          Gemini File API URIs expire after 48hrs. Re-upload the same PDF to restore preview.
          Claim extraction still works normally.
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={handleRefresh}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isRefreshing}
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            background: "#000",
            color: "#ff9500",
            border: "1px solid #ff9500",
            padding: "6px 16px",
            cursor: "pointer",
          }}
        >
          {isRefreshing ? "REFRESHING▋" : "RE-UPLOAD PDF >>"}
        </button>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ fontFamily: "monospace", color: "#ff4141", padding: "12px", border: "1px solid #ff4141" }}>
        PDF_LOAD_ERROR // {loadError}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "monospace", color: "#fff" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ color: "#00ff41", fontSize: "12px" }}>
          PDF_VIEWER // PAGE_{currentPage}_OF_{numPages}
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            style={{
              fontFamily: "monospace", fontSize: "11px",
              background: "#000", color: "#00ff41",
              border: "1px solid #333", padding: "2px 8px",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              opacity: currentPage <= 1 ? 0.4 : 1,
            }}
          >
            ← PREV
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            style={{
              fontFamily: "monospace", fontSize: "11px",
              background: "#000", color: "#00ff41",
              border: "1px solid #333", padding: "2px 8px",
              cursor: currentPage >= numPages ? "not-allowed" : "pointer",
              opacity: currentPage >= numPages ? 0.4 : 1,
            }}
          >
            NEXT →
          </button>
        </div>
      </div>

      {/* Extracted sentence reminder */}
      <div style={{
        fontSize: "11px", color: "#666", marginBottom: "8px",
        borderLeft: "2px solid #00ff41", paddingLeft: "8px",
        fontStyle: "italic"
      }}>
        HIGHLIGHTING // &quot;{exactSentence?.slice(0, 100)}...&quot;
      </div>

      {/* PDF Document */}
      <div style={{ border: "1px solid #333", overflow: "auto", maxHeight: "500px", background: "#111" }}>
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div style={{ padding: "20px", color: "#333", fontFamily: "monospace" }}>
              LOADING_PDF▋
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            customTextRenderer={customTextRenderer}
            renderAnnotationLayer={true}
            renderTextLayer={true}
            width={600}
            loading={
              <div style={{ padding: "20px", color: "#333", fontFamily: "monospace" }}>
                RENDERING_PAGE▋
              </div>
            }
          />
        </Document>
      </div>
    </div>
  );
}
