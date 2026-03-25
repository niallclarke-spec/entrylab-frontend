import { db } from "@/lib/db";
import { brokersTable, propFirmsTable, articlesTable, comparisonsTable, categoriesTable } from "@/lib/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import type { MetadataRoute } from "next";

const SITE_URL = "https://entrylab.io";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [brokers, propFirms, articles, comparisons, categories] = await Promise.all([
    db.select({ slug: brokersTable.slug, lastUpdated: brokersTable.lastUpdated }).from(brokersTable),
    db.select({ slug: propFirmsTable.slug, lastUpdated: propFirmsTable.lastUpdated }).from(propFirmsTable),
    db.select({ slug: articlesTable.slug, updatedAt: articlesTable.updatedAt, category: articlesTable.category, relatedBroker: articlesTable.relatedBroker, relatedPropFirm: articlesTable.relatedPropFirm })
      .from(articlesTable).where(eq(articlesTable.status, "published")),
    db.select({ slug: comparisonsTable.slug, updatedAt: comparisonsTable.updatedAt })
      .from(comparisonsTable).where(inArray(comparisonsTable.status, ["published", "updated"])),
    db.select({ slug: categoriesTable.slug }).from(categoriesTable),
  ]);

  const newsCategories = ["news", "broker-news", "prop-firm-news"];
  const learnCategories = ["broker-guides", "prop-firm-guides", "trading-tools"];

  const entries: MetadataRoute.Sitemap = [
    // Static pages
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/brokers`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/prop-firms`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/news`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/learn`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/signals`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/subscribe`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },

    // Broker review pages
    ...brokers.map((b) => ({
      url: `${SITE_URL}/brokers/${b.slug}`,
      lastModified: b.lastUpdated || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),

    // Prop firm review pages
    ...propFirms.map((f) => ({
      url: `${SITE_URL}/prop-firms/${f.slug}`,
      lastModified: f.lastUpdated || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),

    // Comparison pages
    ...comparisons.map((c) => ({
      url: `${SITE_URL}/compare/${c.slug}`,
      lastModified: c.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),

    // Category pages
    ...categories.map((c) => ({
      url: `${SITE_URL}/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),

    // Article pages
    ...articles.map((a) => {
      let url: string;
      if (a.relatedBroker) {
        url = `${SITE_URL}/brokers/${a.relatedBroker}/${a.slug}`;
      } else if (a.relatedPropFirm) {
        url = `${SITE_URL}/prop-firms/${a.relatedPropFirm}/${a.slug}`;
      } else if (newsCategories.includes(a.category || "")) {
        url = `${SITE_URL}/news/${a.slug}`;
      } else if (learnCategories.includes(a.category || "")) {
        url = `${SITE_URL}/learn/${a.slug}`;
      } else {
        url = `${SITE_URL}/blog/${a.slug}`;
      }

      return {
        url,
        lastModified: a.updatedAt || new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      };
    }),
  ];

  return entries;
}
