"use client";

import { useTransition } from "react";
import { deleteTask } from "@/app/actions";

/**
 * Brutalist Client Component for dismissing tasks.
 * Uses useTransition to handle the server action state without blocking UI.
 */
export default function DismissButton({ taskId }: { taskId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDismiss = () => {
    // High-impact confirmation for archive actions
    if (confirm("ARCHIVE SIGNAL: Confirm permanent removal from timeline?")) {
      startTransition(async () => {
        try {
          await deleteTask(taskId);
        } catch (err) {
          alert("CRITICAL ERROR: Archive failed.");
        }
      });
    }
  };

  return (
    <button
      onClick={handleDismiss}
      disabled={isPending}
      className={`
        px-2 py-1 text-[9px] font-bold border tracking-widest transition-all duration-200
        ${isPending 
          ? "opacity-30 cursor-not-allowed border-gray-500 text-gray-500" 
          : "border-current hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black uppercase"
        }
      `}
    >
      {isPending ? "DELETING..." : "[ DISMISS ]"}
    </button>
  );
}
