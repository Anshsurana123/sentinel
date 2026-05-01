"use client";

import { useTransition } from "react";
import { toggleStudyMode } from "@/app/actions";

/**
 * Brutalist Focus Toggle
 * Triggers a global state change that impacts Discord bot behavior.
 */
export default function FocusToggle({ active }: { active: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => toggleStudyMode())}
      disabled={isPending}
      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] border-2 transition-all duration-300 ${
        active 
          ? "bg-red-600 text-white border-red-600 animate-pulse" 
          : "bg-black text-white border-white hover:bg-white hover:text-black"
      }`}
    >
      {isPending ? "SYNCING..." : active ? "STUDY_MODE: ON 🛡️" : "STUDY_MODE: OFF"}
    </button>
  );
}
