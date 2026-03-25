import { db } from "@/lib/db";
import { brokersTable, propFirmsTable, articlesTable } from "@/lib/schema";
import { desc, eq, asc } from "drizzle-orm";
import Link from "next/link";
import { Shield, TrendingUp, Newspaper, ArrowRight, Star, Zap } from "lucide-react";
import { formatDate, SITE_NAME } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 1800; // 30 minutes
export const dynamic = "force-dynamic"; // TODO: remove for production — ISR will handle this

export const metadata: Metadata = {
  title: `${SITE_NAME} — Forex Broker Reviews & Trading Intelligence`,
  description:
    "Independent forex broker reviews, prop firm evaluations, and XAU/USD trading signals. Compare brokers by regulation, spreads, leverage, and platforms.",
  openGraph: {
    title: `${SITE_NAME} — Forex Broker Reviews & Trading Intelligence`,
    description:
      "Independent forex broker reviews, prop firm evaluations, and XAU/USD trading signals.",
    url: "https://entrylab.io",
  },
};

export default async function HomePage() {
  const [brokers, propFirms, latestArticles] = await Promise.all([
    db
      .select()
      .from(brokersTable)
      .orderBy(asc(brokersTable.name))
      .limit(12),
    db
      .select()
      .from(propFirmsTable)
      .orderBy(asc(propFirmsTable.name))
      .limit(8),
    db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.status, "published"))
      .orderBy(desc(articlesTable.publishedAt))
      .limit(6),
  ]);

  return (
    <>
      {/* Hero */}
      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-20 md:py-28">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a", border: "1px solid rgba(43,179,42,0.2)" }}>
            <Shield className="h-3 w-3" /> Independent & Unbiased
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Forex Broker Reviews &<br />
            <span style={{ color: "#2bb32a" }}>Trading Intelligence</span>
          </h1>
          <p className="text-lg text-[#adb2b1] max-w-2xl mx-auto mb-10">
            Expert broker reviews, prop firm evaluations, and real-time trading signals.
            Make confident trading decisions backed by data.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/brokers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "#2bb32a" }}
            >
              <Shield className="h-4 w-4" /> Browse Brokers
            </Link>
            <Link
              href="/prop-firms"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <TrendingUp className="h-4 w-4" /> Prop Firms
            </Link>
            <Link
              href="/signals"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <Zap className="h-4 w-4" /> Free Signals
            </Link>
          </div>
        </div>
      </section>

      {/* Broker Reviews */}
      <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold" style={{ color: "#111827" }}>Broker Reviews</h2>
              <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Expert-reviewed and independently rated</p>
            </div>
            <Link href="/brokers" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold hover:opacity-80" style={{ color: "#186818" }}>
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {brokers.map((broker) => (
              <Link
                key={broker.id}
                href={`/brokers/${broker.slug}`}
                className="rounded-xl p-5 transition-all hover:shadow-md"
                style={{ background: "#fff", border: "1px solid #e8edea" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold" style={{ color: "#111827" }}>{broker.name}</h3>
                  <div className="flex items-center gap-1 text-sm font-medium" style={{ color: "#2bb32a" }}>
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {Number(broker.rating || 0).toFixed(1)}
                  </div>
                </div>
                <p className="text-xs mb-2" style={{ color: "#6b7280" }}>{broker.regulation || "—"}</p>
                <div className="flex gap-3 text-xs" style={{ color: "#6b7280" }}>
                  {broker.minDeposit && <span>Min: {broker.minDeposit}</span>}
                  {broker.maxLeverage && <span>Leverage: {broker.maxLeverage}</span>}
                  {broker.spreadFrom && <span>Spread: {broker.spreadFrom}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Prop Firms */}
      <section style={{ background: "#fff" }} className="px-4 sm:px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold" style={{ color: "#111827" }}>Prop Firm Reviews</h2>
              <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Funded trading accounts, independently evaluated</p>
            </div>
            <Link href="/prop-firms" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold hover:opacity-80" style={{ color: "#186818" }}>
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {propFirms.map((firm) => (
              <Link
                key={firm.id}
                href={`/prop-firms/${firm.slug}`}
                className="rounded-xl p-5 transition-all hover:shadow-md"
                style={{ background: "#f8faf8", border: "1px solid #e8edea" }}
              >
                <h3 className="font-semibold mb-1" style={{ color: "#111827" }}>{firm.name}</h3>
                <div className="flex items-center gap-1 text-sm mb-2" style={{ color: "#2bb32a" }}>
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {Number(firm.rating || 0).toFixed(1)}
                </div>
                <div className="text-xs space-y-0.5" style={{ color: "#6b7280" }}>
                  {firm.profitSplit && <p>Profit Split: {firm.profitSplit}</p>}
                  {firm.maxFundingSize && <p>Max Funding: {firm.maxFundingSize}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      {latestArticles.length > 0 && (
        <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold" style={{ color: "#111827" }}>Latest News</h2>
                <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Breaking updates from the forex & prop firm world</p>
              </div>
              <Link href="/news" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold hover:opacity-80" style={{ color: "#186818" }}>
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {latestArticles.map((article) => {
                const articleUrl = article.relatedBroker
                  ? `/brokers/${article.relatedBroker}/${article.slug}`
                  : article.relatedPropFirm
                  ? `/prop-firms/${article.relatedPropFirm}/${article.slug}`
                  : `/blog/${article.slug}`;

                return (
                  <Link
                    key={article.id}
                    href={articleUrl}
                    className="rounded-xl p-5 transition-all hover:shadow-md"
                    style={{ background: "#fff", border: "1px solid #e8edea" }}
                  >
                    <p className="text-xs mb-2" style={{ color: "#2bb32a" }}>
                      {article.category?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "News"}
                    </p>
                    <h3 className="font-semibold mb-2 line-clamp-2" style={{ color: "#111827" }}>
                      {article.title}
                    </h3>
                    <p className="text-sm line-clamp-2 mb-3" style={{ color: "#6b7280" }}>
                      {article.excerpt?.replace(/<[^>]+>/g, "").substring(0, 120)}
                    </p>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      {formatDate(article.publishedAt)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
