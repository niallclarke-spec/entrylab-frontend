import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trophy,
  ArrowRight,
  Home,
  GitCompare,
  Star,
  Shield,
  TrendingUp,
  Award,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { ComparisonRecord } from "@shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryResult {
  category: string;
  label: string;
  winnerId: string | null;
  winnerSlug: string | null;
  text: string;
  scoreA: number;
  scoreB: number;
}

interface FaqItem {
  q: string;
  a: string;
}

interface AlternativeEntry {
  entityId: string;
  entitySlug: string;
  entityName: string;
  rating: number;
  wins: number;
  score: string;
  winCategoryLabels: string[];
  summary: string;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-border/50">
      {items.map((item, i) => (
        <div key={i}>
          <button
            className="w-full flex items-center justify-between py-4 text-left transition-colors hover:text-foreground"
            onClick={() => setOpen(open === i ? null : i)}
            data-testid={`faq-toggle-${i}`}
          >
            <span className="font-medium text-foreground pr-4">{item.q}</span>
            {open === i ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </button>
          {open === i && (
            <div className="pb-4 text-muted-foreground text-sm leading-relaxed">{item.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function EntityLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);
  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="w-14 h-14 object-contain bg-white rounded-lg p-2 border border-border/30"
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }
  return (
    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
      {name.charAt(0)}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── VS Comparison sub-components ────────────────────────────────────────────

const BROKER_TABLE_ROWS = [
  { label: "Regulation", key: "regulation" },
  { label: "Min Deposit", key: "minDeposit" },
  { label: "Spreads (EUR/USD)", key: "spreadFrom" },
  { label: "Commission", key: "commission" },
  { label: "Trading Platforms", key: "platforms" },
  { label: "Max Leverage", key: "maxLeverage" },
  { label: "Deposit Methods", key: "paymentMethods" },
  { label: "Our Rating", key: "rating" },
];

const PROP_TABLE_ROWS = [
  { label: "Challenge Types", key: "challengeTypes" },
  { label: "Challenge Price", key: "evaluationFee" },
  { label: "Profit Split", key: "profitSplit" },
  { label: "Max Funding", key: "maxFundingSize" },
  { label: "Profit Target", key: "profitTarget" },
  { label: "Max Drawdown", key: "maxDrawdown" },
  { label: "Payout Frequency", key: "payoutFrequency" },
  { label: "Our Rating", key: "rating" },
];

function QuickCompareTable({
  entityType,
  entityAData,
  entityBData,
  nameA,
  nameB,
}: {
  entityType: string;
  entityAData: Record<string, any>;
  entityBData: Record<string, any>;
  nameA: string;
  nameB: string;
}) {
  const rows = entityType === "broker" ? BROKER_TABLE_ROWS : PROP_TABLE_ROWS;
  return (
    <div className="overflow-x-auto rounded-xl border border-border/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            <th className="p-4 text-left text-muted-foreground font-medium w-1/3">Feature</th>
            <th className="p-4 text-left text-foreground font-semibold">{nameA}</th>
            <th className="p-4 text-left text-foreground font-semibold">{nameB}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, key }, i) => {
            const valA = entityAData?.[key] ?? "—";
            const valB = entityBData?.[key] ?? "—";
            return (
              <tr key={i} className={`border-b border-border/30 ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                <td className="p-4 text-muted-foreground">{label}</td>
                <td className="p-4 text-foreground">{String(valA)}</td>
                <td className="p-4 text-foreground">{String(valB)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CategorySection({
  result,
  record,
  entityALogo,
  entityBLogo,
}: {
  result: CategoryResult;
  record: ComparisonRecord;
  entityALogo?: string | null;
  entityBLogo?: string | null;
}) {
  const winnerIsA = result.winnerId === record.entityAId;
  const winnerIsB = result.winnerId === record.entityBId;
  const isTie = !result.winnerId;
  const winnerName = winnerIsA ? record.entityAName : winnerIsB ? record.entityBName : null;

  return (
    <Card className="bg-background/60 backdrop-blur-sm border-border/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          {result.label}
        </h3>
        {winnerName ? (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> {winnerName} Wins
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">Tie</Badge>
        )}
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{result.text}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg border ${winnerIsA ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/30 bg-muted/20"}`}>
          <div className="flex items-center gap-2 mb-1">
            {winnerIsA && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
            {winnerIsB && <XCircle className="w-3.5 h-3.5 text-muted-foreground/40" />}
            {isTie && <CheckCircle className="w-3.5 h-3.5 text-muted-foreground/40" />}
            <span className={`font-medium text-sm ${winnerIsA ? "text-emerald-400" : "text-muted-foreground"}`}>
              {record.entityAName}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Score: {result.scoreA}</p>
        </div>
        <div className={`p-3 rounded-lg border ${winnerIsB ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/30 bg-muted/20"}`}>
          <div className="flex items-center gap-2 mb-1">
            {winnerIsB && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
            {winnerIsA && <XCircle className="w-3.5 h-3.5 text-muted-foreground/40" />}
            {isTie && <CheckCircle className="w-3.5 h-3.5 text-muted-foreground/40" />}
            <span className={`font-medium text-sm ${winnerIsB ? "text-emerald-400" : "text-muted-foreground"}`}>
              {record.entityBName}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Score: {result.scoreB}</p>
        </div>
      </div>
    </Card>
  );
}

// ─── VS Comparison Page ───────────────────────────────────────────────────────

function VsComparisonPage({
  record,
  entityType,
  slug,
}: {
  record: ComparisonRecord;
  entityType: string;
  slug: string;
}) {
  const entityApiType = entityType === "broker" ? "brokers" : "prop-firms";

  const { data: entityAData } = useQuery<Record<string, any>>({
    queryKey: [`/api/${entityApiType}/${record.entityASlug}`],
    enabled: !!record.entityASlug,
    queryFn: async () => {
      const res = await fetch(`/api/${entityApiType}/${record.entityASlug}`);
      if (!res.ok) return {};
      return res.json();
    },
  });
  const { data: entityBData } = useQuery<Record<string, any>>({
    queryKey: [`/api/${entityApiType}/${record.entityBSlug}`],
    enabled: !!record.entityBSlug,
    queryFn: async () => {
      const res = await fetch(`/api/${entityApiType}/${record.entityBSlug}`);
      if (!res.ok) return {};
      return res.json();
    },
  });
  const { data: relatedComparisons } = useQuery<ComparisonRecord[]>({
    queryKey: [`/api/comparisons/related/${entityType}/${record.entityASlug}`],
    enabled: !!record.entityASlug,
    queryFn: async () => {
      const res = await fetch(`/api/comparisons/related/${entityType}/${record.entityASlug}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const categoryWinners = (record.categoryWinners as Record<string, CategoryResult>) || {};
  const faqData = (record.faqData as FaqItem[]) || [];
  const categoryList = Object.values(categoryWinners);

  const winsA = categoryList.filter((c) => c.winnerId === record.entityAId).length;
  const winsB = categoryList.filter((c) => c.winnerId === record.entityBId).length;
  const overallWinnerName =
    record.overallWinnerId === record.entityAId
      ? record.entityAName
      : record.overallWinnerId === record.entityBId
      ? record.entityBName
      : null;

  const entityALogo = entityAData?.logo || entityAData?.logoUrl;
  const entityBLogo = entityBData?.logo || entityBData?.logoUrl;
  const hubPath = entityType === "broker" ? "/compare/broker" : "/compare/prop-firm";
  const hubLabel = entityType === "broker" ? "Broker Comparisons" : "Prop Firm Comparisons";
  const entityAReviewPath = entityType === "broker" ? `/broker/${record.entityASlug}` : `/prop-firm/${record.entityASlug}`;
  const entityBReviewPath = entityType === "broker" ? `/broker/${record.entityBSlug}` : `/prop-firm/${record.entityBSlug}`;
  const pageTitle = `${record.entityAName} vs ${record.entityBName} Compared (2026)`;
  const pageDesc = `${record.entityAName} vs ${record.entityBName} — which is better? We compare across ${categoryList.length} key categories to help you decide.`;

  const loserId = record.overallWinnerId === record.entityAId ? record.entityBId : record.entityAId;
  const loserName = record.overallWinnerId === record.entityAId ? record.entityBName : record.entityAName;
  const relatedOthers = (relatedComparisons || []).filter((c) => c.slug !== slug).slice(0, 6);

  return (
    <>
      <SEO
        title={`${pageTitle} | EntryLab`}
        description={pageDesc}
        url={`https://entrylab.io/compare/${entityType}/${record.slug}`}
        type="article"
      />

      {/* ── Dark hero banner ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "#1a1e1c", borderBottom: "1px solid rgba(43,179,42,0.12)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-white/40 mb-6 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/70 flex items-center gap-1 transition-colors">
              <Home className="w-3 h-3" /> Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/compare" className="hover:text-white/70 transition-colors">Compare</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={hubPath} className="hover:text-white/70 transition-colors">{hubLabel}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/70">{record.entityAName} vs {record.entityBName}</span>
          </nav>

          <div className="flex flex-wrap items-start gap-6">
            {/* Entity A */}
            <div className="flex flex-col items-center gap-2 text-center min-w-[80px]">
              <EntityLogo name={record.entityAName} logoUrl={entityALogo} />
              <span className="text-sm font-semibold text-white">{record.entityAName}</span>
              {entityAData?.rating && <StarRating rating={parseFloat(String(entityAData.rating))} />}
            </div>

            <div className="flex flex-col items-center justify-center gap-2 px-3 py-2">
              <span className="text-2xl font-black text-white/20">VS</span>
              {overallWinnerName && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> {overallWinnerName} wins {record.overallScore}
                </Badge>
              )}
              {!overallWinnerName && record.overallScore && (
                <Badge className="bg-white/10 text-white/60 text-xs">{record.overallScore} Tie</Badge>
              )}
            </div>

            {/* Entity B */}
            <div className="flex flex-col items-center gap-2 text-center min-w-[80px]">
              <EntityLogo name={record.entityBName ?? ""} logoUrl={entityBLogo} />
              <span className="text-sm font-semibold text-white">{record.entityBName}</span>
              {entityBData?.rating && <StarRating rating={parseFloat(String(entityBData.rating))} />}
            </div>

            {/* Heading */}
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {record.entityAName} vs {record.entityBName}
              </h1>
              <p className="text-white/50 text-sm mb-3">
                Compared across {categoryList.length} key categories
              </p>
              <p className="text-white/40 text-xs">
                Last updated:{" "}
                {record.updatedAt
                  ? new Date(record.updatedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long" })
                  : "—"}
              </p>
            </div>
          </div>

          {/* Score strip */}
          <div className="mt-6 flex items-center gap-6 pt-5 border-t border-white/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{winsA}</p>
              <p className="text-white/40 text-xs">{record.entityAName}</p>
            </div>
            <div className="text-white/20 text-sm font-medium">wins</div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{winsB}</p>
              <p className="text-white/40 text-xs">{record.entityBName}</p>
            </div>
            <div className="ml-4 flex gap-2 flex-wrap">
              <Link href={entityAReviewPath}>
                <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:text-white">
                  {record.entityAName} Review
                </Button>
              </Link>
              <Link href={entityBReviewPath}>
                <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:text-white">
                  {record.entityBName} Review
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page body ─────────────────────────────────────────────────────── */}
      <div
        className="min-h-screen"
        style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

          {/* Quick Comparison Table */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-primary" />
              Quick Comparison: {record.entityAName} vs {record.entityBName}
            </h2>
            <QuickCompareTable
              entityType={record.entityType}
              entityAData={entityAData || {}}
              entityBData={entityBData || {}}
              nameA={record.entityAName}
              nameB={record.entityBName ?? ""}
            />
          </section>

          {/* Category Breakdown */}
          {categoryList.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Category Breakdown
              </h2>
              <div className="space-y-3">
                {categoryList.map((result) => (
                  <CategorySection
                    key={result.category}
                    result={result}
                    record={record}
                    entityALogo={entityALogo}
                    entityBLogo={entityBLogo}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Verdict */}
          <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-2 border-emerald-500/20 p-6">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-500" />
              The Verdict: {record.entityAName} or {record.entityBName}?
            </h2>
            {overallWinnerName ? (
              <>
                <p className="text-foreground mb-3">
                  Based on our analysis across {categoryList.length} categories,{" "}
                  <strong>{overallWinnerName}</strong> wins with a score of {record.overallScore}. It
                  outperforms in{" "}
                  {categoryList
                    .filter((c) => c.winnerId === record.overallWinnerId)
                    .map((c) => c.label)
                    .slice(0, 3)
                    .join(", ")}
                  .
                </p>
                <p className="text-muted-foreground text-sm mb-5">
                  Choose <strong className="text-foreground">{overallWinnerName}</strong> for the
                  overall stronger option. Choose{" "}
                  <strong className="text-foreground">{loserName}</strong> if{" "}
                  {categoryList
                    .filter((c) => c.winnerId === loserId)
                    .map((c) => c.label.toLowerCase())
                    .slice(0, 2)
                    .join(" or ")}{" "}
                  matter most.
                </p>
              </>
            ) : (
              <p className="text-foreground mb-5">
                {record.entityAName} and {record.entityBName} are evenly matched with a score of{" "}
                {record.overallScore}. Your choice depends on which features matter most to your
                trading style.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Link href={entityAReviewPath}>
                <Button className="bg-primary text-white" data-testid="button-review-a">
                  Full {record.entityAName} Review <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link href={entityBReviewPath}>
                <Button variant="outline" data-testid="button-review-b">
                  Full {record.entityBName} Review <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* FAQ */}
          {faqData.length > 0 && (
            <Card className="bg-background/60 backdrop-blur-sm border-border/50 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
              <FaqAccordion items={faqData} />
            </Card>
          )}

          {/* Related Comparisons */}
          {relatedOthers.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-primary" />
                Other {record.entityAName} Comparisons
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedOthers.map((c) => {
                  const otherName = c.entityASlug === record.entityASlug ? c.entityBName : c.entityAName;
                  const winnerName =
                    c.overallWinnerId === c.entityAId
                      ? c.entityAName
                      : c.overallWinnerId === c.entityBId
                      ? c.entityBName
                      : null;
                  return (
                    <Link
                      key={c.id}
                      href={`/compare/${entityType}/${c.slug}`}
                      className="group"
                      data-testid={`link-related-${c.id}`}
                    >
                      <Card className="p-4 border-border/50 hover:border-primary/30 transition-all group-hover:bg-primary/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {record.entityAName} vs {otherName}
                            </p>
                            {winnerName && (
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-emerald-500" /> Winner: {winnerName}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            [
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://entrylab.io" },
                  { "@type": "ListItem", position: 2, name: "Compare", item: "https://entrylab.io/compare" },
                  { "@type": "ListItem", position: 3, name: hubLabel, item: `https://entrylab.io${hubPath}` },
                  { "@type": "ListItem", position: 4, name: `${record.entityAName} vs ${record.entityBName}` },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "Article",
                headline: pageTitle,
                description: pageDesc,
                author: { "@type": "Organization", name: "EntryLab" },
                publisher: { "@type": "Organization", name: "EntryLab", url: "https://entrylab.io" },
                datePublished: record.publishedAt,
                dateModified: record.updatedAt,
              },
              faqData.length > 0 && {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqData.map((item) => ({
                  "@type": "Question",
                  name: item.q,
                  acceptedAnswer: { "@type": "Answer", text: item.a },
                })),
              },
            ].filter(Boolean)
          ),
        }}
      />
    </>
  );
}

// ─── Alternatives Page ────────────────────────────────────────────────────────

function AlternativesPage({
  record,
  entityType,
}: {
  record: ComparisonRecord;
  entityType: string;
}) {
  const entityApiType = entityType === "broker" ? "brokers" : "prop-firms";
  const reviewBasePath = entityType === "broker" ? "/broker" : "/prop-firm";
  const hubPath = entityType === "broker" ? "/compare/broker" : "/compare/prop-firm";
  const hubLabel = entityType === "broker" ? "Broker Comparisons" : "Prop Firm Comparisons";
  const entityKind = entityType === "broker" ? "broker" : "prop firm";

  const { data: mainEntityData } = useQuery<Record<string, any>>({
    queryKey: [`/api/${entityApiType}/${record.entityASlug}`],
    enabled: !!record.entityASlug,
    queryFn: async () => {
      const res = await fetch(`/api/${entityApiType}/${record.entityASlug}`);
      if (!res.ok) return {};
      return res.json();
    },
  });

  const categoryWinnersRaw = record.categoryWinners as any;
  const alternatives: AlternativeEntry[] = categoryWinnersRaw?.alternatives ?? [];
  const faqData = (record.faqData as FaqItem[]) || [];

  const pageTitle = `Best ${record.entityAName} Alternatives (2026) — Top ${alternatives.length} Picks`;
  const pageDesc = `Looking for alternatives to ${record.entityAName}? We compare the top ${alternatives.length} ${entityKind}s so you can find the best fit for your trading style.`;
  const mainLogo = mainEntityData?.logo || mainEntityData?.logoUrl;
  const mainRating = parseFloat(String(mainEntityData?.rating ?? 0));

  return (
    <>
      <SEO
        title={`${pageTitle} | EntryLab`}
        description={pageDesc}
        url={`https://entrylab.io/compare/${entityType}/${record.slug}`}
        type="article"
      />

      {/* ── Dark hero banner ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "#1a1e1c", borderBottom: "1px solid rgba(43,179,42,0.12)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-white/40 mb-6 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/70 flex items-center gap-1 transition-colors">
              <Home className="w-3 h-3" /> Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/compare" className="hover:text-white/70 transition-colors">Compare</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={hubPath} className="hover:text-white/70 transition-colors">{hubLabel}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/70">Best {record.entityAName} Alternatives</span>
          </nav>

          <div className="flex flex-wrap items-start gap-6">
            <div className="flex flex-col items-center gap-2 text-center min-w-[80px]">
              <EntityLogo name={record.entityAName} logoUrl={mainLogo} />
              <span className="text-sm font-semibold text-white">{record.entityAName}</span>
              {mainRating > 0 && <StarRating rating={mainRating} />}
            </div>
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Best {record.entityAName} Alternatives
              </h1>
              <p className="text-white/50 text-sm mb-3">
                The top {alternatives.length} alternatives to {record.entityAName} — compared head-to-head
              </p>
              <p className="text-white/40 text-xs">
                Last updated:{" "}
                {record.updatedAt
                  ? new Date(record.updatedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long" })
                  : "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3 flex-wrap pt-5 border-t border-white/10">
            <Link href={`${reviewBasePath}/${record.entityASlug}`}>
              <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:text-white">
                Full {record.entityAName} Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
            <Link href={hubPath}>
              <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
                All {hubLabel}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Page body ─────────────────────────────────────────────────────── */}
      <div
        className="min-h-screen"
        style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

          {/* Intro */}
          <section>
            <p className="text-muted-foreground leading-relaxed">
              {record.entityAName} is a well-regarded {entityKind}, but it may not be the right fit for
              every trader. Below we&apos;ve ranked the {alternatives.length} best alternatives, each
              compared directly to {record.entityAName} across our standard scoring categories.
            </p>
          </section>

          {/* Alternatives list */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Top {alternatives.length} Alternatives to {record.entityAName}
            </h2>

            <div className="space-y-4">
              {alternatives.map((alt, idx) => {
                const [slugA, slugB] = [record.entityASlug, alt.entitySlug].sort();
                const vsSlug = `${slugA}-vs-${slugB}`;
                const vsPath = `/compare/${entityType}/${vsSlug}`;

                return (
                  <Card
                    key={alt.entityId}
                    className="bg-background/60 backdrop-blur-sm border-border/50 overflow-hidden"
                    data-testid={`card-alternative-${idx}`}
                  >
                    <div className="p-5">
                      <div className="flex flex-wrap items-start gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <span className="text-primary font-bold text-sm">#{idx + 1}</span>
                        </div>

                        {/* Entity info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base font-bold text-foreground">{alt.entityName}</h3>
                            {alt.rating > 0 && <StarRating rating={alt.rating} />}
                            {alt.wins >= 4 && (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">
                                Top Pick
                              </Badge>
                            )}
                          </div>

                          <p className="text-muted-foreground text-sm leading-relaxed mb-3">{alt.summary}</p>

                          {/* Win categories */}
                          {alt.winCategoryLabels.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              <span className="text-xs text-muted-foreground mr-1">Beats {record.entityAName} in:</span>
                              {alt.winCategoryLabels.map((label) => (
                                <Badge key={label} variant="secondary" className="text-xs">
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Score */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <TrendingUp className="w-3.5 h-3.5 text-primary" />
                            <span>
                              Head-to-head score: <strong className="text-foreground">{alt.score}</strong> in favour of{" "}
                              {alt.wins > (7 - alt.wins) ? alt.entityName : alt.wins < (7 - alt.wins) ? record.entityAName : "neither"}
                            </span>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Link href={vsPath}>
                            <Button size="sm" className="w-full" data-testid={`button-vs-${idx}`}>
                              {record.entityAName} vs {alt.entityName}
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </Link>
                          <Link href={`${reviewBasePath}/${alt.entitySlug}`}>
                            <Button variant="outline" size="sm" className="w-full" data-testid={`button-review-alt-${idx}`}>
                              {alt.entityName} Review
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* FAQ */}
          {faqData.length > 0 && (
            <Card className="bg-background/60 backdrop-blur-sm border-border/50 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
              <FaqAccordion items={faqData} />
            </Card>
          )}

          {/* CTA to full review */}
          <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-2 border-emerald-500/20 p-6">
            <h2 className="text-lg font-bold text-foreground mb-2">
              Not sure? Read the full {record.entityAName} review first
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Our in-depth review covers fees, regulation, platforms, and everything you need to know
              about {record.entityAName} before choosing an alternative.
            </p>
            <Link href={`${reviewBasePath}/${record.entityASlug}`}>
              <Button className="bg-primary text-white">
                Read {record.entityAName} Review <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            [
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://entrylab.io" },
                  { "@type": "ListItem", position: 2, name: "Compare", item: "https://entrylab.io/compare" },
                  { "@type": "ListItem", position: 3, name: hubLabel, item: `https://entrylab.io${hubPath}` },
                  { "@type": "ListItem", position: 4, name: `Best ${record.entityAName} Alternatives` },
                ],
              },
              faqData.length > 0 && {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqData.map((item) => ({
                  "@type": "Question",
                  name: item.q,
                  acceptedAnswer: { "@type": "Answer", text: item.a },
                })),
              },
            ].filter(Boolean)
          ),
        }}
      />
    </>
  );
}

// ─── Router / entry point ─────────────────────────────────────────────────────

export default function ComparisonPage() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ slug: string }>();
  const { slug } = params;
  const entityType = location.startsWith("/compare/prop-firm") ? "prop_firm" : "broker";

  const { data: record, isLoading, error } = useQuery<ComparisonRecord>({
    queryKey: ["/api/comparisons", entityType, slug],
    queryFn: async () => {
      const res = await fetch(`/api/comparisons/${entityType}/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    retry: false,
  });

  // Canonical redirect for vs pages (alphabetical slug enforcement)
  useEffect(() => {
    if (
      record?.entityASlug &&
      record?.entityBSlug &&
      record.comparisonType === "vs" &&
      slug
    ) {
      const [sortedA, sortedB] = [record.entityASlug, record.entityBSlug].sort();
      const canonicalSlug = `${sortedA}-vs-${sortedB}`;
      if (slug !== canonicalSlug && record.status === "published") {
        setLocation(`/compare/${entityType === "prop_firm" ? "prop-firm" : "broker"}/${canonicalSlug}`, {
          replace: true,
        });
      }
    }
  }, [record, slug, entityType, setLocation]);

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div style={{ background: "#1a1e1c" }} className="py-8">
          <div className="max-w-5xl mx-auto px-4 space-y-4">
            <Skeleton className="h-4 w-48 bg-white/10" />
            <Skeleton className="h-10 w-2/3 bg-white/10" />
            <Skeleton className="h-5 w-1/3 bg-white/10" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Footer />
      </>
    );
  }

  if (error || !record) {
    const hubPath = entityType === "broker" ? "/compare/broker" : "/compare/prop-firm";
    const hubLabel = entityType === "broker" ? "Broker" : "Prop Firm";
    return (
      <>
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Comparison Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This comparison page doesn&apos;t exist or hasn&apos;t been published yet.
          </p>
          <Link href={hubPath}>
            <Button>Browse {hubLabel} Comparisons</Button>
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const isAlternatives = record.comparisonType === "alternatives";

  return (
    <>
      <Navigation />
      {isAlternatives ? (
        <AlternativesPage record={record} entityType={entityType} />
      ) : (
        <VsComparisonPage record={record} entityType={entityType} slug={slug ?? ""} />
      )}
      <Footer />
    </>
  );
}
