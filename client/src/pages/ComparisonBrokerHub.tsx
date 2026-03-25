import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, GitCompare, Trophy, Star, ArrowRight, Shield } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import type { ComparisonRecord } from "@shared/schema";

function BrokerLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const [err, setErr] = useState(false);
  if (logoUrl && !err) {
    return (
      <img
        src={logoUrl}
        alt={name}
        onError={() => setErr(true)}
        className="w-16 h-16 object-contain rounded-xl bg-white p-2"
        style={{ border: "1px solid #e8edea" }}
      />
    );
  }
  return (
    <div
      className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
      style={{ background: "#2bb32a" }}
    >
      {name.charAt(0)}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3 h-3 ${s <= stars ? "fill-[#f59e0b] text-[#f59e0b]" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
      <span className="text-xs font-medium ml-1" style={{ color: "#6b7280" }}>{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ComparisonBrokerHub() {
  const { data: comparisons, isLoading: loadingComparisons } = useQuery<ComparisonRecord[]>({
    queryKey: ["/api/comparisons/hub/broker"],
    queryFn: async () => {
      const res = await fetch("/api/comparisons/hub/broker");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: brokers } = useQuery<any[]>({
    queryKey: ["/api/brokers"],
  });

  useLayoutEffect(() => {
    document.body.style.setProperty("background", "#f5f7f6", "important");
    return () => { document.body.style.removeProperty("background"); };
  }, []);

  const brokerMap = new Map<string, any>();
  brokers?.forEach((b) => {
    brokerMap.set(b.slug, b);
    brokerMap.set(b.id, b);
  });

  const isLoading = loadingComparisons;

  return (
    <>
      <SEO
        title="Broker Comparisons — Find the Best Forex Broker | EntryLab"
        description="Compare the top forex brokers side by side. Regulation, spreads, platforms, commissions and more — all analysed across 14 key categories."
      />
      <Navigation />

      <main style={{ background: "#f5f7f6", minHeight: "100vh" }}>
        {/* Hero */}
        <div style={{ background: "#1a1e1c" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
            <nav className="flex items-center gap-2 text-xs mb-6 flex-wrap" style={{ color: "rgba(255,255,255,0.35)" }}>
              <Link href="/" className="hover:text-white/70 flex items-center gap-1 transition-colors">
                <Home className="w-3 h-3" /> Home
              </Link>
              <span>/</span>
              <Link href="/compare" className="hover:text-white/70 transition-colors">Compare</Link>
              <span>/</span>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Broker Comparisons</span>
            </nav>

            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl flex-shrink-0"
                style={{ background: "rgba(43,179,42,0.15)", border: "1px solid rgba(43,179,42,0.25)" }}
              >
                <GitCompare className="w-6 h-6" style={{ color: "#2bb32a" }} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Broker Comparisons</h1>
                <p className="text-base max-w-2xl" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Head-to-head comparisons across 14 categories — regulation, fees, platforms, leverage and more, so you can choose with confidence.
                </p>
                {comparisons && (
                  <p className="text-sm mt-3 font-medium" style={{ color: "#2bb32a" }}>
                    {comparisons.length} comparisons published
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Listings */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : !comparisons?.length ? (
            <div className="text-center py-20" style={{ color: "#6b7280" }}>
              <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium" style={{ color: "#374151" }}>No broker comparisons published yet.</p>
              <p className="text-sm mt-1">Check back soon — comparisons are being prepared.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comparisons.map((c) => {
                const brokerA = brokerMap.get(c.entityASlug) || brokerMap.get(c.entityAId);
                const brokerB = brokerMap.get(c.entityBSlug ?? "") || brokerMap.get(c.entityBId ?? "");
                const logoA = brokerA?.logoUrl || brokerA?.logo;
                const logoB = brokerB?.logoUrl || brokerB?.logo;
                const ratingA = brokerA?.rating ? parseFloat(String(brokerA.rating)) : null;
                const ratingB = brokerB?.rating ? parseFloat(String(brokerB.rating)) : null;
                const regulationA = brokerA?.regulation || brokerA?.regulators;
                const regulationB = brokerB?.regulation || brokerB?.regulators;
                const winsA = c.overallScore ? parseInt(c.overallScore.split("-")[0]) : 0;
                const winsB = c.overallScore ? parseInt(c.overallScore.split("-")[1]) : 0;
                const winnerIsA = c.overallWinnerId === c.entityAId;
                const winnerIsB = c.overallWinnerId === c.entityBId;
                const winnerName = winnerIsA ? c.entityAName : winnerIsB ? c.entityBName : null;

                return (
                  <Link
                    key={c.id}
                    href={`/brokers/compare/${c.slug}`}
                    className="group block"
                    data-testid={`link-comparison-${c.id}`}
                  >
                    <div
                      className="rounded-2xl transition-all duration-200 group-hover:shadow-md"
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e8edea",
                      }}
                    >
                      {/* Winner bar */}
                      {winnerName && (
                        <div
                          className="px-6 py-2 rounded-t-2xl flex items-center gap-2"
                          style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0" }}
                        >
                          <Trophy className="w-3.5 h-3.5" style={{ color: "#16a34a" }} />
                          <span className="text-xs font-semibold" style={{ color: "#15803d" }}>
                            {winnerName} wins this comparison
                          </span>
                          {c.overallScore && (
                            <span
                              className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "#dcfce7", color: "#15803d" }}
                            >
                              {c.overallScore}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="p-6 flex items-center gap-4">
                        {/* Entity A */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <BrokerLogo name={c.entityAName} logoUrl={logoA} />
                            <div className="min-w-0">
                              <p
                                className="font-bold text-base leading-tight truncate group-hover:text-[#15803d] transition-colors"
                                style={{ color: "#111827" }}
                              >
                                {c.entityAName}
                              </p>
                              {ratingA != null && ratingA > 0 && (
                                <div className="mt-1">
                                  <StarRating rating={ratingA} />
                                </div>
                              )}
                              {winnerIsA && (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
                                  style={{ background: "#dcfce7", color: "#15803d" }}
                                >
                                  <Trophy className="w-2.5 h-2.5" /> Winner
                                </span>
                              )}
                            </div>
                          </div>
                          {regulationA && (
                            <p className="text-xs flex items-center gap-1 truncate" style={{ color: "#6b7280" }}>
                              <Shield className="w-3 h-3 flex-shrink-0" style={{ color: "#9ca3af" }} />
                              {String(regulationA).split(",").slice(0, 2).join(", ")}
                            </p>
                          )}
                          {winsA > 0 && (
                            <p className="text-xs font-semibold mt-1" style={{ color: winnerIsA ? "#15803d" : "#9ca3af" }}>
                              {winsA} categor{winsA === 1 ? "y" : "ies"} won
                            </p>
                          )}
                        </div>

                        {/* VS */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-1 px-4">
                          <span
                            className="text-3xl font-black tracking-tighter leading-none select-none"
                            style={{ color: "#d1fae5", WebkitTextStroke: "1.5px #2bb32a" }}
                          >
                            VS
                          </span>
                          <ArrowRight
                            className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "#2bb32a" }}
                          />
                        </div>

                        {/* Entity B */}
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-3 mb-2 justify-end">
                            <div className="min-w-0">
                              <p
                                className="font-bold text-base leading-tight truncate group-hover:text-[#15803d] transition-colors"
                                style={{ color: "#111827" }}
                              >
                                {c.entityBName}
                              </p>
                              {ratingB != null && ratingB > 0 && (
                                <div className="mt-1 flex justify-end">
                                  <StarRating rating={ratingB} />
                                </div>
                              )}
                              {winnerIsB && (
                                <div className="flex justify-end mt-1">
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: "#dcfce7", color: "#15803d" }}
                                  >
                                    <Trophy className="w-2.5 h-2.5" /> Winner
                                  </span>
                                </div>
                              )}
                            </div>
                            <BrokerLogo name={c.entityBName ?? ""} logoUrl={logoB} />
                          </div>
                          {regulationB && (
                            <p className="text-xs flex items-center gap-1 justify-end truncate" style={{ color: "#6b7280" }}>
                              {String(regulationB).split(",").slice(0, 2).join(", ")}
                              <Shield className="w-3 h-3 flex-shrink-0" style={{ color: "#9ca3af" }} />
                            </p>
                          )}
                          {winsB > 0 && (
                            <p className="text-xs font-semibold mt-1" style={{ color: winnerIsB ? "#15803d" : "#9ca3af" }}>
                              {winsB} categor{winsB === 1 ? "y" : "ies"} won
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer bar */}
                      <div
                        className="px-6 py-2.5 rounded-b-2xl flex items-center justify-between"
                        style={{ background: "#fafcfa", borderTop: "1px solid #f0f4f2" }}
                      >
                        <span className="text-xs" style={{ color: "#9ca3af" }}>
                          {c.publishedAt
                            ? new Date(c.publishedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
                            : "EntryLab Analysis"}
                        </span>
                        <span
                          className="text-xs font-semibold flex items-center gap-1 group-hover:text-[#15803d] transition-colors"
                          style={{ color: "#374151" }}
                        >
                          View comparison <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
