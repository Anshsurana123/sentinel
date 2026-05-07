"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/auth");
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        background: "transparent",
        border: "1px solid #222",
        color: "#444",
        fontFamily: "monospace",
        fontSize: "11px",
        padding: "4px 10px",
        cursor: "pointer",
        letterSpacing: "1px",
      }}
    >
      SIGN OUT
    </button>
  );
}
