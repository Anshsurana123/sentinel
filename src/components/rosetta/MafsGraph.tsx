"use client";

import React, { useMemo } from "react";
import { Mafs, Coordinates, Plot, useMovablePoint, Theme } from "mafs";
import { RosettaGraphConfig } from "./types";

interface Props {
  config: RosettaGraphConfig | null;
  paramValue: number; // Linked to the slider (e.g. amplitude)
}

export default function MafsGraph({ config, paramValue }: Props) {
  const point = useMovablePoint([0, 0], {
    constrain: "horizontal",
    color: "#ffffff"
  });

  const fn = useMemo(() => {
    if (!config?.equation_js) return (x: number) => 0;
    
    try {
      // Provide x, t (as alias for x), and amplitude/length (from paramValue)
      // to cover most generated formulas.
      return new Function(
        "x",
        "t",
        "amplitude",
        "length",
        `
        try {
          return ${config.equation_js};
        } catch(e) {
          return 0;
        }
        `
      ) as (x: number, t: number, amplitude: number, length: number) => number;
    } catch (e) {
      console.error("Failed to parse equation_js", e);
      return (x: number) => 0;
    }
  }, [config?.equation_js]);

  const yValue = config ? fn(point.x, point.x, paramValue, paramValue) : 0;

  if (!config) {
    return (
      <div className="border border-[#333] p-6 h-64 flex items-center justify-center text-gray-600 font-mono">
        <span className="opacity-50">GRAPH_UNAVAILABLE //</span>
      </div>
    );
  }

  return (
    <div className="border border-[#333] p-6 bg-black flex flex-col gap-4 font-mono">
      <div className="flex justify-between items-end">
        <div className="text-[#00ff41] text-xs font-bold uppercase tracking-widest">
          INTERACTIVE GRAPH // {config.type.replace(/_/g, " ")}
        </div>
        <div className="text-xs text-gray-400">
          x: {point.x.toFixed(2)} | y: {yValue.toFixed(2)}
        </div>
      </div>

      <div className="w-full h-[300px] border border-[#333] relative bg-[#0a0a0a]">
        <Mafs
          viewBox={{ x: [-5, 5], y: [-5, 5] }}
          preserveAspectRatio="contain"
        >
          <Coordinates.Cartesian
            xAxis={{ lines: 1, labels: (n) => (n % 2 === 0 ? String(n) : "") }}
            yAxis={{ lines: 1, labels: (n) => (n % 2 === 0 ? String(n) : "") }}
            subdivisions={5}
          />
          <Plot.OfX
            y={(x) => fn(x, x, paramValue, paramValue)}
            color="#00ff41"
            weight={2}
          />
          {point.element}
        </Mafs>

        {/* Axis Labels */}
        <div className="absolute bottom-2 right-2 text-[10px] text-gray-500 bg-black/50 px-1">
          {config.x_label}
        </div>
        <div className="absolute top-2 left-2 text-[10px] text-gray-500 bg-black/50 px-1 rotate-90 origin-top-left translate-x-4">
          {config.y_label}
        </div>
      </div>
    </div>
  );
}
