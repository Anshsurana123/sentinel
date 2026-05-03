"use client";

import React from "react";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

export function InlineLatex({ math }: { math: string }) {
  try {
    return <InlineMath math={math} />;
  } catch (error) {
    console.error("KaTeX error:", error);
    return <span className="text-red-500">{math}</span>;
  }
}

export function BlockLatex({ math }: { math: string }) {
  try {
    return <BlockMath math={math} />;
  } catch (error) {
    console.error("KaTeX error:", error);
    return <div className="text-red-500 p-2 border border-red-500 my-2">{math}</div>;
  }
}
