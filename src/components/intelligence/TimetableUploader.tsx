"use client";

import React, { useState, useRef } from "react";

interface Props {
  onUploadComplete: () => void;
}

export default function TimetableUploader({ onUploadComplete }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
    raw?: string;
  }>({ type: "idle", message: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    const validTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith(".pdf")) {
      setStatus({ type: "error", message: "Only PDF and image files are supported" });
      return;
    }

    setUploading(true);
    setStatus({ type: "idle", message: "" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/intelligence/upload-timetable", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        setStatus({
          type: "error",
          message: data.error === "parse_failed"
            ? "Gemini could not parse the timetable. Raw response shown below."
            : (data.error || "Upload failed"),
          raw: data.raw,
        });
        return;
      }

      setStatus({
        type: "success",
        message: `EXTRACTED ${data.count} EVENTS`,
      });
      onUploadComplete();
    } catch (err) {
      setStatus({ type: "error", message: "Upload failed" });
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
    <div style={{ fontFamily: "monospace" }}>
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
        UPLOAD_TIMETABLE //
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          cursor: "pointer",
          border: `2px dashed ${dragOver ? "#00ff41" : uploading ? "#ff9500" : "#333"}`,
          background: dragOver ? "#00ff4108" : uploading ? "#ff950008" : "#0a0a0a",
          padding: "24px",
          textAlign: "center",
          transition: "all 0.2s",
        }}
      >
        {uploading ? (
          <div style={{ color: "#ff9500", fontSize: "11px" }}>
            PARSING_TIMETABLE //░░░░░░░░
          </div>
        ) : (
          <>
            <div style={{ color: "#666", fontSize: "11px", marginBottom: "4px" }}>
              Drop PDF or image
            </div>
            <div style={{ color: "#444", fontSize: "9px" }}>
              .pdf .png .jpg .webp
            </div>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {status.type !== "idle" && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px",
            borderLeft: `3px solid ${status.type === "success" ? "#00ff41" : "#ef4444"}`,
            background: "#0a0a0a",
            fontSize: "11px",
            color: status.type === "success" ? "#00ff41" : "#ef4444",
          }}
        >
          {status.type === "success" ? "✓ " : "✗ "}
          {status.message}
          {status.raw && (
            <pre
              style={{
                marginTop: "8px",
                padding: "8px",
                background: "#000",
                color: "#666",
                fontSize: "10px",
                overflow: "auto",
                maxHeight: "200px",
                whiteSpace: "pre-wrap",
              }}
            >
              {status.raw}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
