"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  onUploadComplete: (paperId: string) => void;
  onMount: () => void;
}

/**
 * PaperUploader — Drag-and-drop PDF upload with progress indication.
 * Uploads to POST /api/papers/upload.
 */
export default function PaperUploader({ onUploadComplete, onMount }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch papers on mount
  useEffect(() => {
    onMount();
  }, [onMount]);

  const uploadFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setStatus({ type: "error", message: "Only PDF files are supported" });
      return;
    }

    setUploading(true);
    setStatus({ type: "idle", message: "" });

    try {
      const title = file.name.replace(/\.pdf$/i, "");
      const uniqueTitle = `${title}_${Date.now()}`;

      // 1. Get resumable upload URL from backend (bypasses Vercel limits)
      const startRes = await fetch("/api/papers/upload/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uniqueTitle,
          size: file.size,
          mimeType: "application/pdf",
        }),
      });

      if (!startRes.ok) throw new Error("Failed to start upload session");
      const { uploadUrl } = await startRes.json();

      // 2. Upload directly from browser to Gemini File API
      // We expect this to throw "TypeError: Failed to fetch" because of a known
      // bug in Gemini's API where it doesn't return CORS headers on success.
      try {
        await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "X-Goog-Upload-Command": "upload, finalize",
            "X-Goog-Upload-Offset": "0",
          },
          body: file,
        });
      } catch (err) {
        // Ignore the CORS TypeError, the file was actually uploaded.
      }

      // 3. Verify and save the result in our database
      const finishRes = await fetch("/api/papers/upload/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, uniqueTitle }),
      });

      if (!finishRes.ok) {
        const e = await finishRes.json();
        throw new Error(e.error || "Failed to verify upload");
      }
      
      const data = await finishRes.json();

      setStatus({
        type: "success",
        message: `"${data.title}" indexed by Gemini`,
      });
      onUploadComplete(data.paperId);
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-cyan-400 animate-pulse" />
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">
          Ingest Source Document
        </h2>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`
          relative cursor-pointer border-2 border-dashed transition-all duration-300
          flex flex-col items-center justify-center gap-3 py-10 px-6
          ${
            dragOver
              ? "border-cyan-400 bg-cyan-400/5"
              : uploading
              ? "border-yellow-500/50 bg-yellow-500/5"
              : "border-gray-700 hover:border-gray-500 hover:bg-white/[0.02]"
          }
        `}
      >
        {uploading ? (
          <>
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-full" />
              <div className="absolute inset-0 border-2 border-yellow-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest animate-pulse">
              Uploading to Gemini...
            </span>
          </>
        ) : (
          <>
            {/* Upload Icon */}
            <svg
              className={`w-8 h-8 transition-colors ${
                dragOver ? "text-cyan-400" : "text-gray-600"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Drop PDF or click to browse
              </p>
              <p className="text-[8px] text-gray-600 mt-1 tracking-wider">
                Uploaded once to Gemini File API — no chunking needed
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Status Message */}
      {status.type !== "idle" && (
        <div
          className={`px-3 py-2 text-[9px] font-bold uppercase tracking-widest border-l-4 ${
            status.type === "success"
              ? "border-green-500 text-green-400 bg-green-500/5"
              : "border-red-500 text-red-400 bg-red-500/5"
          }`}
        >
          {status.type === "success" ? "✓ " : "✗ "}
          {status.message}
        </div>
      )}
    </div>
  );
}
