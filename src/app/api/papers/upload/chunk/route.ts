import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/papers/upload/chunk
 *
 * Proxies file chunks to Gemini to bypass Vercel's 4.5MB payload limit and avoid CORS issues.
 */
export async function POST(req: NextRequest) {
  try {
    const uploadUrl = req.headers.get("x-upload-url");
    const offset = req.headers.get("x-upload-offset");
    const command = req.headers.get("x-upload-command");

    if (!uploadUrl || !offset || !command) {
      return NextResponse.json({ error: "Missing headers" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY is not set");

    // Reattach the API key to the Gemini URL
    const urlObj = new URL(uploadUrl);
    urlObj.searchParams.set("key", apiKey);

    // Read the chunk bytes
    const chunk = await req.arrayBuffer();

    // Proxy the chunk to Gemini
    const geminiRes = await fetch(urlObj.toString(), {
      method: "POST",
      headers: {
        "X-Goog-Upload-Command": command,
        "X-Goog-Upload-Offset": offset,
      },
      body: chunk,
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("[upload/chunk] Gemini Error:", err);
      return NextResponse.json({ error: "Gemini chunk upload failed" }, { status: geminiRes.status });
    }

    // If it's the final chunk, Gemini returns the file JSON
    if (command.includes("finalize")) {
      const data = await geminiRes.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[upload/chunk]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
