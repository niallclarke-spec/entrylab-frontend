import Link from "next/link";
import { Zap, TrendingUp, Shield, Bell, Users, Check } from "lucide-react";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Free XAU/USD Trading Signals | EntryLab",
  description: "Get free gold (XAU/USD) trading signals delivered to your Telegram. Professional analysis, real-time entries, and risk management included.",
  openGraph: { title: "Free XAU/USD Trading Signals", url: `${SITE_URL}/signals` },
  alternates: { canonical: `${SITE_URL}/signals` },
};

export default function SignalsPage() {
  return (
    <>
      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a" }}>
            <Zap className="h-3 w-3" /> Trading Signals
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Free XAU/USD Trading Signals
          </h1>
          <p className="text-lg text-[#adb2b1] max-w-2xl mx-auto mb-10">
            Professional gold trading signals delivered straight to your Telegram. Real-time entries, take profit levels, and stop losses included.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://t.me/entrylabs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "#2bb32a" }}
            >
              <Zap className="h-5 w-5" /> Join Free Channel
            </a>
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              Go Premium
            </Link>
          </div>
        </div>
      </section>

      <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "#111827" }}>What You Get</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Real-Time Signals", desc: "Entry, TP, and SL levels sent as they happen. No delays." },
              { icon: Shield, title: "Risk Management", desc: "Every signal includes position sizing guidance and risk/reward ratios." },
              { icon: Bell, title: "Telegram Delivery", desc: "Instant notifications on your phone. Never miss a setup." },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
                <feature.icon className="h-8 w-8 mb-4" style={{ color: "#2bb32a" }} />
                <h3 className="font-semibold mb-2" style={{ color: "#111827" }}>{feature.title}</h3>
                <p className="text-sm" style={{ color: "#6b7280" }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "#fff" }} className="px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#111827" }}>Free vs Premium</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl p-6 text-left" style={{ background: "#f8faf8", border: "1px solid #e8edea" }}>
              <h3 className="font-semibold text-lg mb-4" style={{ color: "#111827" }}>Free</h3>
              <ul className="space-y-3">
                {["XAU/USD signals", "Entry & exit levels", "Community chat"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "#374151" }}>
                    <Check className="h-4 w-4" style={{ color: "#2bb32a" }} /> {item}
                  </li>
                ))}
              </ul>
              <a href="https://t.me/entrylabs" target="_blank" rel="noopener noreferrer"
                className="mt-6 block w-full text-center px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a" }}>
                Join Free
              </a>
            </div>
            <div className="rounded-xl p-6 text-left" style={{ background: "#fff", border: "2px solid #2bb32a" }}>
              <h3 className="font-semibold text-lg mb-4" style={{ color: "#111827" }}>Premium</h3>
              <ul className="space-y-3">
                {["Everything in Free", "Priority signals", "VIP Telegram group", "Weekly market analysis", "1-on-1 support"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "#374151" }}>
                    <Check className="h-4 w-4" style={{ color: "#2bb32a" }} /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/subscribe"
                className="mt-6 block w-full text-center px-4 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "#2bb32a" }}>
                Subscribe Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
