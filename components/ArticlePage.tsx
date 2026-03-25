import { db } from "@/lib/db";
import { articlesTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, User, ArrowLeft } from "lucide-react";
import { stripHtml, formatDate, SITE_URL } from "@/lib/utils";
import { getArticleUrl } from "@/lib/articles";

export async function getArticle(slug: string) {
  const [article] = await db.select().from(articlesTable)
    .where(and(eq(articlesTable.slug, slug), eq(articlesTable.status, "published")));
  return article || null;
}

export function ArticlePageContent({ article, backHref, backLabel }: {
  article: NonNullable<Awaited<ReturnType<typeof getArticle>>>;
  backHref: string;
  backLabel: string;
}) {
  const readingTime = Math.ceil(stripHtml(article.content || "").split(/\s+/).length / 230);
  const canonicalUrl = getArticleUrl(article);

  // If article belongs to a broker/prop firm, redirect should happen at the route level
  const structuredData = {
    "@context": "https://schema.org",
    "@type": article.category?.includes("news") ? "NewsArticle" : "Article",
    headline: stripHtml(article.title),
    description: article.seoDescription || stripHtml(article.excerpt || ""),
    image: article.featuredImage || `${SITE_URL}/assets/entrylab-logo-green.png`,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt?.toISOString(),
    author: {
      "@type": article.author?.toLowerCase().includes("team") ? "Organization" : "Person",
      name: article.author || "EntryLab Editorial Team",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "EntryLab",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/entrylab-logo-green.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${canonicalUrl}` },
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: backLabel, item: `${SITE_URL}${backHref}` },
      { "@type": "ListItem", position: 3, name: stripHtml(article.title), item: `${SITE_URL}${canonicalUrl}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />

      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <nav className="text-sm mb-4 flex items-center gap-2 text-[#adb2b1]">
            <Link href={backHref} className="hover:text-white">{backLabel}</Link>
            <span>/</span>
            <span className="text-white truncate">{stripHtml(article.title)}</span>
          </nav>
          {article.featuredImage && (
            <img src={article.featuredImage} alt={stripHtml(article.title)} className="w-full h-48 md:h-64 object-cover rounded-xl mb-6" />
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{stripHtml(article.title)}</h1>
          <div className="flex items-center gap-4 text-sm text-[#adb2b1]">
            <span className="flex items-center gap-1"><User className="h-4 w-4" /> {article.author || "EntryLab"}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {formatDate(article.publishedAt)}</span>
            <span>{readingTime} min read</span>
          </div>
        </div>
      </section>

      <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <article
            className="rounded-xl p-6 md:p-10 prose max-w-none"
            style={{ background: "#fff", border: "1px solid #e8edea" }}
            dangerouslySetInnerHTML={{ __html: article.content || "" }}
          />
          <div className="mt-8">
            <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-80" style={{ color: "#2bb32a" }}>
              <ArrowLeft className="h-4 w-4" /> Back to {backLabel}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
