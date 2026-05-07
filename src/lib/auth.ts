import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function requireUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user || error) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        ),
      };
    }

    return { user, errorResponse: null };
  } catch (err) {
    console.error("[auth] requireUser failed:", err);
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
}
