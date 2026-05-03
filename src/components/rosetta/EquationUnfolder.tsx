"use client";

import React from "react";
import { ParsedRosettaResponse } from "./types";
import { BlockLatex, InlineLatex } from "./LatexRenderer";

interface Props {
  data: ParsedRosettaResponse | null;
}

export default function EquationUnfolder({ data }: Props) {
  if (!data) {
    return (
      <div className="border border-[#333] p-6 h-full flex flex-col justify-center items-center text-gray-600 font-mono">
        <span className="opacity-50">WAITING_FOR_INPUT...</span>
      </div>
    );
  }

  return (
    <div className="border border-[#333] p-6 bg-black flex flex-col gap-8 font-mono animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-[#00ff41] text-xs font-bold uppercase tracking-widest">
        UNFOLDING PANEL //
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[#333] pb-8">
        <div className="flex-1 text-center space-y-2">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">PHYSICS_FORM</div>
          <div className="text-xl md:text-2xl text-white">
            <BlockLatex math={data.physics_form} />
          </div>
        </div>

        <div className="text-[#00ff41] font-bold tracking-widest shrink-0">
          ──────→
        </div>

        <div className="flex-1 text-center space-y-2">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">CALCULUS_FORM</div>
          <div className="text-xl md:text-2xl text-[#00ff41]">
            <BlockLatex math={data.calculus_form} />
          </div>
        </div>
      </div>

      <blockquote className="border-l-2 border-[#00ff41] pl-4 py-2 text-gray-300 italic text-sm">
        {data.plain_english}
      </blockquote>

      <div className="space-y-4">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">COMPONENT BREAKDOWN //</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#333] text-gray-400">
                <th className="py-2 px-4 font-normal">SYMBOL</th>
                <th className="py-2 px-4 font-normal">MEANING</th>
                <th className="py-2 px-4 font-normal">UNIT</th>
                <th className="py-2 px-4 font-normal">CALCULUS_ROLE</th>
              </tr>
            </thead>
            <tbody>
              {data.components.map((comp, idx) => (
                <tr key={idx} className="border-b border-[#333]/50 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-[#00ff41]">
                    <InlineLatex math={comp.symbol} />
                  </td>
                  <td className="py-3 px-4 text-white">{comp.meaning}</td>
                  <td className="py-3 px-4 text-gray-400">{comp.unit}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{comp.calculus_role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
