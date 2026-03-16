import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Home, GitCompare, Trophy } from "lucide-react";
import type { ComparisonRecord } from "@shared/schema";

export default function ComparisonPropFirmHub() {
  const { data: comparisons, isLoading } = useQuery<ComparisonRecord[]>({
    queryKey: ["/api/comparisons/hub/prop_firm"],
    queryFn: async () => {
      const res = await fetch("/api/comparisons/hub/prop_firm");
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <>
      <SEO
        title="Prop Firm Comparisons — Find the Best Funded Trader Programme | EntryLab"
        description="Compare the top prop trading firms side by side. Challenges, payouts, drawdown rules and more — all analysed so you can choose the best funded account."
        canonical="https://entrylab.io/compare/prop-firm"
      />
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-zinc-300 flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
          <span>/</span>
          <Link href="/compare" className="hover:text-zinc-300">Compare</Link>
          <span>/</span>
          <span className="text-zinc-300">Prop Firm Comparisons</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <GitCompare className="w-6 h-6 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Prop Firm Comparisons</h1>
          </div>
          <p className="text-zinc-400 max-w-2xl">
            Head-to-head comparisons of the top proprietary trading firms. We analyse challenges,
            profit splits, drawdown limits and payouts so you can find the right programme.
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : !comparisons?.length ? (
          <div className="text-center py-16 text-zinc-500">
            <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No prop firm comparisons published yet.</p>
            <p className="text-sm mt-1">Check back soon — comparisons are being prepared.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisons.map((c) => {
              const winnerName =
                c.overallWinnerId === c.entityAId
                  ? c.entityAName
                  : c.overallWinnerId === c.entityBId
                  ? c.entityBName
                  : null;
              return (
                <Link
                  key={c.id}
                  href={`/compare/prop-firm/${c.slug}`}
                  className="group block p-5 rounded-xl border border-white/10 hover:border-[#2bb32a]/30 hover:bg-white/3 transition-all"
                  data-testid={`link-comparison-${c.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2 className="text-sm font-semibold text-white leading-snug group-hover:text-[#2bb32a] transition-colors">
                      {c.entityAName} vs {c.entityBName}
                    </h2>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-[#2bb32a] flex-shrink-0 transition-colors" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {winnerName ? (
                      <Badge className="bg-[#2bb32a]/15 text-[#2bb32a] text-xs flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> {winnerName}
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-600/20 text-zinc-400 text-xs">Tie</Badge>
                    )}
                    {c.overallScore && (
                      <Badge className="bg-white/5 text-zinc-400 text-xs">{c.overallScore}</Badge>
                    )}
                  </div>
                  {c.publishedAt && (
                    <p className="text-xs text-zinc-600 mt-3">
                      {new Date(c.publishedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
