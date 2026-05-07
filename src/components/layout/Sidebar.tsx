"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toggleStudyMode } from "@/app/actions";

const NAV_ITEMS = [
  {
    href: "/",
    label: "FEED",
    sublabel: "all signals",
    icon: "▶",
    iconColor: "#00ff41",
  },
  {
    href: "/lineage",
    label: "LINEAGE_ENGINE",
    sublabel: "paper verification",
    icon: "◈",
    iconColor: "#8844ff",
  },
  {
    href: "/rosetta",
    label: "ROSETTA_STONE",
    sublabel: "equation parser",
    icon: "∑",
    iconColor: "#00ff41",
  },
  {
    href: "/intelligence",
    label: "INTELLIGENCE",
    sublabel: "study planner",
    icon: "⚡",
    iconColor: "#ff6600",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <aside
      style={{
        width: "220px",
        minWidth: "220px",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#050505",
        borderRight: "1px solid #1a1a1a",
        display: "flex",
        flexDirection: "column",
        fontFamily: "monospace",
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid #111",
        }}
      >
        <div
          style={{
            color: "#00ff41",
            fontSize: "20px",
            fontWeight: "bold",
            letterSpacing: "2px",
            lineHeight: 1.1,
          }}
        >
          THE
          <br />
          SENTINEL
        </div>
        <div
          style={{
            color: "#333",
            fontSize: "9px",
            letterSpacing: "1px",
            marginTop: "6px",
          }}
        >
          INGESTION_ENGINE // STATUS: ACTIVE
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ padding: "16px 0", flex: 1 }}>
        <div
          style={{
            padding: "0 20px 8px",
            color: "#333",
            fontSize: "9px",
            letterSpacing: "2px",
          }}
        >
          NAVIGATION
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 20px",
                background: isActive ? "#0a0a0a" : "transparent",
                borderLeft: isActive
                  ? "2px solid #00ff41"
                  : "2px solid transparent",
                textDecoration: "none",
                marginBottom: "2px",
                transition: "background 0.1s",
              }}
            >
              <span
                style={{
                  color: isActive ? item.iconColor : "#444",
                  fontSize: "13px",
                  minWidth: "16px",
                }}
              >
                {item.icon}
              </span>
              <div>
                <div
                  style={{
                    color: isActive ? "#fff" : "#666",
                    fontSize: "11px",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                    fontFamily: "monospace",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    color: "#333",
                    fontSize: "9px",
                    fontFamily: "monospace",
                  }}
                >
                  {item.sublabel}
                </div>
              </div>
            </Link>
          );
        })}

        {/* Divider */}
        <div
          style={{
            borderTop: "1px solid #111",
            margin: "12px 20px",
          }}
        />

        {/* Study Mode Toggle */}
        <div style={{ padding: "10px 20px" }}>
          <div
            style={{
              color: "#333",
              fontSize: "9px",
              letterSpacing: "2px",
              marginBottom: "10px",
            }}
          >
            STUDY MODE
          </div>
          <StudyModeToggle />
        </div>
      </nav>

      {/* Sign Out */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #111",
        }}
      >
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            width: "100%",
            padding: "8px",
            background: "transparent",
            border: "1px solid #222",
            color: signingOut ? "#333" : "#555",
            fontFamily: "monospace",
            fontSize: "10px",
            cursor: signingOut ? "not-allowed" : "pointer",
            letterSpacing: "1px",
          }}
        >
          {signingOut ? "SIGNING OUT..." : "SIGN OUT"}
        </button>
      </div>
    </aside>
  );
}

function StudyModeToggle() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    setPending(true);
    try {
      await toggleStudyMode();
      router.refresh();
    } catch {
      // ignore
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span
        style={{
          color: "#333",
          fontSize: "10px",
          letterSpacing: "1px",
        }}
      >
        {pending ? "SYNCING..." : "TOGGLE"}
      </span>
      <div
        onClick={handleToggle}
        style={{
          width: "40px",
          height: "20px",
          background: "#111",
          border: "1px solid #222",
          borderRadius: "10px",
          position: "relative",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        <div
          style={{
            width: "14px",
            height: "14px",
            background: pending ? "#555" : "#333",
            borderRadius: "50%",
            position: "absolute",
            top: "2px",
            left: "3px",
            transition: "left 0.2s",
          }}
        />
      </div>
    </div>
  );
}
