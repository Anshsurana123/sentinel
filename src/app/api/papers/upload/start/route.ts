import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/papers/upload/start
 *
 * Starts a resumable upload session with the Gemini File API.
 * Returns an upload URL that the client can safely POST to directly, bypassing Vercel limits.
 */
export async function POST(req: NextRequest) {
  try {
    const { title, size, mimeType } = await req.json();

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY is not set");

    const startRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": size.toString(),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { displayName: title } }),
    });

    if (!startRes.ok) {
      const err = await startRes.text();
      console.error("[upload/start] Gemini Error:", err);
      return NextResponse.json({ error: "Failed to start Gemini upload session" }, { status: 502 });
    }

    const uploadUrlStr = startRes.headers.get("x-goog-upload-url");
    if (!uploadUrlStr) {
      return NextResponse.json({ error: "No upload URL returned" }, { status: 500 });
    }

    // Strip the API Key from the URL so the client doesn't see it
    const urlObj = new URL(uploadUrlStr);
    urlObj.searchParams.delete("key");

    return NextResponse.json({ uploadUrl: urlObj.toString() });
  } catch (err) {
    console.error("[upload/start]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
