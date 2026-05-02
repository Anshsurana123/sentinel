import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { UniversalTask } from "@prisma/client";
import DismissButton from "@/components/DismissButton";
import FocusToggle from "@/components/FocusToggle";
import WhatsAppConnector from "@/components/WhatsAppConnector";
import Link from "next/link";

export const dynamic = 'force-dynamic';

/**
 * The Anti-Portal: High-Contrast Task Feed
 * Enhanced with URL-driven category filtering and AI Context Notes.
 */
export default async function AntiPortalPage({ 
  searchParams 
}: { 
  searchParams: { tab?: string } 
}) {
  const activeTab = searchParams.tab || 'ALL';

  // Fetch data with safe catch
  const [tasks, settings] = await Promise.all([
    prisma.universalTask.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.globalSettings.findUnique({ where: { id: "singleton" } }).catch(() => null)
  ]);

  const isFocusMode = !!settings?.studyModeActive;

  // Implement Filter Logic
  const filteredTasks = tasks.filter((task) => {
    const metadata = (task.metadata as any) || {};
    if (activeTab === 'ALL') return true;
    if (activeTab === 'EMERGENCY') return task.priority === 'CRITICAL';
    return metadata.category === activeTab;
  });

  const TABS = ['ALL', 'STUDY', 'WORK', 'CHILL', 'EMERGENCY', 'OTHER'];

  return (
    <main className={`min-h-screen font-mono text-white selection:bg-white selection:text-black p-6 md:p-12 transition-colors duration-700 ${isFocusMode ? "bg-red-950/20" : "bg-black"}`}>
      <div className={`max-w-2xl mx-auto space-y-12 border-x-2 transition-all duration-700 ${isFocusMode ? "border-red-600 px-8" : "border-transparent"}`}>
        
        {/* Header Section */}
        <header className="flex justify-between items-end border-b-2 border-white pb-8">
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-tighter italic">The Sentinel</h1>
            <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-[0.4em]">
              Ingestion_Engine // Status: ACTIVE
            </p>
          </div>
          <FocusToggle active={isFocusMode} />
        </header>

        {/* Brutalist Filter Bar */}
        <nav className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Link
                key={tab}
                href={`/?tab=${tab}`}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all border border-white ${
                  isActive 
                    ? "bg-white text-black" 
                    : "bg-transparent text-white hover:bg-gray-800"
                }`}
              >
                {tab}
              </Link>
            );
          })}
        </nav>

        {/* Signal Feed */}
        <section className="space-y-16">
          {filteredTasks.map((task) => {
            const metadata = (task.metadata as any) || {};
            const confidence = metadata.confidence || 0;
            
            return (
              <div 
                key={task.id} 
                className="group relative border-l-4 border-white pl-8 py-2 hover:border-l-8 transition-all duration-300"
              >
                {/* Priority Indicator */}
                <div className={`absolute top-0 -left-[6px] w-2 h-8 ${
                  task.priority === 'CRITICAL' ? "bg-red-600 animate-pulse" : 
                  task.priority === 'HIGH' ? "bg-orange-500" : "bg-white"
                }`} />

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

                  {/* AI Quick Reference / Tutor Context */}
                  {metadata.quick_reference && (
                    <div className="p-3 bg-[#1a1a1a] border-l-2 border-white text-sm text-gray-300 leading-tight font-mono mt-2">
                      <span className="text-[8px] font-bold uppercase block mb-1 opacity-50 tracking-[0.2em]">>> CONTEXT</span>
                      { metadata.quick_reference }
                    </div>
                  )}

                  {/* Semantic Metadata Footer + Actions */}
                  <footer className="pt-4 border-t border-current flex justify-between items-center opacity-60 text-[9px] uppercase tracking-[0.2em]">
                    <div className="flex gap-4">
                      <span><span className="font-bold">SUB:</span> {metadata.subject || "GENERAL"}</span>
                      <span><span className="font-bold">CONF:</span> {(confidence * 100).toFixed(0)}%</span>
                      <span><span className="font-bold">CAT:</span> {metadata.category || "OTHER"}</span>
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

          {filteredTasks.length === 0 && (
            <div className="border-2 border-dashed border-gray-800 p-12 text-center text-gray-500 uppercase text-xs tracking-widest">
              Zero {activeTab} Signals Detected.
            </div>
          )}
        </section>

        {/* WhatsApp Connection Panel */}
        <WhatsAppConnector />

        {/* Footer Audit */}
        <footer className="pt-12 text-[9px] text-gray-800 uppercase tracking-[0.3em] text-center italic">
          Sentinel_Engine_V1.0 // Instance: https://sentinel-kuw8.onrender.com
        </footer>
      </div>
    </main>
  );
}
