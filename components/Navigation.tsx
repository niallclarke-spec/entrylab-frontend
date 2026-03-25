"use client";

import { Search, Menu, X, TrendingUp, Newspaper, Shield, Zap, GitCompare, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/brokers", label: "Broker Reviews", testId: "link-brokers", icon: Shield },
  { href: "/prop-firms", label: "Prop Firm Reviews", testId: "link-prop-firms", icon: TrendingUp },
  { href: "/news", label: "News", testId: "link-news", icon: Newspaper },
];

const compareDropdownLinks = [
  { href: "/compare", label: "All Comparisons", testId: "link-compare-tool" },
  { href: "/compare?type=broker", label: "Broker vs Broker", testId: "link-compare-brokers" },
  { href: "/compare?type=prop-firm", label: "Prop Firm vs Prop Firm", testId: "link-compare-prop-firms" },
];

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const pathname = usePathname();

  const isCompareActive = pathname === "/compare" || pathname.startsWith("/compare/");

  return (
    <>
      <header
        className="w-full sticky top-0 z-50"
        style={{
          background: "rgba(26, 30, 28, 0.95)",
          backdropFilter: "blur(16px)",
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
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    data-testid={link.testId}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === link.href || pathname.startsWith(link.href + "/")
                        ? "text-white bg-white/10"
                        : "text-[#adb2b1] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

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
                        ? "text-white bg-white/10"
                        : "text-[#adb2b1] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <GitCompare className="h-4 w-4" />
                    Compare
                    <ChevronDown className={`h-3 w-3 transition-transform ${compareOpen ? "rotate-180" : ""}`} />
                  </Link>
                  <div
                    className="absolute left-0 top-full pt-1"
                    style={{ visibility: compareOpen ? "visible" : "hidden" }}
                  >
                    <div className="w-52 rounded-xl border border-white/10 bg-[#1a1e1c] shadow-xl overflow-hidden py-1">
                      {compareDropdownLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          data-testid={link.testId}
                          className="block px-4 py-2.5 text-sm transition-colors text-[#adb2b1] hover:text-white hover:bg-white/5"
                        >
                          {link.label}
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
              >
                <Zap className="h-4 w-4" />
                Free Signals
              </Link>
              <button
                className="md:hidden p-2 rounded-lg text-[#adb2b1] hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Open menu"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-menu-toggle"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[72px] z-40 bg-[#1a1e1c]/98 backdrop-blur-xl">
          <nav className="flex flex-col p-6 gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#adb2b1] hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-base font-medium">{link.label}</span>
                </Link>
              );
            })}
            <Link
              href="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#adb2b1] hover:text-white hover:bg-white/5 transition-colors"
            >
              <GitCompare className="h-5 w-5" />
              <span className="text-base font-medium">Compare</span>
            </Link>
            <Link
              href="/signals"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 mt-4 rounded-full text-white font-semibold justify-center"
              style={{ background: "#2bb32a" }}
            >
              <Zap className="h-5 w-5" />
              Free Signals
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
