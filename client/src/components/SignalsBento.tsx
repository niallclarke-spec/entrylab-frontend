import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { TrendingUp, Bell, Users, ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { SiTelegram } from "react-icons/si";

const cellStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "14px",
  padding: "24px",
};

const statAccent = {
  color: "#4ade80",
};

export function SignalsBento() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-12"
      style={{
        background: "#1a1e1c",
        boxShadow: "0 0 0 1px rgba(43,179,42,0.10), 0 24px 60px rgba(0,0,0,0.18)",
      }}
      data-testid="section-signals-bento"
    >
      {/* Ambient green glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "300px",
          background: "radial-gradient(ellipse at center, rgba(43,179,42,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="relative z-10 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* Cell 1 — Main CTA (col-span 2) */}
          <div
            className="md:col-span-2 flex flex-col justify-between"
            style={{ ...cellStyle, padding: "28px 32px" }}
          >
            <div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
                style={{ background: "rgba(43,179,42,0.12)", color: "#6ee870", border: "1px solid rgba(43,179,42,0.22)" }}
              >
                <Zap className="h-3 w-3" />
                EntryLab Signals
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight" style={{ color: "#f9fafb" }}>
                Trade Gold smarter with<br className="hidden sm:block" /> verified XAU/USD signals
              </h2>
              <p className="text-sm mb-6" style={{ color: "#9ca3af" }}>
                Institutional-grade analysis delivered to your Telegram the moment an opportunity opens.
              </p>
              <ul className="space-y-2.5 mb-8">
                {[
                  "87% verified win rate over 2,400+ signals",
                  "Instant Telegram alerts with entry, SL & TP",
                  "Risk-managed setups from professional analysts",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm" style={{ color: "#d1d5db" }}>
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "#4ade80" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/signals">
                <Button
                  size="lg"
                  data-testid="button-signals-bento-free"
                  style={{ background: "#2bb32a", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(43,179,42,0.25)" }}
                >
                  Get Free Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/subscribe">
                <Button
                  size="lg"
                  variant="outline"
                  data-testid="button-signals-bento-premium"
                  style={{ borderColor: "rgba(255,255,255,0.18)", color: "#f9fafb", background: "rgba(255,255,255,0.05)" }}
                >
                  Go Premium — $49/mo
                </Button>
              </Link>
            </div>
          </div>

          {/* Cell 2 — Win Rate stat */}
          <div
            className="flex flex-col justify-between"
            style={cellStyle}
            data-testid="card-bento-winrate"
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div style={{ width: 36, height: 36, borderRadius: "10px", background: "rgba(43,179,42,0.12)", border: "1px solid rgba(43,179,42,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp className="h-4.5 w-4.5" style={{ color: "#4ade80", width: 18, height: 18 }} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6b7280" }}>Win Rate</span>
              </div>
              <p className="text-6xl font-black leading-none mb-2" style={statAccent}>87%</p>
              <p className="text-sm" style={{ color: "#9ca3af" }}>90-day rolling average on XAU/USD, verified via MyFXBook</p>
            </div>
            <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs" style={{ color: "#6b7280" }}>2,400+ signals delivered</p>
            </div>
          </div>

          {/* Cell 3 — Live signal preview */}
          <div style={cellStyle} data-testid="card-bento-signal-preview">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#6b7280" }}>Latest Signal</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-bold" style={{ color: "#f9fafb" }}>XAU/USD</span>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(43,179,42,0.15)", color: "#4ade80", border: "1px solid rgba(43,179,42,0.25)" }}
              >
                BUY
              </span>
            </div>
            <div className="space-y-2">
              {[
                { label: "Entry", value: "2,045.50" },
                { label: "Stop Loss", value: "2,038.00" },
                { label: "Take Profit", value: "2,068.00" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: "#6b7280" }}>{label}</span>
                  <span className="font-mono font-semibold" style={{ color: "#d1d5db" }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-xs font-semibold" style={{ color: "#4ade80" }}>+$890 · Closed in profit</span>
            </div>
          </div>

          {/* Cell 4 — Telegram */}
          <div
            className="flex flex-col justify-between"
            style={cellStyle}
            data-testid="card-bento-telegram"
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div style={{ width: 36, height: 36, borderRadius: "10px", background: "rgba(43,179,42,0.12)", border: "1px solid rgba(43,179,42,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <SiTelegram style={{ color: "#4ade80", width: 18, height: 18 }} />
                </div>
                <Bell className="h-4 w-4" style={{ color: "#4ade80" }} />
              </div>
              <p className="text-base font-bold mb-1.5" style={{ color: "#f9fafb" }}>Instant alerts</p>
              <p className="text-sm" style={{ color: "#9ca3af" }}>Signals hit your Telegram the moment our analysts pull the trigger. Never miss an entry.</p>
            </div>
          </div>

          {/* Cell 5 — Traders stat */}
          <div
            className="flex flex-col justify-center"
            style={cellStyle}
            data-testid="card-bento-traders"
          >
            <div className="flex items-center gap-2 mb-3">
              <div style={{ width: 36, height: 36, borderRadius: "10px", background: "rgba(43,179,42,0.12)", border: "1px solid rgba(43,179,42,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users className="h-4 w-4" style={{ color: "#4ade80" }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6b7280" }}>Community</span>
            </div>
            <p className="text-4xl font-black" style={statAccent}>4.8k+</p>
            <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>Active traders following our signals daily</p>
          </div>

        </div>
      </div>
    </div>
  );
}
