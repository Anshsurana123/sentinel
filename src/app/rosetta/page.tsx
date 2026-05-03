"use client";

import React, { useState } from "react";
import "mafs/core.css"; // Required for Mafs to render correctly
import EquationInput from "@/components/rosetta/EquationInput";
import EquationUnfolder from "@/components/rosetta/EquationUnfolder";
import MafsGraph from "@/components/rosetta/MafsGraph";
import PendulumSim from "@/components/rosetta/PendulumSim";
import { ParsedRosettaResponse } from "@/components/rosetta/types";

export default function RosettaPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ParsedRosettaResponse | null>(null);
  const [paramValue, setParamValue] = useState<number>(5);

  const handleParse = async (equation: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/rosetta/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equation }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const parsedData = await res.json();
      setData(parsedData);
      // Reset param value to a reasonable default based on sim type
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
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono p-4 md:p-8 selection:bg-[#00ff41] selection:text-black">
      <div className="max-w-7xl mx-auto space-y-6">
        
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
            <EquationInput onParse={handleParse} loading={loading} error={error} />
            
            <div className="flex-1 flex flex-col min-h-[350px]">
              {data?.simulation_type && data.simulation_type !== "none" && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest">
                      {data.simulation_type === "pendulum" ? "LENGTH_MODIFIER" : 
                       data.simulation_type === "spring" ? "STIFFNESS_MODIFIER" : 
                       "FORCE_MODIFIER"} //
                    </label>
                    <span className="text-[#00ff41] text-xs font-bold">{paramValue.toFixed(1)}</span>
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
            <MafsGraph config={data?.graph_config || null} paramValue={paramValue} />
          </div>
        </div>

      </div>
    </div>
  );
}
