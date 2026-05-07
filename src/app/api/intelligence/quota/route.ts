import { NextResponse } from "next/server";
import { getTavilyCallCount } from "@/lib/tavilyQuota";

export async function GET() {
  return NextResponse.json({ calls: getTavilyCallCount() });
}
