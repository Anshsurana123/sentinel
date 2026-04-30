import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

/**
 * The Anti-Portal: High-Contrast Task Feed
 * Overwriting boilerplate with the Sentinel core UI.
 */
export default async function AntiPortalPage() {
  const tasks = await prisma.universalTask.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-12">
        
        {/* Header Section */}
        <header className="border-b-2 border-white pb-8">
          <h1 className="text-4xl font-bold uppercase tracking-tighter italic">The Sentinel</h1>
          <p className="text-gray-500 mt-2 text-[10px] uppercase tracking-widest">
            Anti-Portal Feed // Active Intelligence Blocks: {tasks.length}
          </p>
        </header>

        {/* Task Timeline */}
        <section className="space-y-8">
          {tasks.map((task) => {
            const metadata = task.metadata as any;
            const isHigh = task.priority === "HIGH" || task.priority === "CRITICAL";
            const isLow = task.priority === "LOW";

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

                  {/* Semantic Metadata Footer */}
                  <footer className="pt-4 border-t border-current flex justify-between items-end opacity-60 text-[9px] uppercase tracking-[0.2em]">
                    <div>
                      <span className="font-bold">SUB:</span> {metadata?.subject || "GENERAL"}
                    </div>
                    <div className="text-right">
                      <span className="font-bold">CONFIDENCE:</span> {(metadata?.confidence * 100 || 0).toFixed(0)}%
                    </div>
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
