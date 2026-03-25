import { db } from "@/lib/db";
import { brokersTable, articlesTable, comparisonsTable, reviewsTable } from "@/lib/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Star, Shield, ArrowLeft, ExternalLink, CheckCircle2, XCircle, Award,
  Zap, Check, DollarSign, Monitor, CreditCard, Calendar, ArrowDownToLine,
  MessageSquare, Building2, Clock, Info
} from "lucide-react";
import type { Metadata } from "next";
import { stripHtml, currentYear, formatDate, SITE_URL } from "@/lib/utils";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

async function getBroker(slug: string) {
  const [broker] = await db.select().from(brokersTable).where(eq(brokersTable.slug, slug));
  return broker || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const broker = await getBroker(slug);
  if (!broker) return { title: "Broker Not Found" };

  const title = broker.seoTitle || `${stripHtml(broker.name)} Review ${currentYear()} | EntryLab`;
  const description = broker.seoDescription || broker.tagline ||
    `Comprehensive review of ${stripHtml(broker.name)}. Regulation, spreads, platforms, and more.`;

  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE_URL}/brokers/${slug}`, type: "website",
      images: broker.logoUrl ? [{ url: broker.logoUrl }] : undefined },
    twitter: { title, description },
    alternates: { canonical: `${SITE_URL}/brokers/${slug}` },
  };
}

export default async function BrokerReviewPage({ params }: Props) {
  const { slug } = await params;
  const broker = await getBroker(slug);
  if (!broker) notFound();

  const [relatedArticles, relatedComparisons, reviews] = await Promise.all([
    db.select({ title: articlesTable.title, slug: articlesTable.slug })
      .from(articlesTable)
      .where(and(eq(articlesTable.status, "published"), eq(articlesTable.relatedBroker, slug)))
      .limit(6),
    db.select({ slug: comparisonsTable.slug, entityAName: comparisonsTable.entityAName, entityBName: comparisonsTable.entityBName })
      .from(comparisonsTable)
      .where(and(eq(comparisonsTable.entityType, "broker"), eq(comparisonsTable.status, "published"),
        or(eq(comparisonsTable.entityASlug, slug), eq(comparisonsTable.entityBSlug, slug))))
      .limit(6),
    db.select().from(reviewsTable)
      .where(and(eq(reviewsTable.firmSlug, slug), eq(reviewsTable.firmType, "broker"), eq(reviewsTable.status, "approved")))
      .orderBy(desc(reviewsTable.createdAt)).limit(10),
  ]);

  const name = stripHtml(broker.name);
  const rating = Number(broker.rating || 0);
  const pros = broker.pros || [];
  const cons = broker.cons || [];
  const highlights = broker.highlights || [];

  // Structured data
  const structuredData = {
    "@context": "https://schema.org", "@type": "FinancialService",
    "@id": `${SITE_URL}/brokers/${slug}#organization`, name,
    description: broker.seoDescription || broker.tagline || `${name} forex broker review`,
    url: broker.affiliateLink || `${SITE_URL}/brokers/${slug}`,
    ...(broker.headquarters && { address: { "@type": "PostalAddress", addressLocality: broker.headquarters } }),
    ...(broker.minDeposit && { priceRange: `From ${broker.minDeposit}` }),
    ...(broker.yearFounded && { foundingDate: broker.yearFounded }),
    aggregateRating: { "@type": "AggregateRating", ratingValue: rating, bestRating: 5, worstRating: 1, ratingCount: Math.max(reviews.length, 1), reviewCount: Math.max(reviews.length, 1) },
  };
  const breadcrumbData = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Brokers", item: `${SITE_URL}/brokers` },
      { "@type": "ListItem", position: 3, name, item: `${SITE_URL}/brokers/${slug}` },
    ],
  };
  const faqItems: { q: string; a: string }[] = [];
  if (broker.regulation) faqItems.push({ q: `Is ${name} regulated?`, a: `${name} is regulated by ${broker.regulation}.` });
  if (broker.minDeposit) faqItems.push({ q: `What is the minimum deposit for ${name}?`, a: `The minimum deposit is ${broker.minDeposit}.` });
  if (broker.maxLeverage) faqItems.push({ q: `What leverage does ${name} offer?`, a: `${name} offers leverage up to ${broker.maxLeverage}.` });
  if (broker.platforms) faqItems.push({ q: `What platforms does ${name} support?`, a: `${name} supports ${broker.platforms}.` });
  if (broker.spreadFrom) faqItems.push({ q: `What are ${name}'s spreads?`, a: `Spreads start from ${broker.spreadFrom}.` });
  const faqData = faqItems.length >= 2 ? {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  } : null;

  return (
    <div style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />
      {faqData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />}

      {/* Hero Section — matches original design */}
      <div style={{ background: "#1a1e1c", borderBottom: "1px solid rgba(43,179,42,0.12)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <Link href="/brokers" className="inline-flex items-center gap-2 text-sm text-[#adb2b1] hover:text-white mb-6 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Brokers
          </Link>

          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                {broker.logoUrl && (
                  <img src={broker.logoUrl} alt={name} width={120} height={64} className="h-16 w-auto object-contain bg-white rounded-lg p-2" />
                )}
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{name} Review</h1>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-emerald-500 text-emerald-500" />
                      <span className="text-lg font-semibold text-white">{rating.toFixed(1)}</span>
                      <span className="text-[#adb2b1] text-sm">/5</span>
                    </div>
                    {broker.isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Shield className="h-3 w-3" /> Verified
                      </span>
                    )}
                    {broker.isFeatured && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#2bb32a]/10 text-[#2bb32a] border border-[#2bb32a]/20">
                        <Award className="h-3 w-3" /> Featured
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20">
                      <Calendar className="h-3 w-3 text-emerald-500" />
                      Updated {broker.lastUpdated ? formatDate(broker.lastUpdated) : formatDate(new Date())}
                    </span>
                  </div>
                </div>
              </div>

              {broker.tagline && (
                <p className="text-lg text-[#adb2b1] mb-6">{broker.tagline}</p>
              )}

              {/* At a Glance */}
              {highlights.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#2bb32a]" /> At a Glance
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {highlights.slice(0, 4).map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-[#adb2b1]">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /> {h}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {broker.bestFor && (
                <div className="mb-6">
                  <span className="text-sm font-medium text-[#adb2b1]">Best For: </span>
                  <span className="text-sm text-white">{broker.bestFor}</span>
                </div>
              )}
            </div>

            {/* Hero CTA */}
            <div className="flex flex-col gap-3 w-full lg:w-72">
              {broker.affiliateLink && (
                <a href={broker.affiliateLink} target="_blank" rel="noopener noreferrer sponsored"
                  className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "#2bb32a" }}>
                  Visit {name} <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {broker.bonusOffer && (
                <div className="text-center py-2.5 px-4 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  🎁 {broker.bonusOffer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar — icon cards */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e8edea" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Shield, value: broker.regulation?.split(",")[0] || "N/A", label: "Regulation", color: "rgba(43,179,42,0.08)", iconColor: "#186818" },
              { icon: DollarSign, value: broker.minDeposit || "N/A", label: "Min Deposit", color: "rgba(43,179,42,0.08)", iconColor: "#186818" },
              { icon: ArrowDownToLine, value: (broker as any).minWithdrawal || "N/A", label: "Min Withdrawal", color: "rgba(59,130,246,0.08)", iconColor: "#3b82f6" },
              { icon: Monitor, value: broker.platforms?.split(",")[0]?.trim() || "N/A", label: "Trading Platforms", color: "rgba(168,85,247,0.08)", iconColor: "#a855f7" },
              { icon: Zap, value: broker.maxLeverage || "N/A", label: "Max Leverage", color: "rgba(245,158,11,0.08)", iconColor: "#f59e0b" },
              { icon: CreditCard, value: broker.paymentMethods?.split(",")[0]?.trim() || "N/A", label: "Deposit Methods", color: "rgba(43,179,42,0.08)", iconColor: "#186818" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg mx-auto mb-2" style={{ background: stat.color }}>
                  <stat.icon className="h-6 w-6" style={{ color: stat.iconColor }} />
                </div>
                <div className="font-bold truncate px-2 text-sm" style={{ color: "#111827" }}>{stat.value}</div>
                <div className="text-xs" style={{ color: "#6b7280" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-12 md:py-16" style={{ background: "#f5f7f6" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_350px] gap-8">
            <article className="space-y-8 min-w-0">

              {/* Pros & Cons */}
              {(pros.length > 0 || cons.length > 0) && (
                <div className="rounded-xl p-6 md:p-8" style={{ background: "#fff", border: "1px solid #e8edea" }}>
                  <h2 className="text-2xl font-bold mb-6" style={{ color: "#111827" }}>Pros & Cons</h2>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-sm font-medium" style={{ color: "#111827" }}>Broker Analysis</span>
                    <span className="text-sm" style={{ color: "#6b7280" }}>{pros.length} Pros · {cons.length} Cons</span>
                  </div>
                  {/* Visual bar */}
                  <div className="flex h-2 rounded-full overflow-hidden mb-6" style={{ background: "#f0f0f0" }}>
                    <div style={{ width: `${(pros.length / (pros.length + cons.length)) * 100}%`, background: "#2bb32a" }} className="rounded-full" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {pros.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#16a34a" }}>
                          <CheckCircle2 className="h-5 w-5" /> STRENGTHS
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {pros.map((pro, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full" style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.15)" }}>
                              <Check className="h-3.5 w-3.5" /> {pro}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {cons.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#dc2626" }}>
                          <XCircle className="h-5 w-5" /> WEAKNESSES
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {cons.map((con, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}>
                              <XCircle className="h-3.5 w-3.5" /> {con}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review Content */}
              {broker.content && (
                <div className="rounded-xl p-6 md:p-8 prose max-w-none" style={{ background: "#fff", border: "1px solid #e8edea" }}
                  dangerouslySetInnerHTML={{ __html: broker.content }} />
              )}

              {/* User Reviews */}
              {reviews.length > 0 && (
                <div className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#111827" }}>User Reviews ({reviews.length})</h2>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="pb-4" style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm" style={{ color: "#111827" }}>{review.reviewerName}</span>
                          <div className="flex items-center gap-1 text-sm" style={{ color: "#2bb32a" }}>
                            <Star className="h-3.5 w-3.5 fill-current" /> {Number(review.rating || 0).toFixed(1)}/10
                          </div>
                        </div>
                        {review.title && <p className="text-sm font-medium mb-1" style={{ color: "#374151" }}>{review.title}</p>}
                        {review.reviewText && <p className="text-sm" style={{ color: "#6b7280" }}>{review.reviewText}</p>}
                        <p className="text-xs mt-2" style={{ color: "#9ca3af" }}>{formatDate(review.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <div className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#111827" }}>{name} Guides & Resources</h2>
                  <ul className="space-y-2">
                    {relatedArticles.map((a) => (
                      <li key={a.slug}>
                        <Link href={`/brokers/${slug}/${a.slug}`} className="text-sm hover:underline" style={{ color: "#2bb32a" }}>{a.title}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Comparisons */}
              {relatedComparisons.length > 0 && (
                <div className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#111827" }}>Compare {name}</h2>
                  <ul className="space-y-2">
                    {relatedComparisons.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/compare/${c.slug}`} className="text-sm hover:underline" style={{ color: "#2bb32a" }}>{c.entityAName} vs {c.entityBName}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Quick Info Card */}
              <div className="rounded-xl p-6 sticky top-24" style={{ background: "#fff", border: "1px solid #e8edea" }}>
                <h3 className="font-semibold mb-4" style={{ color: "#111827" }}>Quick Info</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Headquarters", value: broker.headquarters },
                    { label: "Founded", value: broker.yearFounded },
                    { label: "Regulation", value: broker.regulation },
                    { label: "Support", value: broker.support },
                    { label: "Spread From", value: broker.spreadFrom },
                    { label: "Commission", value: (broker as any).commission },
                    { label: "Withdrawal Time", value: broker.withdrawalTime },
                    { label: "Parent Company", value: broker.parentCompany },
                  ].filter(f => f.value).map((field) => (
                    <div key={field.label} className="flex justify-between gap-4">
                      <span style={{ color: "#6b7280" }}>{field.label}:</span>
                      <span className="text-right font-medium" style={{ color: "#111827" }}>{field.value}</span>
                    </div>
                  ))}
                </div>

                {broker.affiliateLink && (
                  <a href={broker.affiliateLink} target="_blank" rel="noopener noreferrer sponsored"
                    className="flex items-center justify-center gap-2 w-full mt-6 px-4 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "#2bb32a" }}>
                    Visit Broker <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <p className="text-xs mt-3 text-center" style={{ color: "#9ca3af" }}>Your capital is at risk</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
