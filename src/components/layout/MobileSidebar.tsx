"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "none",
          position: "fixed",
          top: "12px",
          left: "12px",
          zIndex: 100,
          background: "#050505",
          border: "1px solid #222",
          color: "#00ff41",
          fontFamily: "monospace",
          fontSize: "16px",
          padding: "6px 10px",
          cursor: "pointer",
        }}
        className="mobile-hamburger"
        aria-label="Toggle navigation"
      >
        {open ? "✕" : "☰"}
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 90,
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar — slide in on mobile */}
      <div
        className="sidebar-wrapper"
        style={{ transform: open ? "translateX(0)" : undefined }}
      >
        <Sidebar />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-hamburger { display: block !important; }
          .mobile-overlay { display: block !important; }
          .sidebar-wrapper {
            position: fixed !important;
            top: 0;
            left: 0;
            height: 100vh;
            transform: translateX(-220px);
            transition: transform 0.2s ease;
            z-index: 95;
          }
        }
      `}</style>
    </>
  );
}
