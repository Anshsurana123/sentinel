"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PDFHighlighterProps {
  pdfUrl: string;
  exactSentence: string;
  pageNumber: number;
}

function makeChunks(text: string, chunkSize: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i <= words.length - chunkSize; i++) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  return chunks;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function PDFHighlighter({
  pdfUrl,
  exactSentence,
  pageNumber,
}: PDFHighlighterProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(pageNumber);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(pageNumber);
  }, [pageNumber]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error("PDF load error:", err);
    setError("PDF_LOAD_ERROR // Check file availability");
  }, []);

  const chunks = React.useMemo(() => makeChunks(exactSentence, 6), [exactSentence]);

  const customTextRenderer = useCallback(
    (textItem: { str: string }) => {
      const text = textItem.str;
      let highlighted = text;
      for (const chunk of chunks) {
        const pattern = new RegExp(`(${escapeRegExp(chunk)})`, "gi");
        highlighted = highlighted.replace(
          pattern,
          '<mark style="background: #00ff4133; color: #00ff41; border-bottom: 2px solid #00ff41;">$1</mark>'
        );
      }
      return highlighted;
    },
    [chunks]
  );

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(numPages, p + 1));

  if (error) {
    return (
      <div
        style={{
          background: "#000",
          border: "1px solid #333",
          padding: "16px",
          fontFamily: "monospace",
          color: "#ef4444",
          fontSize: "12px",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#000",
        border: "1px solid #333",
        padding: "12px",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
          color: "#00ff41",
          fontSize: "12px",
        }}
      >
        <button
          onClick={goPrev}
          disabled={currentPage <= 1}
          style={{
            background: "#0a0a0a",
            border: "1px solid #333",
            color: currentPage <= 1 ? "#555" : "#00ff41",
            padding: "4px 10px",
            fontFamily: "monospace",
            fontSize: "11px",
            cursor: currentPage <= 1 ? "not-allowed" : "pointer",
          }}
        >
          &lt; PREV
        </button>
        <span>
          PAGE_{currentPage}_OF_{numPages || "?"}
        </span>
        <button
          onClick={goNext}
          disabled={currentPage >= numPages}
          style={{
            background: "#0a0a0a",
            border: "1px solid #333",
            color: currentPage >= numPages ? "#555" : "#00ff41",
            padding: "4px 10px",
            fontFamily: "monospace",
            fontSize: "11px",
            cursor: currentPage >= numPages ? "not-allowed" : "pointer",
          }}
        >
          NEXT &gt;
        </button>
      </div>
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div style={{ color: "#00ff41", fontSize: "12px", padding: "20px" }}>
            LOADING_PDF //░░░░░░░░
          </div>
        }
      >
        <Page
          pageNumber={currentPage}
          customTextRenderer={customTextRenderer}
          renderAnnotationLayer={false}
          width={500}
          loading={
            <div style={{ color: "#00ff41", fontSize: "12px", padding: "20px" }}>
              RENDERING_PAGE //░░░░░░░░
            </div>
          }
        />
      </Document>
    </div>
  );
}
