"use client";

import React, { useState, useMemo } from "react";
import { Mafs, Coordinates, Plot, MovablePoint } from "mafs";
import "mafs/core.css";
import { RosettaGraphConfig } from "./types";

interface Props {
  config: RosettaGraphConfig | null;
  paramValue: number;
}

export default function MafsGraph({ config, paramValue }: Props) {
  const [point, setPoint] = useState<[number, number]>([0, 0]);

  const evaluate = useMemo(() => {
    if (!config?.equation_js) {
      return (_x: number, _param: number) => 0;
    }
    return (x: number, param: number) => {
      try {
        const fn = new Function(
          "x", "t", "amplitude", "length", "Math",
          `try { return ${config.equation_js}; } catch(e) { return 0; }`
        ) as (x: number, t: number, amplitude: number, length: number, math: Math) => number;
        const result = fn(x, x, param, param, Math);
        return isFinite(result) && !isNaN(result) ? result : 0;
      } catch {
        return 0;
      }
    };
  }, [config?.equation_js]);

  if (!config) {
    return (
      <div style={{
        border: "1px solid #333", padding: "24px", height: "300px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "monospace", color: "#666", background: "#000",
      }}>
        <span style={{ opacity: 0.5 }}>GRAPH_UNAVAILABLE //</span>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #333", padding: "12px", background: "#000", fontFamily: "monospace" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ color: "#00ff41", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.15em" }}>
          INTERACTIVE_GRAPH // {config.type.replace(/_/g, " ")}
        </div>
        <div style={{ color: "#666", fontSize: "11px" }}>
          x: {point[0].toFixed(2)} | y: {evaluate(point[0], paramValue).toFixed(2)}
        </div>
      </div>

      <div style={{ width: "100%", height: "300px", border: "1px solid #1a1a1a", background: "#0a0a0a" }}>
        <Mafs
          viewBox={{ x: [-5, 5], y: [-3, 3] }}
          preserveAspectRatio={false}
        >
          <Coordinates.Cartesian
            xAxis={{ lines: 1, labels: (n) => (n % 2 === 0 ? String(n) : "") }}
            yAxis={{ lines: 1, labels: (n) => (n % 2 === 0 ? String(n) : "") }}
            subdivisions={5}
          />
          <Plot.OfX
            y={(x) => evaluate(x, paramValue)}
            color="#00ff41"
            weight={2}
          />
          <MovablePoint
            point={point}
            onMove={([x, y]) => {
              const clampedX = Math.max(-4.8, Math.min(4.8, x));
              setPoint([clampedX, y]);
            }}
            color="white"
          />
        </Mafs>
      </div>

      <div style={{ color: "#444", fontSize: "10px", marginTop: "4px", textAlign: "right" }}>
        {config.x_label} → {config.y_label}
      </div>
    </div>
  );
}
