import { Search, Menu, X, TrendingUp, Newspaper, Shield, Zap, GitCompare, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { prefetchRoute } from "@/lib/prefetch";

const navLinks = [
  { href: "/top-cfd-brokers", label: "Top CFD Brokers", testId: "link-top-cfd-brokers", icon: Shield },
  { href: "/best-verified-propfirms", label: "Best Prop Firms", testId: "link-best-prop-firms", icon: TrendingUp },
  { href: "/news", label: "News", testId: "link-news", icon: Newspaper },
];

const compareDropdownLinks = [
  { href: "/compare", label: "All Comparisons", testId: "link-compare-tool" },
  { href: "/compare/broker", label: "Broker vs Broker", testId: "link-compare-brokers" },
  { href: "/compare/prop-firm", label: "Prop Firm vs Prop Firm", testId: "link-compare-prop-firms" },
];

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [location] = useLocation();

  const isCompareActive = location.startsWith("/compare");

  return (
    <>
      <header
        className="w-full sticky top-0 z-50"
        style={{
          background: "rgba(26, 30, 28, 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(43, 179, 42, 0.15)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-18 items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3" data-testid="link-home">
                <div className="w-8 h-8 bg-[#2bb32a] rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">EntryLab</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map(({ href, label, testId }) => {
                  const isActive = location === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      data-testid={testId}
                      onMouseEnter={() => prefetchRoute(href)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "text-[#2bb32a] bg-[#2bb32a]/10"
                          : "text-[#adb2b1] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}

                {/* Compare dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setCompareOpen(true)}
                  onMouseLeave={() => setCompareOpen(false)}
                >
                  <Link
                    href="/compare"
                    data-testid="link-compare"
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isCompareActive
                        ? "text-[#2bb32a] bg-[#2bb32a]/10"
                        : "text-[#adb2b1] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <GitCompare className="h-4 w-4" />
                    Compare
                    <ChevronDown className={`h-3 w-3 transition-transform ${compareOpen ? "rotate-180" : ""}`} />
                  </Link>

                  {/* Dropdown — visibility toggled (no layout shift) */}
                  <div
                    className="absolute left-0 top-full pt-1"
                    style={{ visibility: compareOpen ? "visible" : "hidden" }}
                  >
                    <div className="w-52 rounded-xl border border-white/10 bg-[#1a1e1c] shadow-xl overflow-hidden py-1">
                      {compareDropdownLinks.map(({ href, label, testId }) => (
                        <Link
                          key={href}
                          href={href}
                          data-testid={testId}
                          onMouseEnter={() => prefetchRoute(href)}
                          onClick={() => setCompareOpen(false)}
                          className={`block px-4 py-2.5 text-sm transition-colors ${
                            location === href
                              ? "text-[#2bb32a] bg-[#2bb32a]/10"
                              : "text-[#adb2b1] hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center relative">
                <Search className="absolute left-3 h-4 w-4 text-[#adb2b1]" />
                <input
                  type="search"
                  placeholder="Search articles..."
                  className="pl-9 pr-4 py-2 w-56 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-[#adb2b1] focus:outline-none focus:border-[#2bb32a]/50 focus:ring-1 focus:ring-[#2bb32a]/30 transition-colors"
                  data-testid="input-search"
                />
              </div>

              <Link
                href="/signals"
                data-testid="link-signals-cta"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all"
                style={{ background: "#2bb32a" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#239122")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#2bb32a")}
              >
                <Zap className="h-4 w-4" />
                Free Signals
              </Link>

              <button
                className="md:hidden p-2 rounded-lg text-[#adb2b1] hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                data-testid="button-menu-toggle"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            className="md:hidden border-t px-4 pb-4 space-y-1"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "#1a1e1c" }}
          >
            {navLinks.map(({ href, label, testId, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                data-testid={`link-mobile-${testId.replace("link-", "")}`}
                onTouchStart={() => prefetchRoute(href)}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 px-3 rounded-lg text-sm text-[#adb2b1] hover:text-white hover:bg-white/5 transition-colors"
              >
                <Icon className="h-4 w-4 text-[#2bb32a]" />
                {label}
              </Link>
            ))}

            {/* Compare section in mobile menu */}
            <div className="py-2 px-3">
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                <GitCompare className="h-3 w-3" /> Compare
              </p>
              {compareDropdownLinks.map(({ href, label, testId }) => (
                <Link
                  key={href}
                  href={href}
                  data-testid={`link-mobile-${testId.replace("link-", "")}`}
                  onTouchStart={() => prefetchRoute(href)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center py-2.5 pl-4 text-sm text-[#adb2b1] hover:text-white transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>

            <Link
              href="/signals"
              data-testid="link-mobile-signals"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 py-3 px-3 rounded-lg text-sm font-semibold text-[#2bb32a]"
            >
              <Zap className="h-4 w-4" />
              Free Signals
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
