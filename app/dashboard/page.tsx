"use client";

import { useState, useEffect } from "react";
import { Zap, ExternalLink, AlertCircle, Check, Loader2 } from "lucide-react";
import Link from "next/link";

type SubscriptionData = {
  status: string;
  planType: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  telegramInviteLink: string | null;
  email: string;
};

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState("");

  const checkSubscription = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/subscription-status?email=${encodeURIComponent(email)}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setError(json.error || "Subscription not found");
      }
    } catch {
      setError("Failed to check subscription status");
    } finally {
      setLoading(false);
    }
  };

  const isActive = data?.status === "active" || data?.status === "trialing";

  return (
    <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-16">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#111827" }}>My Subscription</h1>
        <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Check your premium signals subscription status.</p>

        {!data ? (
          <div className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
            <form onSubmit={checkSubscription} className="space-y-4">
              <label className="block text-sm font-medium" style={{ color: "#374151" }}>Email address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#2bb32a]/30"
                style={{ borderColor: "#e8edea" }}
              />
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#2bb32a" }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Check Status"}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold" style={{ color: "#111827" }}>Subscription Status</h2>
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{
                    background: isActive ? "rgba(43,179,42,0.1)" : "rgba(220,38,38,0.1)",
                    color: isActive ? "#2bb32a" : "#dc2626",
                  }}
                >
                  {isActive ? "Active" : data.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "#6b7280" }}>Email</span>
                  <span style={{ color: "#111827" }}>{data.email}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#6b7280" }}>Plan</span>
                  <span style={{ color: "#111827" }}>{data.planType || "Premium"}</span>
                </div>
                {data.currentPeriodEnd && (
                  <div className="flex justify-between">
                    <span style={{ color: "#6b7280" }}>{data.cancelAtPeriodEnd ? "Expires" : "Renews"}</span>
                    <span style={{ color: "#111827" }}>{new Date(data.currentPeriodEnd).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {data.telegramInviteLink && isActive && (
              <a
                href={data.telegramInviteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "#2bb32a" }}
              >
                <Zap className="h-4 w-4" /> Join VIP Telegram <ExternalLink className="h-4 w-4" />
              </a>
            )}

            {!isActive && (
              <Link
                href="/subscribe"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "#2bb32a" }}
              >
                Reactivate Subscription
              </Link>
            )}

            <button
              onClick={() => { setData(null); setEmail(""); }}
              className="w-full text-sm text-center py-2"
              style={{ color: "#6b7280" }}
            >
              Check a different email
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
