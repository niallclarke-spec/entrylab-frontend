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
    cleanExcerpt.length > 160 ? cleanExcerpt.substring(0, 160) + "…" : cleanExcerpt;

  return (
    <section className="relative overflow-hidden bg-white border-b border-gray-100">
      {/* Subtle green accent stripe at top */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "#2bb32a" }} />

      {/* Very faint dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #2bb32a 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Faint green glow — top right corner */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(43,179,42,0.06) 0%, transparent 70%)",
          transform: "translate(20%, -20%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 lg:py-20">
        <div className="grid lg:grid-cols-[55%_45%] gap-10 items-center">
          {/* Left — text content */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Category badge — green on white */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ background: "#2bb32a" }}
              data-testid="badge-category"
            >
              {category}
            </div>

            {/* Title — dark charcoal */}
            <h1
              className="text-3xl md:text-5xl lg:text-[3.25rem] font-bold leading-tight text-gray-900"
              data-testid="text-hero-title"
            >
              {cleanTitle}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5" data-testid="text-author">
                <User className="h-4 w-4 text-gray-400" />
                <span>{author}</span>
              </div>
              <div className="flex items-center gap-1.5" data-testid="text-reading-time">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{readingTime} min read</span>
              </div>
              <div
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ background: "rgba(43,179,42,0.10)", color: "#1d8c1c" }}
                data-testid="badge-premium"
              >
                <ShieldCheck className="h-3 w-3" />
                Verified Source
              </div>
            </div>

            {/* Excerpt */}
            <p
              className="text-base md:text-lg text-gray-600 leading-relaxed"
              data-testid="text-hero-excerpt"
            >
              {truncatedExcerpt}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 py-1">
              {[
                { icon: TrendingUp, label: "Market", sub: "Analysis" },
                { icon: BarChart3, label: "Expert", sub: "Insights" },
                { icon: ShieldCheck, label: "Verified", sub: "Data" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={sub} className="flex items-center gap-2.5">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(43,179,42,0.10)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "#2bb32a" }} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">{label}</div>
                    <div className="text-sm font-semibold text-gray-800">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA — solid green */}
            <div className="pt-2 flex items-center gap-4">
              <Link
                href={link}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white text-sm transition-all"
                style={{ background: "#2bb32a" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#239122")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#2bb32a")}
                data-testid="button-read-article"
              >
                Read Full Article <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right — featured image */}
          {imageUrl && (
            <div className="relative order-1 lg:order-2">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
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
              </div>
              {/* Subtle green glow behind image */}
              <div
                className="absolute -inset-4 -z-10 rounded-2xl"
                style={{
                  background: "radial-gradient(circle, rgba(43,179,42,0.08) 0%, transparent 70%)",
                  filter: "blur(24px)",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
