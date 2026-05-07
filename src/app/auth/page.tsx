"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirectTo = searchParams.get("redirectTo") ?? "/";
  const redirectTo = rawRedirectTo.startsWith("/") ? rawRedirectTo : "/";

  async function handleEmailAuth() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              redirectTo
            )}`,
          },
        });

        if (error) throw error;
        setMessage("CHECK YOUR EMAIL FOR A CONFIRMATION LINK");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message?.toUpperCase() ?? "AUTH FAILED");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            redirectTo
          )}`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message?.toUpperCase() ?? "AUTH FAILED");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          border: "1px solid #00ff41",
          padding: "32px",
          background: "#050505",
        }}
      >
        <div
          style={{
            color: "#00ff41",
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "4px",
          }}
        >
          SENTINEL
        </div>
        <div
          style={{
            color: "#444",
            fontSize: "11px",
            marginBottom: "32px",
            letterSpacing: "2px",
          }}
        >
          ACADEMIC INTELLIGENCE SYSTEM
        </div>

        <div
          style={{ display: "flex", marginBottom: "24px", border: "1px solid #222" }}
        >
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
                setMessage(null);
              }}
              style={{
                flex: 1,
                padding: "8px",
                background: mode === m ? "#00ff41" : "transparent",
                color: mode === m ? "#000" : "#444",
                border: "none",
                fontFamily: "monospace",
                fontSize: "11px",
                fontWeight: "bold",
                cursor: "pointer",
                letterSpacing: "1px",
              }}
            >
              {m === "signin" ? "SIGN IN" : "SIGN UP"}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              color: "#444",
              fontSize: "10px",
              marginBottom: "4px",
              letterSpacing: "1px",
            }}
          >
            EMAIL
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            style={{
              width: "100%",
              background: "#0a0a0a",
              border: "1px solid #222",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: "13px",
              padding: "10px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              color: "#444",
              fontSize: "10px",
              marginBottom: "4px",
              letterSpacing: "1px",
            }}
          >
            PASSWORD
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
            style={{
              width: "100%",
              background: "#0a0a0a",
              border: "1px solid #222",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: "13px",
              padding: "10px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div
            style={{
              color: "#ff4444",
              fontSize: "11px",
              marginBottom: "12px",
              letterSpacing: "1px",
            }}
          >
            X {error}
          </div>
        )}
        {message && (
          <div
            style={{
              color: "#00ff41",
              fontSize: "11px",
              marginBottom: "12px",
              letterSpacing: "1px",
            }}
          >
            OK {message}
          </div>
        )}

        <button
          onClick={handleEmailAuth}
          disabled={loading || !email || !password}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#003300" : "#00ff41",
            color: "#000",
            border: "none",
            fontFamily: "monospace",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "2px",
            marginBottom: "12px",
          }}
        >
          {loading
            ? "AUTHENTICATING..."
            : mode === "signin"
            ? "SIGN IN ->"
            : "CREATE ACCOUNT ->"}
        </button>

        <div
          style={{
            color: "#222",
            fontSize: "10px",
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          -- OR --
        </div>

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "transparent",
            color: "#aaa",
            border: "1px solid #333",
            fontFamily: "monospace",
            fontSize: "12px",
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "2px",
          }}
        >
          CONTINUE WITH GOOGLE
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
