import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { C, font } from "@/lib/adminTheme";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/login", { password }),
    onSuccess: () => {
      navigate("/admin");
    },
    onError: (err: any) => {
      setError(
        err?.message?.includes("429")
          ? "Too many attempts. Try again in 15 minutes."
          : "Incorrect password."
      );
      setPassword("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: font,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{
        width: "100%",
        maxWidth: 360,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 36,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: C.accentDim,
            border: `1px solid ${C.accentBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Lock size={20} color={C.accent} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>Admin Access</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>EntryLab Review Aggregator</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 8, letterSpacing: "0.3px" }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              data-testid="input-password"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.bg,
                color: C.text,
                fontSize: 14,
                fontFamily: font,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.target.style.borderColor = C.accent; }}
              onBlur={(e) => { e.target.style.borderColor = C.border; }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: C.danger, marginBottom: 14 }} data-testid="text-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending || !password}
            data-testid="button-login"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "none",
              background: C.accent,
              color: C.bg,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: font,
              cursor: loginMutation.isPending || !password ? "not-allowed" : "pointer",
              opacity: loginMutation.isPending || !password ? 0.7 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
