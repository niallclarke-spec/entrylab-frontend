import { Clock, User, ArrowRight, TrendingUp, BarChart3, ShieldCheck, Zap } from "lucide-react";
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
  const truncatedExcerpt = cleanExcerpt.length > 160 ? cleanExcerpt.substring(0, 160) + "…" : cleanExcerpt;

  return (
    <section className="relative overflow-hidden" style={{ background: "#1a1e1c" }}>
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #2bb32a 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(43,179,42,0.18) 0%, transparent 65%)",
          filter: "blur(80px)",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 pointer-events-none"
        style={{
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(43,179,42,0.12) 0%, transparent 65%)",
          filter: "blur(80px)",
          transform: "translate(-30%, 30%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 lg:py-20">
        <div className="grid lg:grid-cols-[55%_45%] gap-10 items-center">
          <div className="space-y-6 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-[#2bb32a]"
              style={{ background: "rgba(43,179,42,0.12)", border: "1px solid rgba(43,179,42,0.25)" }}
              data-testid="badge-category"
            >
              <Zap className="h-3 w-3" />
              {category}
            </div>

            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight text-white"
              data-testid="text-hero-title"
            >
              {cleanTitle}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "#adb2b1" }}>
              <div className="flex items-center gap-2" data-testid="text-author">
                <User className="h-4 w-4" />
                <span>{author}</span>
              </div>
              <div className="flex items-center gap-2" data-testid="text-reading-time">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min read</span>
              </div>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: "rgba(43,179,42,0.12)", color: "#2bb32a", border: "1px solid rgba(43,179,42,0.2)" }}
                data-testid="badge-premium"
              >
                <ShieldCheck className="h-3 w-3" />
                Verified Source
              </div>
            </div>

            <p className="text-lg leading-relaxed" style={{ color: "#adb2b1" }} data-testid="text-hero-excerpt">
              {truncatedExcerpt}
            </p>

            <div className="flex flex-wrap gap-6 py-2">
              {[
                { icon: TrendingUp, label: "Market", sub: "Analysis" },
                { icon: BarChart3, label: "Expert", sub: "Insights" },
                { icon: ShieldCheck, label: "Verified", sub: "Data" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={sub} className="flex items-center gap-2.5">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(43,179,42,0.12)", border: "1px solid rgba(43,179,42,0.2)" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "#2bb32a" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "#6b7280" }}>{label}</div>
                    <div className="text-sm font-semibold text-white">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
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

          {imageUrl && (
            <div className="relative order-1 lg:order-2">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(43,179,42,0.25)", boxShadow: "0 0 60px rgba(43,179,42,0.1)" }}
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
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(26,30,28,0.6) 0%, transparent 50%)" }}
                />
              </div>
              <div
                className="absolute -inset-6 -z-10 rounded-2xl"
                style={{ background: "radial-gradient(circle, rgba(43,179,42,0.15) 0%, transparent 70%)", filter: "blur(20px)" }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
