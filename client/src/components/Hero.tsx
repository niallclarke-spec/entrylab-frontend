import { Clock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface HeroProps {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  link: string;
  imageUrl?: string;
}

export function Hero({ title, excerpt, author, date, category, link, imageUrl }: HeroProps) {
  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const cleanExcerpt = stripHtml(excerpt).slice(0, 200) + (stripHtml(excerpt).length > 200 ? "..." : "");
  const cleanTitle = stripHtml(title);

  return (
    <section className="relative bg-gradient-to-br from-primary/20 via-background to-emerald-500/10 border-b overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.15),transparent_50%)]"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="order-2 lg:order-1">
            <Badge className="mb-4 md:mb-6 bg-emerald-600 hover:bg-emerald-700 text-white border-0" data-testid="badge-category">
              {category}
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6 leading-tight" data-testid="text-hero-title">
              {cleanTitle}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed" data-testid="text-hero-excerpt">
              {cleanExcerpt}
            </p>
            <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground" data-testid="text-author">
                <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>{author}</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground" data-testid="text-date">
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
            <Button asChild size="lg" data-testid="button-read-article">
              <Link href={link}>
                Read Full Article <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Featured Image */}
          {imageUrl && (
            <div className="relative h-[200px] sm:h-[250px] lg:h-[350px] rounded-xl lg:rounded-2xl overflow-hidden shadow-xl order-1 lg:order-2">
              <img
                src={imageUrl}
                alt={cleanTitle}
                width="600"
                height="350"
                fetchPriority="high"
                className="w-full h-full object-cover"
                data-testid="img-hero-featured"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent"></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
