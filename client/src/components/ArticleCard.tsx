import { Clock, User, BookOpen, Wrench, Newspaper, BookMarked } from "lucide-react";
import { Link } from "wouter";
import { OptimizedImage } from "@/components/OptimizedImage";

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
    return { icon: Wrench, bg: "rgba(249,115,22,0.08)", color: "#c2410c", border: "rgba(249,115,22,0.18)" };

  if (lower.includes("news") || lower.includes("broker news") || lower.includes("prop firm news"))
    return { icon: Newspaper, bg: "rgba(43,179,42,0.08)", color: "#186818", border: "rgba(43,179,42,0.18)" };

  if (lower.includes("guide") || lower.includes("broker guide"))
    return { icon: BookMarked, bg: "rgba(59,130,246,0.08)", color: "#1d4ed8", border: "rgba(59,130,246,0.18)" };

  return { icon: Newspaper, bg: "rgba(107,114,128,0.07)", color: "#374151", border: "rgba(107,114,128,0.15)" };
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
        className="h-full flex flex-col rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer group"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.10)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        {/* Thumbnail */}
        {imageUrl && (
          <div className="relative w-full h-44 overflow-hidden bg-gray-100 flex-shrink-0">
            <OptimizedImage
              src={imageUrl}
              alt={title}
              width="400"
              height="176"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              data-testid="img-article-thumbnail"
            />
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col flex-1 p-5">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: bg, color, border: `1px solid ${border}` }}
              data-testid="badge-category"
            >
              <Icon className="h-3 w-3" />
              {category}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: "rgba(43,179,42,0.07)", color: "#186818", border: "1px solid rgba(43,179,42,0.15)" }}
              data-testid="badge-reading-time"
            >
              <BookOpen className="h-3 w-3" />
              {readingTime} min read
            </span>
          </div>

          {/* Title */}
          <h3
            className="text-base font-bold leading-snug line-clamp-2 mb-2 transition-colors"
            style={{ color: "#111827" }}
            data-testid="text-article-title"
          >
            {stripHtml(title)}
          </h3>

          {/* Excerpt */}
          <p className="text-sm line-clamp-2 flex-1 leading-relaxed text-gray-500" data-testid="text-article-excerpt">
            {truncatedExcerpt}
          </p>

          {/* Footer */}
          <div
            className="flex items-center gap-3 text-xs mt-4 pt-4"
            style={{ color: "#9ca3af", borderTop: "1px solid rgba(0,0,0,0.06)" }}
          >
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
