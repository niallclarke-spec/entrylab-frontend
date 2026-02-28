import { SiX, SiFacebook, SiLinkedin, SiYoutube, SiTelegram } from "react-icons/si";
import { TrendingUp, Shield, Zap } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/logo.png";

export function Footer() {
  return (
    <footer style={{ background: "#1a1e1c", borderTop: "1px solid rgba(43, 179, 42, 0.15)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="inline-flex items-center gap-3" data-testid="link-footer-home">
              <img src={logoImage} alt="EntryLab" className="h-14 w-auto" />
            </Link>
            <p className="text-sm text-[#adb2b1] leading-relaxed max-w-sm">
              Independent forex broker reviews, prop firm evaluations, and XAU/USD trading signals for traders worldwide.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a
                href="https://t.me/entrylabs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join us on Telegram"
                className="text-[#adb2b1] hover:text-[#229ED9] transition-colors"
                data-testid="link-telegram"
              >
                <SiTelegram className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Follow us on X" className="text-[#adb2b1] hover:text-white transition-colors" data-testid="link-twitter">
                <SiX className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Follow us on Facebook" className="text-[#adb2b1] hover:text-white transition-colors" data-testid="link-facebook">
                <SiFacebook className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Follow us on LinkedIn" className="text-[#adb2b1] hover:text-white transition-colors" data-testid="link-linkedin">
                <SiLinkedin className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Follow us on YouTube" className="text-[#adb2b1] hover:text-white transition-colors" data-testid="link-youtube">
                <SiYoutube className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#2bb32a]" />
              Reviews
            </h3>
            <Link href="/top-cfd-brokers" className="text-sm text-[#adb2b1] hover:text-[#2bb32a] transition-colors" data-testid="link-footer-all-brokers">
              CFD Brokers
            </Link>
            <Link href="/best-verified-propfirms" className="text-sm text-[#adb2b1] hover:text-[#2bb32a] transition-colors" data-testid="link-footer-all-prop-firms">
              Prop Firms
            </Link>
            <Link href="/news" className="text-sm text-[#adb2b1] hover:text-[#2bb32a] transition-colors" data-testid="link-footer-news">
              Latest News
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#2bb32a]" />
              Signals
            </h3>
            <Link href="/signals" className="text-sm text-[#adb2b1] hover:text-[#2bb32a] transition-colors" data-testid="link-footer-signals">
              Free Channel
            </Link>
            <Link href="/subscribe" className="text-sm text-[#adb2b1] hover:text-[#2bb32a] transition-colors" data-testid="link-footer-subscribe">
              Premium Signals
            </Link>
            <Link href="/dashboard" className="text-sm text-[#adb2b1] hover:text-[#2bb32a] transition-colors" data-testid="link-footer-dashboard">
              My Subscription
            </Link>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-sm text-[#6b7280]">
            &copy; {new Date().getFullYear()} EntryLab. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-[#6b7280] hover:text-[#adb2b1] transition-colors" data-testid="link-footer-terms">
              Terms & Conditions
            </Link>
            <span className="text-xs text-[#6b7280]">Trading involves risk.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
