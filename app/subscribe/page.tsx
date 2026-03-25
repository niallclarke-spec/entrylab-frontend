"use client";

import { useState } from "react";
import { Zap, Check } from "lucide-react";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a" }}>
            <Zap className="h-3 w-3" /> Premium Signals
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Upgrade to Premium Signals
          </h1>
          <p className="text-lg text-[#adb2b1] max-w-2xl mx-auto mb-10">
            Get priority XAU/USD signals, VIP Telegram access, weekly analysis, and 1-on-1 support.
          </p>
        </div>
      </section>

      <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-16">
        <div className="max-w-lg mx-auto">
          <div className="rounded-xl p-8" style={{ background: "#fff", border: "2px solid #2bb32a" }}>
            <div className="text-center mb-6">
              <p className="text-4xl font-bold" style={{ color: "#111827" }}>$29<span className="text-lg font-normal" style={{ color: "#6b7280" }}>/month</span></p>
              <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Cancel anytime</p>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                "Priority XAU/USD trading signals",
                "VIP Telegram group access",
                "Weekly market analysis reports",
                "1-on-1 support via Telegram",
                "Early access to new features",
                "Community of serious traders",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm" style={{ color: "#374151" }}>
                  <Check className="h-4 w-4 flex-shrink-0" style={{ color: "#2bb32a" }} />
                  {feature}
                </li>
              ))}
            </ul>

            <form onSubmit={handleSubscribe} className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#2bb32a]/30 focus:border-[#2bb32a]"
                style={{ borderColor: "#e8edea" }}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#2bb32a" }}
              >
                {loading ? "Processing..." : "Subscribe Now"}
              </button>
            </form>

            <p className="text-xs text-center mt-4" style={{ color: "#9ca3af" }}>
              Secure payment via Stripe. Cancel anytime from your dashboard.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
