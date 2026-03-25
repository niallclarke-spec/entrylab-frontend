import { TrendingUp, Shield, Zap } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "#f5f7f6", borderTop: "1px solid #e8edea" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-8 h-8 bg-[#2bb32a] rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight" style={{ color: "#1a1e1c" }}>
                EntryLab
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: "#6b7280" }}>
              Independent forex broker reviews, prop firm evaluations, and XAU/USD trading signals for traders
              worldwide.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a
                href="https://t.me/entrylabs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join us on Telegram"
                className="text-[#9ca3af] hover:text-[#2bb32a] transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#1a1e1c" }}>
              <Shield className="h-4 w-4 text-[#2bb32a]" />
              Reviews
            </h4>
            <Link href="/brokers" className="text-sm hover:text-[#2bb32a] transition-colors" style={{ color: "#6b7280" }}>
              Broker Reviews
            </Link>
            <Link href="/prop-firms" className="text-sm hover:text-[#2bb32a] transition-colors" style={{ color: "#6b7280" }}>
              Prop Firm Reviews
            </Link>
            <Link href="/news" className="text-sm hover:text-[#2bb32a] transition-colors" style={{ color: "#6b7280" }}>
              Latest News
            </Link>
            <Link href="/compare" className="text-sm hover:text-[#2bb32a] transition-colors" style={{ color: "#6b7280" }}>
              Compare
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#1a1e1c" }}>
              <Zap className="h-4 w-4 text-[#2bb32a]" />
              Signals
            </h4>
            <Link href="/signals" className="text-sm hover:text-[#2bb32a] transition-colors" style={{ color: "#6b7280" }}>
              Free Channel
            </Link>
            <Link href="/subscribe" className="text-sm hover:text-[#2bb32a] transition-colors" style={{ color: "#6b7280" }}>
              Premium Signals
            </Link>
            <Link href="/dashboard" className="text-sm hover:text-[#2bb32a] transition-colors" style={{ color: "#6b7280" }}>
              My Subscription
            </Link>
          </div>
        </div>

        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          <p className="text-sm" style={{ color: "#9ca3af" }}>
            &copy; {year} EntryLab. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs hover:text-[#2bb32a] transition-colors" style={{ color: "#9ca3af" }}>
              Terms &amp; Conditions
            </Link>
            <span className="text-xs" style={{ color: "#9ca3af" }}>
              Trading involves risk.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
