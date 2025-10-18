import { Search, Menu, Moon, Sun, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "./ThemeProvider";
import { Link } from "wouter";
import { useState } from "react";
import logoImage from "@assets/logo.png";
import { MarketTicker } from "@/components/MarketTicker";
import { prefetchRoute } from "@/lib/prefetch";

export function Navigation() {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="w-full border-b bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex h-20 items-center justify-between gap-4">
            <div className="flex items-center gap-8 h-full">
              <Link href="/" className="flex items-center justify-center h-full" data-testid="link-home">
                <img src={logoImage} alt="EntryLab" className="h-16 w-auto object-contain" />
              </Link>
              <nav className="hidden md:flex items-center gap-6 mt-5">
                <Link
                  href="/top-cfd-brokers"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  data-testid="link-top-cfd-brokers"
                  onMouseEnter={() => prefetchRoute('/top-cfd-brokers')}
                >
                  Top CFD Brokers
                </Link>
                <Link
                  href="/best-verified-propfirms"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  data-testid="link-best-prop-firms"
                  onMouseEnter={() => prefetchRoute('/best-verified-propfirms')}
                >
                  Best Prop Firms
                </Link>
                <Link
                  href="/news"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  data-testid="link-news"
                  onMouseEnter={() => prefetchRoute('/news')}
                >
                  <Newspaper className="h-4 w-4 text-emerald-500" />
                  News
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4 mt-2.5 md:mt-0">
              <div className="hidden lg:flex items-center relative">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  className="pl-9 w-64"
                  data-testid="input-search"
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                data-testid="button-menu-toggle"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 space-y-2">
              <Link
                href="/top-cfd-brokers"
                className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                data-testid="link-mobile-top-cfd-brokers"
                onTouchStart={() => prefetchRoute('/top-cfd-brokers')}
              >
                Top CFD Brokers
              </Link>
              <Link
                href="/best-verified-propfirms"
                className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                data-testid="link-mobile-best-prop-firms"
                onTouchStart={() => prefetchRoute('/best-verified-propfirms')}
              >
                Best Prop Firms
              </Link>
              <Link
                href="/news"
                className="block py-2 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                data-testid="link-mobile-news"
                onTouchStart={() => prefetchRoute('/news')}
              >
                <Newspaper className="h-4 w-4 text-emerald-500" />
                News
              </Link>
            </nav>
          )}
        </div>
      </header>
      <MarketTicker />
    </>
  );
}
