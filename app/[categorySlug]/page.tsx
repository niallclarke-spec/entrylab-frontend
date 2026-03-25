import { db } from "@/lib/db";
import { categoriesTable, brokerCategoriesTable, propFirmCategoriesTable, brokersTable, propFirmsTable } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Shield, TrendingUp, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { SITE_URL, currentYear } from "@/lib/utils";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ categorySlug: string }> };

// Known static routes that should NOT be caught by this dynamic route
const RESERVED_SLUGS = [
  "brokers", "prop-firms", "compare", "news", "learn", "blog",
  "signals", "subscribe", "dashboard", "terms", "admin",
  "api", "favicon.svg", "feed.xml", "sitemap.xml", "robots.txt",
];

async function getCategoryByUrlSlug(urlSlug: string) {
  // Look up category where the slug matches the URL
  // Categories use url_slug for flat SEO URLs (e.g., "best-ecn-brokers")
  // Fall back to regular slug field for backwards compatibility
  const cats = await db.select().from(categoriesTable);
  return cats.find((c) => c.slug === urlSlug) || null;
}

async function getCategoryEntities(category: { id: string; type: string }) {
  if (category.type === "broker") {
    const rows = await db
      .select({ broker: brokersTable })
      .from(brokerCategoriesTable)
      .innerJoin(brokersTable, eq(brokerCategoriesTable.brokerId, brokersTable.id))
      .where(eq(brokerCategoriesTable.categoryId, category.id));
    return { brokers: rows.map((r) => r.broker), propFirms: [] };
  }
  if (category.type === "prop_firm") {
    const rows = await db
      .select({ firm: propFirmsTable })
      .from(propFirmCategoriesTable)
      .innerJoin(propFirmsTable, eq(propFirmCategoriesTable.propFirmId, propFirmsTable.id))
      .where(eq(propFirmCategoriesTable.categoryId, category.id));
    return { brokers: [], propFirms: rows.map((r) => r.firm) };
  }
  return { brokers: [], propFirms: [] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  if (RESERVED_SLUGS.includes(categorySlug)) return {};

  const category = await getCategoryByUrlSlug(categorySlug);
  if (!category) return { title: "Page Not Found" };

  const year = currentYear();
  const title = `${category.name} ${year} | EntryLab`;
  const description = category.description || `Discover the ${category.name.toLowerCase()} ${year}. Independently reviewed and compared.`;

  return {
    title, description,
    openGraph: { title, description, url: `${SITE_URL}/${categorySlug}` },
    alternates: { canonical: `${SITE_URL}/${categorySlug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  if (RESERVED_SLUGS.includes(categorySlug)) notFound();

  const category = await getCategoryByUrlSlug(categorySlug);
  if (!category) notFound();

  const { brokers, propFirms } = await getCategoryEntities(category);
  const entities = category.type === "broker" ? brokers : propFirms;
  const entityPath = category.type === "broker" ? "brokers" : "prop-firms";
  const Icon = category.type === "broker" ? Shield : TrendingUp;

  return (
    <>
      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-14">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a" }}>
            <Icon className="h-3 w-3" /> {category.type === "broker" ? "Broker Category" : "Prop Firm Category"}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{category.name} {currentYear()}</h1>
          {category.description && (
            <p className="text-[#adb2b1] max-w-xl">{category.description}</p>
          )}
        </div>
      </section>

      <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {entities.length > 0 ? (
            <div className="grid gap-4">
              {entities.map((entity: any, i: number) => (
                <Link
                  key={entity.id}
                  href={`/${entityPath}/${entity.slug}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl p-5 transition-all hover:shadow-md"
                  style={{ background: "#fff", border: "1px solid #e8edea" }}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-sm font-medium w-8 text-center" style={{ color: "#9ca3af" }}>#{i + 1}</span>
                    {entity.logoUrl ? (
                      <img src={entity.logoUrl} alt={`${entity.name} logo`} className="w-12 h-12 rounded-lg object-contain" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#f0f0f0] flex items-center justify-center text-xs font-bold" style={{ color: "#999" }}>
                        {entity.name.substring(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="font-semibold truncate" style={{ color: "#111827" }}>{entity.name}</h2>
                      <p className="text-xs truncate" style={{ color: "#6b7280" }}>{entity.regulation || entity.challengeTypes || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 font-semibold text-sm" style={{ color: "#2bb32a" }}>
                      <Star className="h-4 w-4 fill-current" />
                      {Number(entity.rating || 0).toFixed(1)}
                    </div>
                    <ArrowRight className="h-4 w-4" style={{ color: "#9ca3af" }} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center py-12" style={{ color: "#6b7280" }}>
              No {category.type === "broker" ? "brokers" : "prop firms"} in this category yet.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
