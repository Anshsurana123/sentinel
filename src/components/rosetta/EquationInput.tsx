"use client";

import React, { useState } from "react";

const PRESETS = [
  "F = ma",
  "E = mc²",
  "ω = √(g/L)",
  "F = -kx",
  "∇ × B = μ₀J"
];

interface Props {
  onParse: (equation: string) => void;
  loading: boolean;
  error: string | null;
}

export default function EquationInput({ onParse, loading, error }: Props) {
  const [equation, setEquation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (equation.trim() && !loading) {
      onParse(equation.trim());
    }
  };

  return (
    <div className="border border-[#333] p-6 bg-black flex flex-col gap-4 font-mono">
      <div className="text-[#00ff41] text-xs font-bold uppercase tracking-widest">
        INPUT PANEL //
      </div>

      <form onSubmit={handleSubmit} className="flex gap-4 items-stretch">
        <input
          type="text"
          value={equation}
          onChange={(e) => setEquation(e.target.value)}
          placeholder="ENTER_EQUATION // e.g. F = ma"
          className="flex-1 bg-transparent border border-[#333] text-white p-3 outline-none focus:border-[#00ff41] transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !equation.trim()}
          className="bg-[#00ff41] text-black px-6 font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              PARSING_EQUATION<span className="animate-pulse">▋</span>
            </span>
          ) : (
            "PARSE >>"
          )}
        </button>
      </form>

      {error && (
        <div className="text-red-500 text-sm font-bold border border-red-500 p-2 bg-red-500/10">
          PARSE_ERROR // {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setEquation(preset);
              if (!loading) onParse(preset);
            }}
            disabled={loading}
            className="text-xs border border-[#333] px-3 py-1 text-gray-400 hover:text-[#00ff41] hover:border-[#00ff41] transition-colors"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
