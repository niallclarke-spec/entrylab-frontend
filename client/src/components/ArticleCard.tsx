import { Clock, User, BookOpen, Wrench, Newspaper, BookMarked } from "lucide-react";
import { Link } from "wouter";
import { OptimizedImage } from "@/components/OptimizedImage";
import { prefetchArticle } from "@/lib/prefetch";

interface ArticleCardProps {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  link: string;
  imageUrl?: string;
  slug: string;
}

const getCategoryStyle = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes("trading tool") || lower.includes("tools"))
    return { icon: Wrench, bg: "rgba(249,115,22,0.08)", color: "#92400e", border: "rgba(249,115,22,0.14)" };
  if (lower.includes("news") || lower.includes("broker news") || lower.includes("prop firm news"))
    return { icon: Newspaper, bg: "rgba(43,179,42,0.08)", color: "#14531a", border: "rgba(43,179,42,0.14)" };
  if (lower.includes("guide") || lower.includes("broker guide"))
    return { icon: BookMarked, bg: "rgba(59,130,246,0.08)", color: "#1e3a8a", border: "rgba(59,130,246,0.14)" };
  return { icon: Newspaper, bg: "rgba(255,255,255,0.25)", color: "#374151", border: "rgba(255,255,255,0.40)" };
};

export function ArticleCard({ title, excerpt, author, date, category, link, imageUrl, slug }: ArticleCardProps) {
  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const readingTime = Math.max(1, Math.ceil(stripHtml(excerpt).trim().split(/\s+/).length / 200));
  const cleanExcerpt = stripHtml(excerpt);
  const truncatedExcerpt = cleanExcerpt.length > 155 ? cleanExcerpt.substring(0, 155) + "…" : cleanExcerpt;
  const { icon: Icon, bg, color, border } = getCategoryStyle(category);

  return (
    <Link href={link} data-testid={`card-article-${title.substring(0, 20)}`}>
      <article
        className="h-full flex flex-col cursor-pointer group transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(16px) saturate(200%)",
          WebkitBackdropFilter: "blur(16px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.38)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.65)",
          borderRadius: "20px",
          overflow: "hidden",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.20)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.13), inset 0 1px 0 rgba(255,255,255,0.7)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
          prefetchArticle(slug);
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.65)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        {imageUrl && (
          <div className="relative w-full h-44 flex-shrink-0" style={{ overflow: "hidden" }}>
            <OptimizedImage
              src={imageUrl}
              alt={title}
              width="400"
              height="176"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              data-testid="img-article-thumbnail"
            />
            {/* glass tint over image */}
            <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        )}

        <div className="flex flex-col flex-1 p-5">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: bg, color, border: `1px solid ${border}` }}
              data-testid="badge-category"
            >
              <Icon className="h-3 w-3" />
              {category}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(43,179,42,0.08)", color: "#14531a", border: "1px solid rgba(43,179,42,0.14)" }}
              data-testid="badge-reading-time"
            >
              <BookOpen className="h-3 w-3" />
              {readingTime} min read
            </span>
          </div>

          <h3 className="text-base font-bold leading-snug line-clamp-2 mb-2" style={{ color: "#111827" }} data-testid="text-article-title">
            {stripHtml(title)}
          </h3>

          <p className="text-sm line-clamp-2 flex-1 leading-relaxed" style={{ color: "#4b5563" }} data-testid="text-article-excerpt">
            {truncatedExcerpt}
          </p>

          <div className="flex items-center gap-3 text-xs mt-4 pt-4" style={{ color: "#6b7280", borderTop: "1px solid rgba(255,255,255,0.4)" }}>
            <div className="flex items-center gap-1.5" data-testid="text-author">
              <User className="h-3.5 w-3.5" />
              <span className="truncate">{author}</span>
            </div>
            <div className="flex items-center gap-1.5" data-testid="text-date">
              <Clock className="h-3.5 w-3.5" />
              <span>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
