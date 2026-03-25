import { db } from "@/lib/db";
import { brokersTable, articlesTable, comparisonsTable, reviewsTable } from "@/lib/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Shield, ArrowLeft, ExternalLink, CheckCircle2, XCircle, Clock, Building2, Award } from "lucide-react";
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
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/brokers/${slug}`,
      type: "website",
      images: broker.logoUrl ? [{ url: broker.logoUrl }] : undefined,
    },
    twitter: { title, description },
    alternates: { canonical: `${SITE_URL}/brokers/${slug}` },
  };
}

export default async function BrokerReviewPage({ params }: Props) {
  const { slug } = await params;
  const broker = await getBroker(slug);
  if (!broker) notFound();

  // Fetch related data in parallel
  const [relatedArticles, relatedComparisons, reviews] = await Promise.all([
    db.select({ title: articlesTable.title, slug: articlesTable.slug })
      .from(articlesTable)
      .where(and(eq(articlesTable.status, "published"), eq(articlesTable.relatedBroker, slug)))
      .limit(6),
    db.select({ slug: comparisonsTable.slug, entityAName: comparisonsTable.entityAName, entityBName: comparisonsTable.entityBName })
      .from(comparisonsTable)
      .where(and(
        eq(comparisonsTable.entityType, "broker"),
        eq(comparisonsTable.status, "published"),
        or(eq(comparisonsTable.entityASlug, slug), eq(comparisonsTable.entityBSlug, slug))
      ))
      .limit(6),
    db.select().from(reviewsTable)
      .where(and(eq(reviewsTable.firmSlug, slug), eq(reviewsTable.firmType, "broker"), eq(reviewsTable.status, "approved")))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(10),
  ]);

  const name = stripHtml(broker.name);
  const rating = Number(broker.rating || 0);
  const pros = broker.pros || [];
  const cons = broker.cons || [];
  const highlights = broker.highlights || [];

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "@id": `${SITE_URL}/brokers/${slug}#organization`,
    name,
    description: broker.seoDescription || broker.tagline || `${name} forex broker review`,
    url: broker.affiliateLink || `${SITE_URL}/brokers/${slug}`,
    ...(broker.headquarters && { address: { "@type": "PostalAddress", addressLocality: broker.headquarters } }),
    ...(broker.minDeposit && { priceRange: `From ${broker.minDeposit}` }),
    ...(broker.yearFounded && { foundingDate: broker.yearFounded }),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
      ratingCount: Math.max(reviews.length, 1),
      reviewCount: Math.max(reviews.length, 1),
    },
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Brokers", item: `${SITE_URL}/brokers` },
      { "@type": "ListItem", position: 3, name, item: `${SITE_URL}/brokers/${slug}` },
    ],
  };

  // FAQ structured data
  const faqItems: { q: string; a: string }[] = [];
  if (broker.regulation) faqItems.push({ q: `Is ${name} regulated?`, a: `${name} is regulated by ${broker.regulation}.` });
  if (broker.minDeposit) faqItems.push({ q: `What is the minimum deposit for ${name}?`, a: `The minimum deposit for ${name} is ${broker.minDeposit}.` });
  if (broker.maxLeverage) faqItems.push({ q: `What leverage does ${name} offer?`, a: `${name} offers leverage up to ${broker.maxLeverage}.` });
  if (broker.platforms) faqItems.push({ q: `What platforms does ${name} support?`, a: `${name} supports ${broker.platforms}.` });
  if (broker.spreadFrom) faqItems.push({ q: `What are ${name}'s spreads?`, a: `${name} offers spreads from ${broker.spreadFrom}.` });

  const faqData = faqItems.length >= 2 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />
      {faqData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />}

      {/* Hero */}
      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <nav className="text-sm mb-4 flex items-center gap-2 text-[#adb2b1]">
            <Link href="/brokers" className="hover:text-white transition-colors">Brokers</Link>
            <span>/</span>
            <span className="text-white">{name}</span>
          </nav>
          <div className="flex items-start gap-6">
            {broker.logoUrl && (
              <img src={broker.logoUrl} alt={`${name} logo`} className="w-16 h-16 rounded-xl object-contain bg-white p-2" />
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{name} Review {currentYear()}</h1>
              <p className="text-[#adb2b1] max-w-xl">{broker.tagline}</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-lg font-bold" style={{ color: "#2bb32a" }}>
                  <Star className="h-5 w-5 fill-current" />
                  {rating.toFixed(1)}/5
                </div>
                {broker.regulation && (
                  <span className="text-sm text-[#adb2b1] flex items-center gap-1">
                    <Shield className="h-4 w-4" /> {broker.regulation}
                  </span>
                )}
                {broker.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a" }}>
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_350px] gap-8">
          {/* Main content */}
          <div className="min-w-0">
            {/* Key Stats */}
            <div className="rounded-xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
              <h2 className="font-semibold text-lg mb-4" style={{ color: "#111827" }}>Key Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Min Deposit", value: broker.minDeposit },
                  { label: "Max Leverage", value: broker.maxLeverage },
                  { label: "Spread From", value: broker.spreadFrom },
                  { label: "Platforms", value: broker.platforms },
                  { label: "Regulation", value: broker.regulation },
                  { label: "Founded", value: broker.yearFounded },
                  { label: "Headquarters", value: broker.headquarters },
                  { label: "Withdrawal Time", value: broker.withdrawalTime },
                  { label: "Deposit Methods", value: broker.paymentMethods },
                ].filter(f => f.value).map((field) => (
                  <div key={field.label}>
                    <p className="text-xs font-medium" style={{ color: "#9ca3af" }}>{field.label}</p>
                    <p className="text-sm font-medium" style={{ color: "#111827" }}>{field.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pros & Cons */}
            {(pros.length > 0 || cons.length > 0) && (
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {pros.length > 0 && (
                  <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e8edea" }}>
                    <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "#16a34a" }}>
                      <CheckCircle2 className="h-5 w-5" /> Pros
                    </h3>
                    <ul className="space-y-2">
                      {pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#16a34a" }} />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {cons.length > 0 && (
                  <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e8edea" }}>
                    <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "#dc2626" }}>
                      <XCircle className="h-5 w-5" /> Cons
                    </h3>
                    <ul className="space-y-2">
                      {cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
                          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#dc2626" }} />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Review content */}
            {broker.content && (
              <div
                className="rounded-xl p-6 md:p-8 mb-6 prose max-w-none"
                style={{ background: "#fff", border: "1px solid #e8edea" }}
                dangerouslySetInnerHTML={{ __html: broker.content }}
              />
            )}

            {/* User Reviews */}
            {reviews.length > 0 && (
              <div className="rounded-xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
                <h2 className="font-semibold text-lg mb-4" style={{ color: "#111827" }}>User Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="pb-4" style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm" style={{ color: "#111827" }}>{review.reviewerName}</span>
                        <div className="flex items-center gap-1 text-sm" style={{ color: "#2bb32a" }}>
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {Number(review.rating || 0).toFixed(1)}/10
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

            {/* Related Guides */}
            {relatedArticles.length > 0 && (
              <div className="rounded-xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
                <h2 className="font-semibold text-lg mb-4" style={{ color: "#111827" }}>{name} Guides</h2>
                <ul className="space-y-2">
                  {relatedArticles.map((article) => (
                    <li key={article.slug}>
                      <Link href={`/brokers/${slug}/${article.slug}`} className="text-sm hover:underline" style={{ color: "#2bb32a" }}>
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Comparisons */}
            {relatedComparisons.length > 0 && (
              <div className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
                <h2 className="font-semibold text-lg mb-4" style={{ color: "#111827" }}>Compare {name}</h2>
                <ul className="space-y-2">
                  {relatedComparisons.map((comp) => (
                    <li key={comp.slug}>
                      <Link href={`/compare/${comp.slug}`} className="text-sm hover:underline" style={{ color: "#2bb32a" }}>
                        {comp.entityAName} vs {comp.entityBName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* CTA Card */}
            {broker.affiliateLink && (
              <div className="rounded-xl p-6 sticky top-24" style={{ background: "#fff", border: "1px solid #e8edea" }}>
                <h3 className="font-semibold mb-3" style={{ color: "#111827" }}>Open an Account</h3>
                {broker.bonusOffer && (
                  <p className="text-sm mb-3 p-2 rounded-lg" style={{ background: "rgba(43,179,42,0.05)", color: "#16a34a" }}>
                    {broker.bonusOffer}
                  </p>
                )}
                <a
                  href={broker.affiliateLink}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "#2bb32a" }}
                >
                  Visit {name} <ExternalLink className="h-4 w-4" />
                </a>
                <p className="text-xs mt-3 text-center" style={{ color: "#9ca3af" }}>
                  Your capital is at risk
                </p>
              </div>
            )}

            {/* Quick highlights */}
            {highlights.length > 0 && (
              <div className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
                <h3 className="font-semibold mb-3" style={{ color: "#111827" }}>Highlights</h3>
                <ul className="space-y-2">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
                      <Award className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#2bb32a" }} />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
