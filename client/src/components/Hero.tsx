import { Clock, User, ArrowRight, BookOpen, TrendingUp, BarChart3, Building2, Award, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { OptimizedImage } from "@/components/OptimizedImage";

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

  // Calculate reading time (average 200 words per minute)
  const calculateReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return minutes;
  };

  const cleanExcerpt = stripHtml(excerpt);
  const cleanTitle = stripHtml(title);
  const readingTime = calculateReadingTime(cleanExcerpt);
  const truncatedExcerpt = cleanExcerpt.length > 155 ? cleanExcerpt.substring(0, 155) + '...' : cleanExcerpt;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 border-b">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.2) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
      
      {/* Forex News Graphics */}
      <div className="absolute top-8 left-8 text-primary/10 hidden lg:block">
        <TrendingUp className="h-32 w-32" />
      </div>
      <div className="absolute bottom-8 right-8 text-primary/10 hidden lg:block">
        <BarChart3 className="h-32 w-32" />
      </div>
      <div className="absolute top-1/2 left-1/4 text-primary/5 hidden xl:block">
        <Building2 className="h-24 w-24" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid lg:grid-cols-[55%_45%] gap-8 items-center">
          {/* Article Info (55% desktop, full width mobile - shows second on mobile) */}
          <div className="space-y-6 text-white order-2 lg:order-1">
            {/* Category Badge */}
            <Badge className="bg-primary/20 text-purple-300 border-primary/30 hover:bg-primary/30 backdrop-blur-sm" data-testid="badge-category">
              <BookOpen className="h-3 w-3 mr-1.5" />
              {category}
            </Badge>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight" data-testid="text-hero-title">
              {cleanTitle}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
              <div className="flex items-center gap-2" data-testid="text-author">
                <User className="h-4 w-4" />
                <span>{author}</span>
              </div>
              <div className="flex items-center gap-2" data-testid="text-reading-time">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="gap-1 bg-emerald-500/20 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/30" data-testid="badge-premium">
                  <Award className="h-3 w-3" />
                  Premium Analysis
                </Badge>
              </div>
            </div>

            {/* Article Description */}
            <p className="text-lg text-white/80 leading-relaxed max-w-2xl" data-testid="text-hero-excerpt">
              {truncatedExcerpt}
            </p>

            {/* Forex News Icons Row */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs text-white/70">Market</div>
                  <div className="text-sm font-semibold">Analysis</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-white/70">Expert</div>
                  <div className="text-sm font-semibold">Insights</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs text-white/70">Verified</div>
                  <div className="text-sm font-semibold">Source</div>
                </div>
              </div>
            </div>

            {/* Read Article Button */}
            <div className="pt-2">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90" data-testid="button-read-article">
                <Link href={link}>
                  Read Full Article <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Featured Image (45% desktop - shows first on mobile) */}
          {imageUrl && (
            <div className="relative lg:ml-auto w-full lg:w-auto order-1 lg:order-2">
              <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-primary/30 bg-card">
                <div className="relative aspect-[16/9] md:aspect-[16/10] bg-muted">
                  <OptimizedImage
                    src={imageUrl}
                    alt={cleanTitle}
                    width="900"
                    height="500"
                    className="w-full h-full object-cover"
                    priority={true}
                    data-testid="img-hero-featured"
                  />
                </div>
              </div>
              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-primary/20 rounded-xl blur-2xl -z-10" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
