"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import "mafs/core.css";
import EquationInput from "@/components/rosetta/EquationInput";
import EquationUnfolder from "@/components/rosetta/EquationUnfolder";
import { ParsedRosettaResponse } from "@/components/rosetta/types";
import SignOutButton from "@/components/SignOutButton";

const MafsGraph = dynamic(() => import("@/components/rosetta/MafsGraph"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        fontFamily: "monospace",
        color: "#333",
        padding: "24px",
        height: "300px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #333",
        background: "#000",
      }}
    >
      LOADING_GRAPH...
    </div>
  ),
});

const PendulumSim = dynamic(() => import("@/components/rosetta/PendulumSim"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        fontFamily: "monospace",
        color: "#333",
        padding: "24px",
        height: "300px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #333",
        background: "#000",
      }}
    >
      LOADING_SIM...
    </div>
  ),
});

function URLParamsHandler({
  onParams,
}: {
  onParams: (eq: string | null, autoparse: boolean) => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const eq = searchParams.get("eq");
    const autoparse = searchParams.get("autoparse") === "true";
    onParams(eq ? decodeURIComponent(eq) : null, autoparse);
  }, [searchParams, onParams]);
  return null;
}

export default function RosettaPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ParsedRosettaResponse | null>(null);
  const [paramValue, setParamValue] = useState<number>(5);
  const [equation, setEquation] = useState("");
  const [urlEq, setUrlEq] = useState<string | null>(null);
  const [urlAutoparse, setUrlAutoparse] = useState(false);

  const handleParse = useCallback(
    async (eq: string) => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const res = await fetch("/api/rosetta/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ equation: eq }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }

        const parsedData = await res.json();
        setData(parsedData);
        if (parsedData.simulation_type === "spring") {
          setParamValue(5);
        } else if (parsedData.simulation_type === "pendulum") {
          setParamValue(5);
        } else if (parsedData.simulation_type === "projectile") {
          setParamValue(8);
        } else {
          setParamValue(5);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Auto-parse from URL params
  useEffect(() => {
    if (urlEq && urlAutoparse) {
      setEquation(urlEq);
      const timer = setTimeout(() => {
        handleParse(urlEq);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [urlEq, urlAutoparse, handleParse]);

  const handleVerifyInSentinel = () => {
    const encoded = encodeURIComponent(equation);
    window.open(`/lineage?claim=${encoded}&autoquery=false`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono selection:bg-[#00ff41] selection:text-black">
      <Suspense fallback={null}>
        <URLParamsHandler
          onParams={(eq, autoparse) => {
            setUrlEq(eq);
            setUrlAutoparse(autoparse);
          }}
        />
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
            className="text-[10px] font-bold uppercase tracking-[0.2em] pb-1 border-b-2 border-transparent text-gray-600 hover:text-white transition-colors"
          >
            LINEAGE_ENGINE
          </Link>
          <Link
            href="/rosetta"
            className="text-[10px] font-bold uppercase tracking-[0.2em] pb-1 border-b-2 border-[#00ff41] text-[#00ff41]"
          >
            ROSETTA_STONE
          </Link>
          <Link
            href="/intelligence"
            className="text-[10px] font-bold uppercase tracking-[0.2em] pb-1 border-b-2 border-transparent text-gray-600 hover:text-white transition-colors"
          >
            INTELLIGENCE
          </Link>
          <SignOutButton />
        </nav>
      </header>

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b-2 border-[#00ff41] pb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter">
              ROSETTA_STONE //
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
              Physics → Calculus Translation Engine
            </p>
          </div>
          <div className="text-[#00ff41] text-xs font-bold animate-pulse uppercase tracking-widest hidden sm:block">
            {loading ? "PROCESSING..." : "SYSTEM ONLINE"}
          </div>
        </header>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Input & Sim) */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
            <EquationInput
              onParse={handleParse}
              loading={loading}
              error={error}
              value={equation}
              onChange={setEquation}
            />

            <div className="flex-1 flex flex-col min-h-[350px]">
              {data?.simulation_type && data.simulation_type !== "none" && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest">
                      {data.simulation_type === "pendulum"
                        ? "LENGTH_MODIFIER"
                        : data.simulation_type === "spring"
                        ? "STIFFNESS_MODIFIER"
                        : "FORCE_MODIFIER"}{" "}
                      //
                    </label>
                    <span className="text-[#00ff41] text-xs font-bold">
                      {paramValue.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={paramValue}
                    onChange={(e) => setParamValue(parseFloat(e.target.value))}
                    className="w-full accent-[#00ff41] bg-[#333] appearance-none h-1"
                  />
                </div>
              )}
              <PendulumSim
                type={data?.simulation_type || "none"}
                paramValue={paramValue}
              />
            </div>
          </div>

          {/* Right Column (Unfolder & Graph) */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
            <EquationUnfolder data={data} />

            {/* Cross-reference to Sentinel */}
            {data && (
              <div
                className="border border-[#333] p-3"
                style={{ background: "#00ff4108", fontFamily: "monospace" }}
              >
                <div
                  className="text-xs font-bold pb-2 mb-2 border-b border-[#333] tracking-wider"
                  style={{ color: "#00ff41" }}
                >
                  CROSS_REFERENCE //
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    Send this equation to Sentinel as a claim
                  </span>
                  <button
                    onClick={handleVerifyInSentinel}
                    className="text-[10px] font-bold uppercase tracking-widest border border-[#00ff41] bg-black text-[#00ff41] px-3 py-1 hover:bg-[#00ff41] hover:text-black transition-all duration-150"
                  >
                    VERIFY IN SENTINEL →
                  </button>
                </div>
              </div>
            )}

            <MafsGraph
              config={data?.graph_config || null}
              paramValue={paramValue}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
