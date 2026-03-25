import { db } from "@/lib/db";
import { comparisonsTable, brokersTable, propFirmsTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GitCompare, Trophy, Star } from "lucide-react";
import type { Metadata } from "next";
import { stripHtml, SITE_URL, formatDate } from "@/lib/utils";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

async function getComparison(slug: string) {
  const [comp] = await db.select().from(comparisonsTable)
    .where(and(eq(comparisonsTable.slug, slug)));
  if (!comp || (comp.status !== "published" && comp.status !== "updated")) return null;
  return comp;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const comp = await getComparison(slug);
  if (!comp) return { title: "Comparison Not Found" };

  const title = `${comp.entityAName} vs ${comp.entityBName} Compared (${new Date().getFullYear()}) | EntryLab`;
  const description = `Detailed comparison of ${comp.entityAName} and ${comp.entityBName}. Fees, regulation, platforms, and trading conditions compared side-by-side.`;

  return {
    title, description,
    openGraph: { title, description, url: `${SITE_URL}/compare/${slug}` },
    alternates: { canonical: `${SITE_URL}/compare/${slug}` },
  };
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const comp = await getComparison(slug);
  if (!comp) notFound();

  // Fetch both entities
  const table = comp.entityType === "broker" ? brokersTable : propFirmsTable;
  const [entityA, entityB] = await Promise.all([
    db.select().from(table).where(eq(table.slug, comp.entityASlug)).then(r => r[0]),
    comp.entityBSlug ? db.select().from(table).where(eq(table.slug, comp.entityBSlug)).then(r => r[0]) : null,
  ]);

  const entityPath = comp.entityType === "broker" ? "brokers" : "prop-firms";
  const categoryWinners = (comp.categoryWinners as any[]) || [];
  const faqData = (comp.faqData as any[]) || [];
  const winnerName = comp.overallWinnerId === comp.entityAId ? comp.entityAName :
                     comp.overallWinnerId === comp.entityBId ? comp.entityBName : null;

  const structuredData = {
    "@context": "https://schema.org", "@type": "WebPage",
    name: `${comp.entityAName} vs ${comp.entityBName}`,
    description: `Comparison of ${comp.entityAName} and ${comp.entityBName}`,
    url: `${SITE_URL}/compare/${slug}`,
    publisher: { "@type": "Organization", name: "EntryLab", url: SITE_URL },
  };

  const breadcrumbData = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Compare", item: `${SITE_URL}/compare` },
      { "@type": "ListItem", position: 3, name: `${comp.entityAName} vs ${comp.entityBName}`, item: `${SITE_URL}/compare/${slug}` },
    ],
  };

  const faqSchema = faqData.length >= 2 ? {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqData.map((faq: any) => ({
      "@type": "Question", name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <nav className="text-sm mb-4 flex items-center gap-2 text-[#adb2b1]">
            <Link href="/compare" className="hover:text-white">Compare</Link>
            <span>/</span>
            <span className="text-white">{comp.entityAName} vs {comp.entityBName}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {comp.entityAName} vs {comp.entityBName}
          </h1>
          {winnerName && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a" }}>
              <Trophy className="h-4 w-4" /> Overall Winner: {winnerName}
              {comp.overallScore && <span className="text-[#adb2b1]">— Score: {comp.overallScore}</span>}
            </div>
          )}
        </div>
      </section>

      <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Quick comparison table */}
          {entityA && entityB && (
            <div className="rounded-xl overflow-hidden mb-8" style={{ background: "#fff", border: "1px solid #e8edea" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#f8faf8" }}>
                    <th className="text-left p-4 font-medium" style={{ color: "#6b7280" }}>Feature</th>
                    <th className="text-left p-4 font-semibold" style={{ color: "#111827" }}>
                      <Link href={`/${entityPath}/${comp.entityASlug}`} className="hover:underline" style={{ color: "#2bb32a" }}>{comp.entityAName}</Link>
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: "#111827" }}>
                      <Link href={`/${entityPath}/${comp.entityBSlug}`} className="hover:underline" style={{ color: "#2bb32a" }}>{comp.entityBName}</Link>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Rating", a: (entityA as any).rating, b: (entityB as any).rating },
                    { label: "Regulation", a: (entityA as any).regulation, b: (entityB as any).regulation },
                    { label: "Min Deposit", a: (entityA as any).minDeposit, b: (entityB as any).minDeposit },
                    { label: "Max Leverage", a: (entityA as any).maxLeverage, b: (entityB as any).maxLeverage },
                    { label: "Spread From", a: (entityA as any).spreadFrom, b: (entityB as any).spreadFrom },
                    { label: "Platforms", a: (entityA as any).platforms || (entityA as any).platformsList?.join(", "), b: (entityB as any).platforms || (entityB as any).platformsList?.join(", ") },
                    ...(comp.entityType === "prop_firm" ? [
                      { label: "Profit Split", a: (entityA as any).profitSplit, b: (entityB as any).profitSplit },
                      { label: "Max Funding", a: (entityA as any).maxFundingSize, b: (entityB as any).maxFundingSize },
                      { label: "Max Drawdown", a: (entityA as any).maxDrawdown, b: (entityB as any).maxDrawdown },
                    ] : []),
                  ].filter(row => row.a || row.b).map((row) => (
                    <tr key={row.label} style={{ borderTop: "1px solid #f0f0f0" }}>
                      <td className="p-4 font-medium" style={{ color: "#6b7280" }}>{row.label}</td>
                      <td className="p-4" style={{ color: "#111827" }}>{row.a || "—"}</td>
                      <td className="p-4" style={{ color: "#111827" }}>{row.b || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Category winners */}
          {categoryWinners.length > 0 && (
            <div className="rounded-xl p-6 mb-8" style={{ background: "#fff", border: "1px solid #e8edea" }}>
              <h2 className="font-semibold text-lg mb-4" style={{ color: "#111827" }}>Category Breakdown</h2>
              <div className="space-y-3">
                {categoryWinners.map((cat: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <span className="text-sm font-medium" style={{ color: "#374151" }}>{cat.label || cat.category}</span>
                    <div className="flex items-center gap-3 text-sm">
                      {cat.scoreA !== undefined && <span style={{ color: "#6b7280" }}>{comp.entityAName}: {cat.scoreA}</span>}
                      {cat.scoreB !== undefined && <span style={{ color: "#6b7280" }}>{comp.entityBName}: {cat.scoreB}</span>}
                      {cat.winnerName && (
                        <span className="font-medium px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a" }}>
                          {cat.winnerName} wins
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          {faqData.length > 0 && (
            <div className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
              <h2 className="font-semibold text-lg mb-4" style={{ color: "#111827" }}>Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqData.map((faq: any, i: number) => (
                  <div key={i}>
                    <h3 className="font-medium text-sm mb-1" style={{ color: "#111827" }}>{faq.q}</h3>
                    <p className="text-sm" style={{ color: "#6b7280" }}>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
