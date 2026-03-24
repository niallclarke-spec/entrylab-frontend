import { SiX, SiFacebook, SiLinkedin, SiYoutube, SiTelegram } from "react-icons/si";
import { TrendingUp, Shield, Zap } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer style={{ background: "#f5f7f6", borderTop: "1px solid #e8edea" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="inline-flex items-center gap-3" data-testid="link-footer-home">
              <div className="w-8 h-8 bg-[#2bb32a] rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight" style={{ color: "#1a1e1c" }}>EntryLab</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: "#6b7280" }}>
              Independent forex broker reviews, prop firm evaluations, and XAU/USD trading signals for traders worldwide.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a
                href="https://t.me/entrylabs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join us on Telegram"
                className="text-[#9ca3af] hover:text-[#2bb32a] transition-colors"
                data-testid="link-telegram"
              >
                <SiTelegram className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Follow us on X" className="text-[#9ca3af] hover:text-[#2bb32a] transition-colors" data-testid="link-twitter">
                <SiX className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Follow us on Facebook" className="text-[#9ca3af] hover:text-[#2bb32a] transition-colors" data-testid="link-facebook">
                <SiFacebook className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Follow us on LinkedIn" className="text-[#9ca3af] hover:text-[#2bb32a] transition-colors" data-testid="link-linkedin">
                <SiLinkedin className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Follow us on YouTube" className="text-[#9ca3af] hover:text-[#2bb32a] transition-colors" data-testid="link-youtube">
                <SiYoutube className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#1a1e1c" }}>
              <Shield className="h-4 w-4 text-[#2bb32a]" />
              Reviews
            </h4>
            <Link href="/brokers/best-cfd" className="text-sm hover:text-[#2bb32a] transition-colors" style={{ color: "#6b7280" }} data-testid="link-footer-all-brokers">
              CFD Brokers
            </Link>
            <Link href="/prop-firms/best-verified" className="text-sm hover:text-[#2bb32a] transition-colors" style={{ color: "#6b7280" }} data-testid="link-footer-all-prop-firms">
              Prop Firms
            </Link>
            <Link href="/topics/news" className="text-sm hover:text-[#2bb32a] transition-colors" style={{ color: "#6b7280" }} data-testid="link-footer-news">
              Latest News
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#1a1e1c" }}>
              <Zap className="h-4 w-4 text-[#2bb32a]" />
              Signals
            </h4>
            <Link href="/signals" className="text-sm hover:text-[#2bb32a] transition-colors" style={{ color: "#6b7280" }} data-testid="link-footer-signals">
              Free Channel
            </Link>
            <Link href="/subscribe" className="text-sm hover:text-[#2bb32a] transition-colors" style={{ color: "#6b7280" }} data-testid="link-footer-subscribe">
              Premium Signals
            </Link>
            <Link href="/dashboard" className="text-sm hover:text-[#2bb32a] transition-colors" style={{ color: "#6b7280" }} data-testid="link-footer-dashboard">
              My Subscription
            </Link>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-sm" style={{ color: "#9ca3af" }}>
            &copy; {new Date().getFullYear()} EntryLab. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs hover:text-[#2bb32a] transition-colors" style={{ color: "#9ca3af" }} data-testid="link-footer-terms">
              Terms & Conditions
            </Link>
            <span className="text-xs" style={{ color: "#9ca3af" }}>Trading involves risk.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
