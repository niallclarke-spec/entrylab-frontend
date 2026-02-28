import { Clock, User, ArrowRight, TrendingUp, BarChart3, ShieldCheck } from "lucide-react";
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

  const calculateReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const cleanExcerpt = stripHtml(excerpt);
  const cleanTitle = stripHtml(title);
  const readingTime = calculateReadingTime(cleanExcerpt);
  const truncatedExcerpt =
    cleanExcerpt.length > 180 ? cleanExcerpt.substring(0, 180) + "…" : cleanExcerpt;

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#1a1e1c" }}
    >
      {/* Background orbs — same as signals page */}
      <div className="signals-bg-orb signals-bg-orb-1" />
      <div className="signals-bg-orb signals-bg-orb-2" />
      <div className="signals-bg-orb signals-bg-orb-3" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        <div className="grid lg:grid-cols-[55%_45%] gap-10 items-center">

          {/* Left — text */}
          <div className="space-y-6 order-2 lg:order-1">

            {/* Category pill */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{
                background: "rgba(43,179,42,0.18)",
                border: "1px solid rgba(43,179,42,0.35)",
                color: "#2bb32a",
              }}
              data-testid="badge-category"
            >
              {category}
            </div>

            {/* Heading */}
            <h1
              className="text-3xl md:text-5xl lg:text-[3.25rem] font-bold text-white leading-tight tracking-tight line-clamp-3"
              data-testid="text-hero-title"
            >
              {cleanTitle}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "#adb2b1" }}>
              <div className="flex items-center gap-1.5" data-testid="text-author">
                <User className="h-4 w-4" />
                <span>{author}</span>
              </div>
              <div className="flex items-center gap-1.5" data-testid="text-reading-time">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min read</span>
              </div>
              <div
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: "rgba(43,179,42,0.12)",
                  color: "#2bb32a",
                  border: "1px solid rgba(43,179,42,0.25)",
                }}
                data-testid="badge-premium"
              >
                <ShieldCheck className="h-3 w-3" />
                Verified Source
              </div>
            </div>

            {/* Excerpt */}
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: "#adb2b1" }}
              data-testid="text-hero-excerpt"
            >
              {truncatedExcerpt}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6">
              {[
                { icon: TrendingUp, label: "Market", sub: "Analysis" },
                { icon: BarChart3, label: "Expert", sub: "Insights" },
                { icon: ShieldCheck, label: "Verified", sub: "Data" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={sub} className="flex items-center gap-2.5">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(43,179,42,0.12)",
                      border: "1px solid rgba(43,179,42,0.2)",
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "#2bb32a" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "#6b7a74" }}>{label}</div>
                    <div className="text-sm font-semibold text-white">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="pt-2">
              <Link
                href={link}
                className="signals-btn-primary inline-flex"
                data-testid="button-read-article"
              >
                Read Full Article <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right — featured image */}
          {imageUrl && (
            <div className="relative order-1 lg:order-2">
              {/* Decorative rings behind image — like signals visual */}
              <div
                className="absolute w-[420px] h-[420px] rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ border: "1px solid rgba(43,179,42,0.1)" }}
              />
              <div
                className="absolute w-[520px] h-[520px] rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ border: "1px solid rgba(43,179,42,0.05)" }}
              />

              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid rgba(43,179,42,0.25)",
                  boxShadow: "0 0 60px rgba(43,179,42,0.12), 0 24px 48px rgba(0,0,0,0.4)",
                }}
              >
                <div className="aspect-[16/10]">
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
                {/* Subtle dark gradient at bottom */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1/3"
                  style={{
                    background: "linear-gradient(to top, rgba(26,30,28,0.5) 0%, transparent 100%)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
