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
    <div style={{ borderTop: "1px solid #e8edea" }}>
      {items.map((item, i) => (
        <div key={i} style={{ borderBottom: "1px solid #e8edea" }}>
          <button
            className="w-full flex items-center justify-between py-4 text-left transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
            data-testid={`faq-toggle-${i}`}
          >
            <span className="font-semibold text-sm pr-4" style={{ color: "#111827" }}>{item.q}</span>
            {open === i ? (
              <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "#6b7280" }} />
            ) : (
              <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#6b7280" }} />
            )}
          </button>
          {open === i && (
            <div className="pb-4 text-sm leading-relaxed" style={{ color: "#4b5563" }}>{item.a}</div>
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
    <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #e8edea" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid #e8edea", background: "#f9fafb" }}>
            <th className="p-4 text-left font-medium w-1/3" style={{ color: "#6b7280" }}>Feature</th>
            <th className="p-4 text-left font-semibold" style={{ color: "#111827" }}>{nameA}</th>
            <th className="p-4 text-left font-semibold" style={{ color: "#111827" }}>{nameB}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, key }, i) => {
            const valA = entityAData?.[key] ?? "—";
            const valB = entityBData?.[key] ?? "—";
            return (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#ffffff" : "#fafafa" }}>
                <td className="p-4" style={{ color: "#6b7280" }}>{label}</td>
                <td className="p-4" style={{ color: "#111827" }}>{String(valA)}</td>
                <td className="p-4" style={{ color: "#111827" }}>{String(valB)}</td>
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
    <div
      className="rounded-lg p-5"
      style={{ background: "#ffffff", border: "1px solid #e8edea" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="text-lg font-bold" style={{ color: "#111827" }}>
          {result.label}
        </h3>
        {winnerName ? (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: "#dcfce7", color: "#15803d" }}
          >
            <CheckCircle className="w-3 h-3" /> {winnerName} Wins
          </span>
        ) : (
          <span
            className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: "#f3f4f6", color: "#6b7280" }}
          >
            Tie
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed mb-4" style={{ color: "#4b5563" }}>{result.text}</p>
      <div className="grid grid-cols-2 gap-3">
        <div
          className="p-3 rounded-lg"
          style={
            winnerIsA
              ? { background: "#f0fdf4", border: "1px solid #bbf7d0" }
              : { background: "#f9fafb", border: "1px solid #e5e7eb" }
          }
        >
          <div className="flex items-center gap-2 mb-1">
            {winnerIsA && <CheckCircle className="w-3.5 h-3.5" style={{ color: "#16a34a" }} />}
            {winnerIsB && <XCircle className="w-3.5 h-3.5" style={{ color: "#d1d5db" }} />}
            {isTie && <CheckCircle className="w-3.5 h-3.5" style={{ color: "#d1d5db" }} />}
            <span
              className="font-medium text-sm"
              style={{ color: winnerIsA ? "#15803d" : "#374151" }}
            >
              {record.entityAName}
            </span>
          </div>
          <p className="text-xs" style={{ color: "#9ca3af" }}>Score: {result.scoreA}</p>
        </div>
        <div
          className="p-3 rounded-lg"
          style={
            winnerIsB
              ? { background: "#f0fdf4", border: "1px solid #bbf7d0" }
              : { background: "#f9fafb", border: "1px solid #e5e7eb" }
          }
        >
          <div className="flex items-center gap-2 mb-1">
            {winnerIsB && <CheckCircle className="w-3.5 h-3.5" style={{ color: "#16a34a" }} />}
            {winnerIsA && <XCircle className="w-3.5 h-3.5" style={{ color: "#d1d5db" }} />}
            {isTie && <CheckCircle className="w-3.5 h-3.5" style={{ color: "#d1d5db" }} />}
            <span
              className="font-medium text-sm"
              style={{ color: winnerIsB ? "#15803d" : "#374151" }}
            >
              {record.entityBName}
            </span>
          </div>
          <p className="text-xs" style={{ color: "#9ca3af" }}>Score: {result.scoreB}</p>
        </div>
      </div>
    </div>
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

  const tocItems = [
    { id: "quick-compare", label: "Quick Comparison" },
    { id: "category-breakdown", label: "Category Breakdown" },
    { id: "verdict", label: "Our Verdict" },
    ...(faqData.length > 0 ? [{ id: "faq", label: "FAQ" }] : []),
    ...(relatedOthers.length > 0 ? [{ id: "related", label: "Related Comparisons" }] : []),
  ];

  return (
    <>
      <SEO
        title={`${pageTitle} | EntryLab`}
        description={pageDesc}
        url={`https://entrylab.io/compare/${entityType}/${record.slug}`}
        type="article"
      />

      {/* ── Dark hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: "#1a1e1c" }}>
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #2bb32a 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Green glow orb */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(43,179,42,0.08) 0%, transparent 70%)" }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs mb-7 flex-wrap" style={{ color: "rgba(255,255,255,0.35)" }} aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/70 flex items-center gap-1 transition-colors">
              <Home className="w-3 h-3" /> Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/compare" className="hover:text-white/70 transition-colors">Compare</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={hubPath} className="hover:text-white/70 transition-colors">{hubLabel}</Link>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: "rgba(255,255,255,0.65)" }}>{record.entityAName} vs {record.entityBName}</span>
          </nav>

          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            {/* Left: Title + Meta + Score */}
            <div className="space-y-4 text-white order-2 lg:order-1">
              {/* Category badge */}
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(43,179,42,0.15)", border: "1px solid rgba(43,179,42,0.3)", color: "#2bb32a" }}
              >
                <GitCompare className="w-3 h-3" />
                {entityType === "broker" ? "Broker Comparison" : "Prop Firm Comparison"}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                {record.entityAName} vs {record.entityBName}
              </h1>

              <p className="text-base md:text-lg leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,0.7)" }}>
                Compared across {categoryList.length} key categories — find out which {entityType === "broker" ? "broker" : "prop firm"} is right for your trading style.
              </p>

              {/* Score strip */}
              <div className="flex items-center gap-5 pt-2 flex-wrap">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="text-center">
                    <p className="text-2xl font-black text-white leading-tight">{winsA}</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{record.entityAName}</p>
                  </div>
                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>vs</span>
                  <div className="text-center">
                    <p className="text-2xl font-black text-white leading-tight">{winsB}</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{record.entityBName}</p>
                  </div>
                </div>
                {overallWinnerName && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(43,179,42,0.2)", border: "1px solid rgba(43,179,42,0.35)", color: "#4ade80" }}
                  >
                    <Trophy className="w-3 h-3" /> {overallWinnerName} wins {record.overallScore}
                  </span>
                )}
              </div>

              {/* Updated date + review CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Updated:{" "}
                  {record.updatedAt
                    ? new Date(record.updatedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long" })
                    : "—"}
                </span>
                <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                <Link href={entityAReviewPath}>
                  <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:text-white text-xs h-7">
                    {record.entityAName} Review
                  </Button>
                </Link>
                <Link href={entityBReviewPath}>
                  <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:text-white text-xs h-7">
                    {record.entityBName} Review
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: VS Battle Card */}
            <div className="order-1 lg:order-2 flex-shrink-0">
              <div
                className="rounded-2xl p-6 flex items-center gap-5"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", minWidth: 280 }}
              >
                {/* Entity A */}
                <div className="flex flex-col items-center gap-2.5 flex-1 text-center">
                  <EntityLogo name={record.entityAName} logoUrl={entityALogo} />
                  <span className="text-sm font-semibold text-white">{record.entityAName}</span>
                  {entityAData?.rating && (
                    <StarRating rating={parseFloat(String(entityAData.rating))} />
                  )}
                  <div
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={
                      record.overallWinnerId === record.entityAId
                        ? { background: "rgba(43,179,42,0.2)", color: "#4ade80" }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }
                    }
                  >
                    {winsA} wins
                  </div>
                </div>

                {/* VS divider */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <span
                    className="text-2xl font-black"
                    style={{ color: "rgba(255,255,255,0.15)" }}
                  >
                    VS
                  </span>
                </div>

                {/* Entity B */}
                <div className="flex flex-col items-center gap-2.5 flex-1 text-center">
                  <EntityLogo name={record.entityBName ?? ""} logoUrl={entityBLogo} />
                  <span className="text-sm font-semibold text-white">{record.entityBName}</span>
                  {entityBData?.rating && (
                    <StarRating rating={parseFloat(String(entityBData.rating))} />
                  )}
                  <div
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={
                      record.overallWinnerId === record.entityBId
                        ? { background: "rgba(43,179,42,0.2)", color: "#4ade80" }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }
                    }
                  >
                    {winsB} wins
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page body ──────────────────────────────────────────────────────── */}
      <main className="flex-1" style={{ background: "#f5f7f6" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-[1fr_320px] gap-8 xl:gap-12">

            {/* ── Main column ─────────────────────────────────────────────── */}
            <div className="min-w-0 space-y-6">

              {/* Quick Comparison Table */}
              <section id="quick-compare">
                <div className="rounded-lg p-6 md:p-7" style={{ background: "#ffffff", border: "1px solid #e8edea" }}>
                  <h2 className="text-xl font-bold mb-5 flex items-center gap-2" style={{ color: "#111827" }}>
                    <GitCompare className="w-5 h-5" style={{ color: "#2bb32a" }} />
                    Quick Comparison: {record.entityAName} vs {record.entityBName}
                  </h2>
                  <QuickCompareTable
                    entityType={record.entityType}
                    entityAData={entityAData || {}}
                    entityBData={entityBData || {}}
                    nameA={record.entityAName}
                    nameB={record.entityBName ?? ""}
                  />
                </div>
              </section>

              {/* Category Breakdown */}
              {categoryList.length > 0 && (
                <section id="category-breakdown">
                  <div className="rounded-lg p-6 md:p-7" style={{ background: "#ffffff", border: "1px solid #e8edea" }}>
                    <h2 className="text-xl font-bold mb-5 flex items-center gap-2" style={{ color: "#111827" }}>
                      <BarChart3 className="w-5 h-5" style={{ color: "#2bb32a" }} />
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
                  </div>
                </section>
              )}

              {/* Verdict */}
              <section id="verdict">
                <div
                  className="rounded-lg p-6 md:p-7"
                  style={{ background: "#f0fdf4", border: "2px solid #bbf7d0" }}
                >
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: "#111827" }}>
                    <Trophy className="w-5 h-5" style={{ color: "#16a34a" }} />
                    The Verdict: {record.entityAName} or {record.entityBName}?
                  </h2>
                  {overallWinnerName ? (
                    <>
                      <p className="mb-3" style={{ color: "#111827" }}>
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
                      <p className="text-sm mb-5" style={{ color: "#4b5563" }}>
                        Choose <strong style={{ color: "#111827" }}>{overallWinnerName}</strong> for the
                        overall stronger option. Choose{" "}
                        <strong style={{ color: "#111827" }}>{loserName}</strong> if{" "}
                        {categoryList
                          .filter((c) => c.winnerId === loserId)
                          .map((c) => c.label.toLowerCase())
                          .slice(0, 2)
                          .join(" or ")}{" "}
                        matter most.
                      </p>
                    </>
                  ) : (
                    <p className="mb-5" style={{ color: "#111827" }}>
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
                </div>
              </section>

              {/* FAQ */}
              {faqData.length > 0 && (
                <section id="faq">
                  <div className="rounded-lg p-6 md:p-7" style={{ background: "#ffffff", border: "1px solid #e8edea" }}>
                    <h2 className="text-xl font-bold mb-4" style={{ color: "#111827" }}>Frequently Asked Questions</h2>
                    <FaqAccordion items={faqData} />
                  </div>
                </section>
              )}

              {/* Related Comparisons */}
              {relatedOthers.length > 0 && (
                <section id="related">
                  <div className="rounded-lg p-6 md:p-7" style={{ background: "#ffffff", border: "1px solid #e8edea" }}>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "#111827" }}>
                      <GitCompare className="w-5 h-5" style={{ color: "#2bb32a" }} />
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
                            <div
                              className="p-4 rounded-lg transition-all group-hover:border-[#2bb32a]/40"
                              style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium transition-colors group-hover:text-[#15803d]" style={{ color: "#111827" }}>
                                    {record.entityAName} vs {otherName}
                                  </p>
                                  {winnerName && (
                                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#6b7280" }}>
                                      <Trophy className="w-3 h-3" style={{ color: "#16a34a" }} /> Winner: {winnerName}
                                    </p>
                                  )}
                                </div>
                                <ArrowRight className="w-4 h-4 flex-shrink-0 transition-colors group-hover:text-[#16a34a]" style={{ color: "#9ca3af" }} />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* ── Sticky Sidebar ──────────────────────────────────────────── */}
            <aside className="hidden lg:block">
              <div
                className="sticky space-y-6"
                style={{
                  top: "6rem",
                  maxHeight: "calc(100vh - 7rem)",
                  overflowY: "auto",
                  paddingBottom: "1rem",
                }}
              >

                {/* Table of Contents */}
                <div className="rounded-lg p-5" style={{ background: "#ffffff", border: "1px solid #e8edea" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "#6b7280" }}>Contents</h3>
                  <nav className="space-y-1">
                    {tocItems.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-[#f0fdf4] hover:text-[#15803d]"
                        style={{ color: "#374151" }}
                      >
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#2bb32a" }} />
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </div>

                {/* Winner Summary Card */}
                {overallWinnerName && (
                  <div className="rounded-lg p-5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="w-4 h-4" style={{ color: "#16a34a" }} />
                      <span className="text-sm font-bold" style={{ color: "#15803d" }}>Overall Winner</span>
                    </div>
                    <p className="text-2xl font-black mb-1" style={{ color: "#111827" }}>{overallWinnerName}</p>
                    <p className="text-xs mb-4" style={{ color: "#6b7280" }}>
                      Score: {record.overallScore} · {winsA > winsB ? winsA : winsB} category wins
                    </p>
                    <Link href={overallWinnerName === record.entityAName ? entityAReviewPath : entityBReviewPath}>
                      <Button size="sm" className="w-full bg-[#2bb32a] hover:bg-[#24a023] text-white border-0">
                        Full Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Runner-up */}
                <div className="rounded-lg p-5" style={{ background: "#ffffff", border: "1px solid #e8edea" }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "#374151" }}>Compare Both</h3>
                  <div className="space-y-2">
                    <Link href={entityAReviewPath}>
                      <div className="flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-[#f9fafb]" style={{ border: "1px solid #e5e7eb" }}>
                        <EntityLogo name={record.entityAName} logoUrl={entityALogo} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#111827" }}>{record.entityAName}</p>
                          {entityAData?.rating && (
                            <StarRating rating={parseFloat(String(entityAData.rating))} />
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: "#9ca3af" }} />
                      </div>
                    </Link>
                    <Link href={entityBReviewPath}>
                      <div className="flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-[#f9fafb]" style={{ border: "1px solid #e5e7eb" }}>
                        <EntityLogo name={record.entityBName ?? ""} logoUrl={entityBLogo} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#111827" }}>{record.entityBName}</p>
                          {entityBData?.rating && (
                            <StarRating rating={parseFloat(String(entityBData.rating))} />
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: "#9ca3af" }} />
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Hub link */}
                <Link href={hubPath}>
                  <div
                    className="rounded-lg p-4 flex items-center gap-3 transition-colors hover:border-[#2bb32a]/40 cursor-pointer"
                    style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
                  >
                    <GitCompare className="w-5 h-5 flex-shrink-0" style={{ color: "#2bb32a" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "#111827" }}>More Comparisons</p>
                      <p className="text-xs" style={{ color: "#6b7280" }}>Browse all {hubLabel.toLowerCase()}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: "#9ca3af" }} />
                  </div>
                </Link>

              </div>
            </aside>

          </div>
        </div>
      </main>

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
        style={{ background: "#f5f7f6" }}
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
                  <div
                    key={alt.entityId}
                    className="rounded-lg overflow-hidden"
                    style={{ background: "#ffffff", border: "1px solid #e8edea" }}
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
                  </div>
                );
              })}
            </div>
          </section>

          {/* FAQ */}
          {faqData.length > 0 && (
            <div className="rounded-lg p-6" style={{ background: "#ffffff", border: "1px solid #e8edea" }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#111827" }}>Frequently Asked Questions</h2>
              <FaqAccordion items={faqData} />
            </div>
          )}

          {/* CTA to full review */}
          <div className="rounded-lg p-6" style={{ background: "#f0fdf4", border: "2px solid #bbf7d0" }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: "#111827" }}>
              Not sure? Read the full {record.entityAName} review first
            </h2>
            <p className="text-sm mb-4" style={{ color: "#4b5563" }}>
              Our in-depth review covers fees, regulation, platforms, and everything you need to know
              about {record.entityAName} before choosing an alternative.
            </p>
            <Link href={`${reviewBasePath}/${record.entityASlug}`}>
              <Button className="bg-primary text-white">
                Read {record.entityAName} Review <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
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

  // Set light body background (comparison pages use light theme body)
  useEffect(() => {
    document.body.style.setProperty("background", "#f5f7f6", "important");
    document.documentElement.style.setProperty("background", "#f5f7f6", "important");
    return () => {
      document.body.style.removeProperty("background");
      document.documentElement.style.removeProperty("background");
    };
  }, []);

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
