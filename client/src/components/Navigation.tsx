import { Search, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "./ThemeProvider";
import { Link } from "wouter";
import { useState } from "react";

export function Navigation() {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = ["Forex", "Brokers", "Prop Firms", "Analysis", "Education"];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-foreground" data-testid="link-home">
              EntryLab
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/archive"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-archive"
              >
                Archive
              </Link>
              {categories.map((cat) => (
                <a
                  key={cat}
                  href={`#${cat.toLowerCase()}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`link-category-${cat.toLowerCase()}`}
                >
                  {cat}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
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
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-menu-toggle"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link
              href="/archive"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              data-testid="link-mobile-archive"
            >
              Archive
            </Link>
            {categories.map((cat) => (
              <a
                key={cat}
                href={`#${cat.toLowerCase()}`}
                className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                data-testid={`link-mobile-${cat.toLowerCase()}`}
              >
                {cat}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
