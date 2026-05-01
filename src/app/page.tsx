import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { UniversalTask } from "@prisma/client"; // Added type import
import DismissButton from "@/components/DismissButton";
import FocusToggle from "@/components/FocusToggle";

export const dynamic = 'force-dynamic';

/**
 * The Anti-Portal: High-Contrast Task Feed
 * Integrated with Focus Mode and Task Dismissal.
 */
export default async function AntiPortalPage() {
  // Use a safe catch to prevent page crash if table doesn't exist yet
  const [tasks, settings] = await Promise.all([
    prisma.universalTask.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.globalSettings.findUnique({ where: { id: "singleton" } }).catch(() => null)
  ]);

  const isFocusMode = !!settings?.studyModeActive;

  return (
    <main className={`min-h-screen font-mono text-white selection:bg-white selection:text-black p-6 md:p-12 transition-colors duration-700 ${isFocusMode ? "bg-red-950/20" : "bg-black"}`}>
      <div className={`max-w-2xl mx-auto space-y-12 border-x-2 transition-all duration-700 ${isFocusMode ? "border-red-600 px-8" : "border-transparent"}`}>
        
        {/* Header Section */}
        <header className="flex justify-between items-end border-b-2 border-white pb-8">
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-tighter italic">The Sentinel</h1>
            <p className="text-gray-500 mt-2 text-[10px] uppercase tracking-widest">
              Anti-Portal Feed // Active Intelligence Blocks: {tasks.length}
            </p>
          </div>
          <FocusToggle active={isFocusMode} />
        </header>

        {/* Task Timeline */}
        <section className="space-y-8">
          {tasks.map((task: UniversalTask) => { // Explicitly typed
            const metadata = (task.metadata as any) || {};
            const isHigh = task.priority === "HIGH" || task.priority === "CRITICAL";
            const isLow = task.priority === "LOW";
            const confidence = typeof metadata.confidence === 'number' ? metadata.confidence : 0;

            return (
              <div 
                key={task.id}
                className={`group relative p-6 border-2 transition-all duration-300 rounded-none ${
                  isHigh ? "bg-white text-black border-white" : 
                  isLow ? "border-dashed border-gray-800 text-gray-500" : 
                  "border-white hover:bg-white hover:text-black"
                }`}
              >
                {/* Priority Indicator Label */}
                <div className={`absolute -top-3 left-4 px-2 text-[10px] font-bold uppercase border ${
                  isHigh ? "bg-black text-white border-black" : "bg-white text-black border-white"
                }`}>
                  {task.priority}
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h2 className="text-xl font-black leading-tight uppercase tracking-tight">
                      {task.title}
                    </h2>
                    <span className="text-[10px] whitespace-nowrap mt-1 opacity-60">
                      {format(new Date(task.createdAt), "HH:mm // dd.MM")}
                    </span>
                  </div>

                  {task.content && (
                    <p className="text-sm leading-relaxed opacity-90">
                      {task.content}
                    </p>
                  )}

                  {/* Semantic Metadata Footer + Actions */}
                  <footer className="pt-4 border-t border-current flex justify-between items-center opacity-60 text-[9px] uppercase tracking-[0.2em]">
                    <div className="flex gap-4">
                      <span><span className="font-bold">SUB:</span> {metadata.subject || "GENERAL"}</span>
                      <span><span className="font-bold">CONF:</span> {(confidence * 100).toFixed(0)}%</span>
                    </div>
                    
                    <DismissButton taskId={task.id} />
                  </footer>
                </div>

                {/* Source Tag */}
                <div className="absolute -bottom-3 right-4 px-2 bg-black text-white border border-white text-[8px] font-bold tracking-widest">
                  SRC_{task.source}
                </div>
              </div>
            );
          })}

          {tasks.length === 0 && (
            <div className="border-2 border-dashed border-gray-800 p-12 text-center text-gray-500 uppercase text-xs tracking-widest">
              Zero Active Signals Detected.
            </div>
          )}
        </section>

        {/* Footer Audit */}
        <footer className="pt-12 text-[9px] text-gray-800 uppercase tracking-[0.3em] text-center italic">
          Sentinel_Engine_V1.0 // Instance: https://sentinel-kuw8.onrender.com
        </footer>
      </div>
    </main>
  );
}
