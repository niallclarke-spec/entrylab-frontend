import Link from "next/link";
import { Clock, User } from "lucide-react";
import { formatDate, stripHtml } from "@/lib/utils";
import { getArticleUrl } from "@/lib/articles";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  author: string | null;
  featuredImage: string | null;
  publishedAt: Date | null;
  relatedBroker: string | null;
  relatedPropFirm: string | null;
};

export function ArticleList({ articles, showCategory = true }: { articles: Article[]; showCategory?: boolean }) {
  if (articles.length === 0) {
    return <p className="text-center py-12" style={{ color: "#6b7280" }}>No articles found.</p>;
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {articles.map((article) => {
        const url = getArticleUrl(article);
        const categoryLabel = article.category?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Article";

        return (
          <Link
            key={article.id}
            href={url}
            className="rounded-xl overflow-hidden transition-all hover:shadow-md"
            style={{ background: "#fff", border: "1px solid #e8edea" }}
          >
            {article.featuredImage && (
              <img src={article.featuredImage} alt={stripHtml(article.title)} className="w-full h-40 object-cover" />
            )}
            <div className="p-5">
              {showCategory && (
                <p className="text-xs font-medium mb-2" style={{ color: "#2bb32a" }}>{categoryLabel}</p>
              )}
              <h3 className="font-semibold mb-2 line-clamp-2" style={{ color: "#111827" }}>
                {stripHtml(article.title)}
              </h3>
              {article.excerpt && (
                <p className="text-sm line-clamp-2 mb-3" style={{ color: "#6b7280" }}>
                  {stripHtml(article.excerpt).substring(0, 120)}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs" style={{ color: "#9ca3af" }}>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {article.author || "EntryLab"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatDate(article.publishedAt)}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
