import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { TrendingUp, Bell, CheckCircle2, ArrowRight } from "lucide-react";

const highlights = [
  { icon: TrendingUp, text: "87% verified win rate" },
  { icon: Bell, text: "Instant Telegram alerts" },
  { icon: CheckCircle2, text: "4,800+ active traders" },
];

export function SignalsBento() {
  return (
    <div
      className="rounded-xl px-6 py-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
      data-testid="banner-signals-cta"
    >
      {/* Left — label + headline */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#2bb32a" }}>
          EntryLab Signals
        </p>
        <p className="text-base font-bold leading-snug mb-3" style={{ color: "#111827" }}>
          Trade XAU/USD with verified, analyst-backed signals
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {highlights.map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 text-sm" style={{ color: "#374151" }}>
              <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#2bb32a" }} />
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Right — CTA */}
      <div className="flex-shrink-0">
        <Link href="/signals">
          <Button
            size="default"
            data-testid="button-signals-banner-cta"
            style={{ background: "#2bb32a", color: "#fff", border: "none" }}
          >
            Get Free Access
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
