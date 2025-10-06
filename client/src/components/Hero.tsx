import { Clock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingForexSymbols } from "./FloatingForexSymbols";
import { Link } from "wouter";

interface HeroProps {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  link: string;
}

export function Hero({ title, excerpt, author, date, category, link }: HeroProps) {
  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const cleanExcerpt = stripHtml(excerpt).slice(0, 200) + (stripHtml(excerpt).length > 200 ? "..." : "");
  const cleanTitle = stripHtml(title);

  return (
    <section className="relative bg-gradient-to-br from-primary/20 via-background to-chart-2/20 border-b overflow-hidden">
      <FloatingForexSymbols />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.15),transparent_50%)]"></div>
      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="max-w-4xl">
          <Badge variant="default" className="mb-6" data-testid="badge-category">
            {category}
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight" data-testid="text-hero-title">
            {cleanTitle}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed" data-testid="text-hero-excerpt">
            {cleanExcerpt}
          </p>
          <div className="flex flex-wrap items-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-author">
              <User className="h-4 w-4" />
              <span>{author}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-date">
              <Clock className="h-4 w-4" />
              <span>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
          <Button asChild size="lg" data-testid="button-read-article">
            <Link href={link}>
              Read Full Article <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
