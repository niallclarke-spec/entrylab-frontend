import { db } from "@/lib/db";
import { articlesTable } from "@/lib/schema";
import { eq, and, desc, or } from "drizzle-orm";

// Map URL prefix to article category patterns
const categoryMap: Record<string, string[]> = {
  news: ["news", "broker-news", "prop-firm-news"],
  learn: ["broker-guides", "prop-firm-guides", "trading-tools"],
  blog: [], // catch-all for everything else
};

export async function getArticlesBySection(section: "news" | "learn" | "blog") {
  const categories = categoryMap[section];

  if (categories.length > 0) {
    // Match any of the categories
    const conditions = categories.map((cat) => eq(articlesTable.category, cat));
    return db
      .select()
      .from(articlesTable)
      .where(and(eq(articlesTable.status, "published"), or(...conditions)))
      .orderBy(desc(articlesTable.publishedAt))
      .limit(100);
  }

  // Blog = catch-all: articles not matching news or learn categories
  // AND not tied to a specific broker/prop firm (those live under /brokers/:slug/:article)
  const excludeCategories = [...categoryMap.news, ...categoryMap.learn];
  const allArticles = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.status, "published"))
    .orderBy(desc(articlesTable.publishedAt))
    .limit(200);

  return allArticles.filter(
    (a) => !excludeCategories.includes(a.category || "") && !a.relatedBroker && !a.relatedPropFirm
  );
}

export function getArticleUrl(article: { slug: string; relatedBroker: string | null; relatedPropFirm: string | null; category: string | null }) {
  if (article.relatedBroker) return `/brokers/${article.relatedBroker}/${article.slug}`;
  if (article.relatedPropFirm) return `/prop-firms/${article.relatedPropFirm}/${article.slug}`;

  const newsCategories = ["news", "broker-news", "prop-firm-news"];
  const learnCategories = ["broker-guides", "prop-firm-guides", "trading-tools"];

  if (newsCategories.includes(article.category || "")) return `/news/${article.slug}`;
  if (learnCategories.includes(article.category || "")) return `/learn/${article.slug}`;
  return `/blog/${article.slug}`;
}
