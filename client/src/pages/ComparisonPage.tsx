import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Trophy, ArrowRight, Home, GitCompare } from "lucide-react";
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-white/10 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
            data-testid={`faq-toggle-${i}`}
          >
            <span className="font-medium text-white pr-4">{item.q}</span>
            {open === i ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            )}
          </button>
          {open === i && (
            <div className="px-4 pb-4 text-zinc-300 text-sm leading-relaxed">{item.a}</div>
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
        className="w-16 h-16 object-contain rounded-lg bg-white/5 p-2"
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }
  return (
    <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-xl">
      {name.charAt(0)}
    </div>
  );
}

function WinnerChip({ winnerId, entityAId, entityBId, entityAName, entityBName }: {
  winnerId: string | null;
  entityAId: string;
  entityBId: string | null | undefined;
  entityAName: string;
  entityBName: string | null | undefined;
}) {
  if (!winnerId) {
    return <Badge className="bg-zinc-600/30 text-zinc-300 text-xs">Tie</Badge>;
  }
  const name = winnerId === entityAId ? entityAName : entityBName;
  return (
    <Badge className="bg-[#2bb32a]/20 text-[#2bb32a] text-xs flex items-center gap-1">
      <CheckCircle className="w-3 h-3" /> {name} Wins
    </Badge>
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

  return (
    <section className="border border-white/10 rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-white">
          {result.label}
          {!isTie && ` — ${result.winnerId === record.entityAId ? record.entityAName : record.entityBName} Wins`}
          {isTie && " — Tie"}
        </h2>
        <WinnerChip
          winnerId={result.winnerId}
          entityAId={record.entityAId}
          entityBId={record.entityBId}
          entityAName={record.entityAName}
          entityBName={record.entityBName}
        />
      </div>
      <p className="text-zinc-300 text-sm leading-relaxed mb-4">{result.text}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg border ${winnerIsA ? "border-[#2bb32a]/40 bg-[#2bb32a]/5" : "border-white/10 bg-white/3"}`}>
          <div className="flex items-center gap-2 mb-1">
            {winnerIsA && <CheckCircle className="w-4 h-4 text-[#2bb32a]" />}
            {winnerIsB && <XCircle className="w-4 h-4 text-zinc-500" />}
            {isTie && <CheckCircle className="w-4 h-4 text-zinc-500" />}
            <span className={`font-medium text-sm ${winnerIsA ? "text-[#2bb32a]" : "text-zinc-300"}`}>{record.entityAName}</span>
          </div>
          <p className="text-xs text-zinc-500">Score: {result.scoreA}</p>
        </div>
        <div className={`p-3 rounded-lg border ${winnerIsB ? "border-[#2bb32a]/40 bg-[#2bb32a]/5" : "border-white/10 bg-white/3"}`}>
          <div className="flex items-center gap-2 mb-1">
            {winnerIsB && <CheckCircle className="w-4 h-4 text-[#2bb32a]" />}
            {winnerIsA && <XCircle className="w-4 h-4 text-zinc-500" />}
            {isTie && <CheckCircle className="w-4 h-4 text-zinc-500" />}
            <span className={`font-medium text-sm ${winnerIsB ? "text-[#2bb32a]" : "text-zinc-300"}`}>{record.entityBName}</span>
          </div>
          <p className="text-xs text-zinc-500">Score: {result.scoreB}</p>
        </div>
      </div>
    </section>
  );
}

// ─── Broker Quick Comparison Table ───────────────────────────────────────────

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
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/3">
            <th className="p-4 text-left text-zinc-400 font-medium w-1/3">Feature</th>
            <th className="p-4 text-left text-white font-semibold">{nameA}</th>
            <th className="p-4 text-left text-white font-semibold">{nameB}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, key }, i) => {
            const valA = entityAData?.[key] ?? "—";
            const valB = entityBData?.[key] ?? "—";
            return (
              <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/1" : ""}`}>
                <td className="p-4 text-zinc-400">{label}</td>
                <td className="p-4 text-white">{String(valA)}</td>
                <td className="p-4 text-white">{String(valB)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ComparisonPage() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ slug: string }>();
  const { slug } = params;
  // entityType is the segment before /:slug — "broker" or "prop-firm"
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

  // Fetch entity detail data for the quick comparison table
  const entityApiType = entityType === "broker" ? "brokers" : "prop-firms";
  const { data: entityAData } = useQuery<Record<string, any>>({
    queryKey: [`/api/${entityApiType}/${record?.entityASlug}`],
    enabled: !!record?.entityASlug,
    queryFn: async () => {
      const res = await fetch(`/api/${entityApiType}/${record!.entityASlug}`);
      if (!res.ok) return {};
      return res.json();
    },
  });
  const { data: entityBData } = useQuery<Record<string, any>>({
    queryKey: [`/api/${entityApiType}/${record?.entityBSlug}`],
    enabled: !!record?.entityBSlug,
    queryFn: async () => {
      const res = await fetch(`/api/${entityApiType}/${record!.entityBSlug}`);
      if (!res.ok) return {};
      return res.json();
    },
  });

  const { data: relatedComparisons } = useQuery<ComparisonRecord[]>({
    queryKey: [`/api/comparisons/related/${entityType}/${record?.entityASlug}`],
    enabled: !!record?.entityASlug,
    queryFn: async () => {
      const res = await fetch(`/api/comparisons/related/${entityType}/${record!.entityASlug}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // 301 redirect if URL is not alphabetical
  useEffect(() => {
    if (record?.entityASlug && record?.entityBSlug && slug) {
      const [sortedA, sortedB] = [record.entityASlug, record.entityBSlug].sort();
      const canonicalSlug = `${sortedA}-vs-${sortedB}`;
      if (slug !== canonicalSlug && record.status === "published") {
        setLocation(`/compare/${entityType}/${canonicalSlug}`, { replace: true });
      }
    }
  }, [record, slug, entityType, setLocation]);

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !record) {
    return (
      <>
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Comparison Not Found</h1>
          <p className="text-zinc-400 mb-6">This comparison page doesn't exist or hasn't been published yet.</p>
          <Link href={`/compare/${entityType}`}>
            <Button>Browse {entityType === "broker" ? "Broker" : "Prop Firm"} Comparisons</Button>
          </Link>
        </main>
        <Footer />
      </>
    );
  }

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
  const entityAReviewSlug = entityType === "broker" ? `/broker/${record.entityASlug}` : `/prop-firm/${record.entityASlug}`;
  const entityBReviewSlug = entityType === "broker" ? `/broker/${record.entityBSlug}` : `/prop-firm/${record.entityBSlug}`;

  const hubPath = entityType === "broker" ? "/compare/broker" : "/compare/prop-firm";
  const hubLabel = entityType === "broker" ? "Compare Brokers" : "Compare Prop Firms";
  const pageTitle = `${record.entityAName} vs ${record.entityBName} Compared (2026)`;
  const pageDesc = `${record.entityAName} vs ${record.entityBName} — which is better? We compare regulation, costs, platforms, and more across 7 key categories to help you decide.`;

  // Use-case guidance
  const loserId = record.overallWinnerId === record.entityAId ? record.entityBId : record.entityAId;
  const loserName = record.overallWinnerId === record.entityAId ? record.entityBName : record.entityAName;

  const relatedOthers = (relatedComparisons || []).filter((c) => c.slug !== slug).slice(0, 6);

  return (
    <>
      <SEO
        title={`${pageTitle} | EntryLab`}
        description={pageDesc}
        canonical={`https://entrylab.io/compare/${entityType}/${record.slug}`}
        ogType="article"
      />
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-zinc-300 flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
          <span>/</span>
          <Link href="/compare" className="hover:text-zinc-300">Compare</Link>
          <span>/</span>
          <Link href={hubPath} className="hover:text-zinc-300">{hubLabel}</Link>
          <span>/</span>
          <span className="text-zinc-300">{record.entityAName} vs {record.entityBName}</span>
        </nav>

        {/* Hero */}
        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {record.entityAName} vs {record.entityBName}
          </h1>
          <p className="text-zinc-400 mb-6">Compared across {categoryList.length} key categories</p>

          {/* Logos + VS */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex flex-col items-center gap-2">
              <EntityLogo name={record.entityAName} logoUrl={entityALogo} />
              <span className="text-sm font-medium text-white">{record.entityAName}</span>
            </div>
            <div className="text-2xl font-black text-zinc-500 px-4">VS</div>
            <div className="flex flex-col items-center gap-2">
              <EntityLogo name={record.entityBName ?? ""} logoUrl={entityBLogo} />
              <span className="text-sm font-medium text-white">{record.entityBName}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {overallWinnerName ? (
              <Badge className="bg-[#2bb32a]/20 text-[#2bb32a] border border-[#2bb32a]/30 text-sm px-3 py-1 flex items-center gap-1">
                <Trophy className="w-4 h-4" /> Winner: {overallWinnerName} ({record.overallScore})
              </Badge>
            ) : (
              <Badge className="bg-zinc-600/30 text-zinc-300 text-sm">Tied — {record.overallScore}</Badge>
            )}
            <span className="text-zinc-500 text-sm">
              Last updated: {record.updatedAt ? new Date(record.updatedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long" }) : "—"}
            </span>
          </div>
        </section>

        {/* Quick Comparison Table */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Quick Comparison</h2>
          <QuickCompareTable
            entityType={record.entityType}
            entityAData={entityAData || {}}
            entityBData={entityBData || {}}
            nameA={record.entityAName}
            nameB={record.entityBName ?? ""}
          />
        </section>

        {/* 7 Category Sections */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Category Breakdown</h2>
          {categoryList.map((result) => (
            <CategorySection
              key={result.category}
              result={result}
              record={record}
              entityALogo={entityALogo}
              entityBLogo={entityBLogo}
            />
          ))}
        </section>

        {/* Score Summary */}
        <section className="rounded-xl border border-white/10 bg-white/3 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Score Summary</h2>
          <div className="flex flex-wrap gap-6 items-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#2bb32a]">{winsA}</p>
              <p className="text-zinc-400 text-sm">{record.entityAName} wins</p>
            </div>
            <div className="text-zinc-600 text-2xl font-bold">—</div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#2bb32a]">{winsB}</p>
              <p className="text-zinc-400 text-sm">{record.entityBName} wins</p>
            </div>
          </div>
          {overallWinnerName && (
            <p className="mt-4 text-white font-medium">
              <Trophy className="w-4 h-4 inline text-[#2bb32a] mr-1" />
              {overallWinnerName} wins overall with a score of {record.overallScore}
            </p>
          )}
        </section>

        {/* Verdict */}
        <section className="rounded-xl border border-[#2bb32a]/20 bg-[#2bb32a]/5 p-6">
          <h2 className="text-xl font-semibold text-white mb-3">
            The Verdict: {record.entityAName} or {record.entityBName}?
          </h2>
          {overallWinnerName ? (
            <>
              <p className="text-zinc-300 mb-4">
                Based on our analysis across {categoryList.length} categories, <strong>{overallWinnerName}</strong> wins
                with a score of {record.overallScore}. It outperforms in{" "}
                {categoryList.filter((c) => c.winnerId === record.overallWinnerId).map((c) => c.label).slice(0, 3).join(", ")}.
              </p>
              <p className="text-zinc-400 text-sm mb-6">
                Choose <strong className="text-white">{overallWinnerName}</strong> if you want the overall stronger
                option. Choose <strong className="text-white">{loserName}</strong> if{" "}
                {categoryList.filter((c) => c.winnerId === loserId).map((c) => c.label.toLowerCase()).slice(0, 2).join(" or ")}{" "}
                matter most to you.
              </p>
            </>
          ) : (
            <p className="text-zinc-300 mb-6">
              {record.entityAName} and {record.entityBName} are evenly matched overall with a score of{" "}
              {record.overallScore}. Your choice should be guided by which specific features matter most to your trading style.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href={entityAReviewSlug}>
              <Button className="bg-[#2bb32a] hover:bg-[#239122] text-white" data-testid="button-review-a">
                Read Full {record.entityAName} Review <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href={entityBReviewSlug}>
              <Button variant="outline" data-testid="button-review-b">
                Read Full {record.entityBName} Review <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        {faqData.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
            <FaqAccordion items={faqData} />
          </section>
        )}

        {/* Related Comparisons */}
        {relatedOthers.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Other {record.entityAName} Comparisons
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedOthers.map((c) => {
                const otherName = c.entityASlug === record.entityASlug ? c.entityBName : c.entityAName;
                return (
                  <Link
                    key={c.id}
                    href={`/compare/${entityType}/${c.slug}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:border-[#2bb32a]/30 hover:bg-white/3 transition-colors"
                    data-testid={`link-related-${c.id}`}
                  >
                    <span className="text-zinc-300 text-sm">{record.entityAName} vs {otherName}</span>
                    <ArrowRight className="w-4 h-4 text-zinc-500" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
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
          ].filter(Boolean)),
        }}
      />

      <Footer />
    </>
  );
}
