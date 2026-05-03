import Link from "next/link";
import LineageEngine from "@/components/lineage/LineageEngine";

export const dynamic = "force-dynamic";

export default function LineagePage() {
  return (
    <main className="min-h-screen font-mono text-white bg-black selection:bg-white selection:text-black">
      {/* Top Bar */}
      <header className="border-b border-gray-800 px-6 md:px-12 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors"
        >
          ← SENTINEL FEED
        </Link>
        <h1 className="text-sm font-black uppercase tracking-[0.2em]">
          Lineage Engine
        </h1>
      </header>

      <LineageEngine />
    </main>
  );
}
