import { db } from "@/lib/db";
import { articlesTable, brokersTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, User, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { stripHtml, formatDate, SITE_URL, currentYear } from "@/lib/utils";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string; articleSlug: string }> };

async function getArticle(articleSlug: string) {
  const [article] = await db.select().from(articlesTable)
    .where(and(eq(articlesTable.slug, articleSlug), eq(articlesTable.status, "published")));
  return article || null;
}

async function getBroker(slug: string) {
  const [broker] = await db.select({ name: brokersTable.name, slug: brokersTable.slug, logoUrl: brokersTable.logoUrl })
    .from(brokersTable).where(eq(brokersTable.slug, slug));
  return broker || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, articleSlug } = await params;
  const article = await getArticle(articleSlug);
  if (!article) return { title: "Article Not Found" };

  const title = article.seoTitle || `${stripHtml(article.title)} | EntryLab`;
  const description = article.seoDescription || stripHtml(article.excerpt || "").substring(0, 160);
  const url = `${SITE_URL}/brokers/${slug}/${articleSlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      ...(article.featuredImage && { images: [{ url: article.featuredImage }] }),
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt?.toISOString(),
      section: article.category || undefined,
      authors: [article.author || "EntryLab"],
    },
    twitter: { title, description, creator: "@entrylabio" },
    alternates: { canonical: url },
  };
}

export default async function BrokerArticlePage({ params }: Props) {
  const { slug, articleSlug } = await params;
  const [article, broker] = await Promise.all([
    getArticle(articleSlug),
    getBroker(slug),
  ]);

  if (!article) notFound();

  const brokerName = broker?.name || slug;
  const readingTime = Math.ceil(stripHtml(article.content || "").split(/\s+/).length / 230);

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
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/brokers/${slug}/${articleSlug}` },
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Brokers", item: `${SITE_URL}/brokers` },
      { "@type": "ListItem", position: 3, name: brokerName, item: `${SITE_URL}/brokers/${slug}` },
      { "@type": "ListItem", position: 4, name: stripHtml(article.title), item: `${SITE_URL}/brokers/${slug}/${articleSlug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />

      {/* Hero */}
      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <nav className="text-sm mb-4 flex items-center gap-2 text-[#adb2b1]">
            <Link href="/brokers" className="hover:text-white">Brokers</Link>
            <span>/</span>
            <Link href={`/brokers/${slug}`} className="hover:text-white">{brokerName}</Link>
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

      {/* Content */}
      <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <article
            className="rounded-xl p-6 md:p-10 prose max-w-none"
            style={{ background: "#fff", border: "1px solid #e8edea" }}
            dangerouslySetInnerHTML={{ __html: article.content || "" }}
          />

          {/* Back to broker */}
          <div className="mt-8">
            <Link
              href={`/brokers/${slug}`}
              className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-80"
              style={{ color: "#2bb32a" }}
            >
              <ArrowLeft className="h-4 w-4" /> Back to {brokerName} Review
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
