import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { Home, GitCompare, Trophy, Star, ArrowRight, Shield, Building2, TrendingUp } from "lucide-react";
import type { ComparisonRecord } from "@shared/schema";

function EntityLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const [err, setErr] = useState(false);
  if (logoUrl && !err) {
    return (
      <img
        src={logoUrl}
        alt={name}
        onError={() => setErr(true)}
        className="w-12 h-12 object-contain rounded-xl bg-white p-1.5 flex-shrink-0"
        style={{ border: "1px solid #e8edea" }}
      />
    );
  }
  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-black text-white flex-shrink-0"
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
          className={`w-2.5 h-2.5 ${s <= stars ? "fill-[#f59e0b] text-[#f59e0b]" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
      <span className="text-[11px] font-medium ml-0.5" style={{ color: "#6b7280" }}>{rating.toFixed(1)}</span>
    </div>
  );
}

function ComparisonCard({ c, brokerMap, entityType }: {
  c: ComparisonRecord;
  brokerMap: Map<string, any>;
  entityType: "broker" | "prop_firm";
}) {
  const eA = brokerMap.get(c.entityASlug) || brokerMap.get(c.entityAId);
  const eB = brokerMap.get(c.entityBSlug ?? "") || brokerMap.get(c.entityBId ?? "");
  const logoA = eA?.logoUrl || eA?.logo;
  const logoB = eB?.logoUrl || eB?.logo;
  const ratingA = eA?.rating ? parseFloat(String(eA.rating)) : null;
  const ratingB = eB?.rating ? parseFloat(String(eB.rating)) : null;
  const regulationA = eA?.regulation || eA?.regulators;
  const regulationB = eB?.regulation || eB?.regulators;
  const winsA = c.overallScore ? parseInt(c.overallScore.split("-")[0]) : 0;
  const winsB = c.overallScore ? parseInt(c.overallScore.split("-")[1]) : 0;
  const winnerIsA = c.overallWinnerId === c.entityAId;
  const winnerIsB = c.overallWinnerId === c.entityBId;
  const winnerName = winnerIsA ? c.entityAName : winnerIsB ? c.entityBName : null;

  return (
    <Link
      href={`/compare/${entityType === "prop_firm" ? "prop-firm" : "broker"}/${c.slug}`}
      className="group block"
      data-testid={`link-comparison-${c.id}`}
    >
      <div
        className="rounded-2xl transition-all duration-200 group-hover:shadow-md"
        style={{ background: "#ffffff", border: "1px solid #e8edea" }}
      >
        {/* Winner bar */}
        {winnerName && (
          <div
            className="px-4 py-1.5 rounded-t-2xl flex items-center gap-2"
            style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0" }}
          >
            <Trophy className="w-3 h-3 flex-shrink-0" style={{ color: "#16a34a" }} />
            <span className="text-xs font-semibold truncate" style={{ color: "#15803d" }}>
              {winnerName} wins
            </span>
            {c.overallScore && (
              <span
                className="ml-auto flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "#dcfce7", color: "#15803d" }}
              >
                {c.overallScore}
              </span>
            )}
          </div>
        )}

        <div className="p-4 flex items-center gap-3">
          {/* Entity A */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <EntityLogo name={c.entityAName} logoUrl={logoA} />
              <div className="min-w-0">
                <p
                  className="font-bold text-sm leading-tight truncate group-hover:text-[#15803d] transition-colors"
                  style={{ color: "#111827" }}
                >
                  {c.entityAName}
                </p>
                {ratingA != null && ratingA > 0 && <StarRating rating={ratingA} />}
                {winnerIsA && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                    style={{ background: "#dcfce7", color: "#15803d" }}
                  >
                    <Trophy className="w-2 h-2" /> Win
                  </span>
                )}
              </div>
            </div>
            {regulationA && (
              <p className="text-[11px] flex items-center gap-1 truncate" style={{ color: "#9ca3af" }}>
                <Shield className="w-2.5 h-2.5 flex-shrink-0" />
                {String(regulationA).split(",")[0].trim()}
              </p>
            )}
            {winsA > 0 && (
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: winnerIsA ? "#15803d" : "#d1d5db" }}>
                {winsA} {winsA === 1 ? "win" : "wins"}
              </p>
            )}
          </div>

          {/* VS */}
          <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
            <span
              className="text-xl font-black tracking-tighter leading-none select-none"
              style={{ color: "#d1fae5", WebkitTextStroke: "1.5px #2bb32a" }}
            >
              VS
            </span>
          </div>

          {/* Entity B */}
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center gap-2 mb-1 justify-end">
              <div className="min-w-0">
                <p
                  className="font-bold text-sm leading-tight truncate group-hover:text-[#15803d] transition-colors"
                  style={{ color: "#111827" }}
                >
                  {c.entityBName}
                </p>
                {ratingB != null && ratingB > 0 && (
                  <div className="flex justify-end"><StarRating rating={ratingB} /></div>
                )}
                {winnerIsB && (
                  <div className="flex justify-end mt-0.5">
                    <span
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "#dcfce7", color: "#15803d" }}
                    >
                      <Trophy className="w-2 h-2" /> Win
                    </span>
                  </div>
                )}
              </div>
              <EntityLogo name={c.entityBName ?? ""} logoUrl={logoB} />
            </div>
            {regulationB && (
              <p className="text-[11px] flex items-center gap-1 justify-end truncate" style={{ color: "#9ca3af" }}>
                {String(regulationB).split(",")[0].trim()}
                <Shield className="w-2.5 h-2.5 flex-shrink-0" />
              </p>
            )}
            {winsB > 0 && (
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: winnerIsB ? "#15803d" : "#d1d5db" }}>
                {winsB} {winsB === 1 ? "win" : "wins"}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2 rounded-b-2xl flex items-center justify-between"
          style={{ background: "#fafcfa", borderTop: "1px solid #f0f4f2" }}
        >
          <span className="text-[11px]" style={{ color: "#9ca3af" }}>
            {c.publishedAt
              ? new Date(c.publishedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
              : "EntryLab Analysis"}
          </span>
          <span
            className="text-[11px] font-semibold flex items-center gap-0.5 group-hover:text-[#15803d] transition-colors"
            style={{ color: "#374151" }}
          >
            View <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ComparisonColumn({
  title,
  icon: Icon,
  accentColor,
  comparisons,
  brokerMap,
  entityType,
  hubHref,
  isLoading,
}: {
  title: string;
  icon: any;
  accentColor: string;
  comparisons?: ComparisonRecord[];
  brokerMap: Map<string, any>;
  entityType: "broker" | "prop_firm";
  hubHref: string;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col min-w-0">
      {/* Column header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl mb-4 flex-wrap gap-2"
        style={{ background: "#ffffff", border: "1px solid #e8edea" }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: `${accentColor}18` }}>
            <Icon className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: "#111827" }}>{title}</h2>
            {comparisons && (
              <p className="text-[11px]" style={{ color: "#9ca3af" }}>{comparisons.length} published</p>
            )}
          </div>
        </div>
        <Link
          href={hubHref}
          className="text-xs font-semibold flex items-center gap-1 hover:underline"
          style={{ color: "#15803d" }}
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : !comparisons?.length ? (
        <div
          className="text-center py-12 rounded-2xl"
          style={{ background: "#ffffff", border: "1px solid #e8edea" }}
        >
          <GitCompare className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "#374151" }} />
          <p className="text-sm font-medium" style={{ color: "#374151" }}>None published yet</p>
          <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>Check back soon</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comparisons.map((c) => (
            <ComparisonCard key={c.id} c={c} brokerMap={brokerMap} entityType={entityType} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Compare() {
  const { data: brokerComparisons, isLoading: loadingBrokers } = useQuery<ComparisonRecord[]>({
    queryKey: ["/api/comparisons/hub/broker"],
    queryFn: async () => {
      const res = await fetch("/api/comparisons/hub/broker");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: propFirmComparisons, isLoading: loadingPropFirms } = useQuery<ComparisonRecord[]>({
    queryKey: ["/api/comparisons/hub/prop_firm"],
    queryFn: async () => {
      const res = await fetch("/api/comparisons/hub/prop_firm");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: brokers } = useQuery<any[]>({ queryKey: ["/api/brokers"] });
  const { data: propFirms } = useQuery<any[]>({ queryKey: ["/api/prop-firms"] });

  useEffect(() => {
    document.body.style.setProperty("background", "#f5f7f6", "important");
    return () => { document.body.style.removeProperty("background"); };
  }, []);

  const entityMap = new Map<string, any>();
  brokers?.forEach((b) => { entityMap.set(b.slug, b); entityMap.set(b.id, b); });
  propFirms?.forEach((p) => { entityMap.set(p.slug, p); entityMap.set(p.id, p); });

  const totalCount = (brokerComparisons?.length ?? 0) + (propFirmComparisons?.length ?? 0);

  return (
    <>
      <SEO
        title="Broker & Prop Firm Comparisons | EntryLab"
        description="Browse head-to-head comparisons of top forex brokers and prop firms. Regulation, fees, funding rules, payouts and more — all analysed for you."
      />
      <Navigation />

      <main style={{ background: "#f5f7f6", minHeight: "100vh" }}>
        {/* Hero */}
        <div style={{ background: "#1a1e1c" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
            <nav className="flex items-center gap-2 text-xs mb-5 flex-wrap" style={{ color: "rgba(255,255,255,0.35)" }}>
              <Link href="/" className="hover:text-white/70 flex items-center gap-1 transition-colors">
                <Home className="w-3 h-3" /> Home
              </Link>
              <span>/</span>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Compare</span>
            </nav>

            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl flex-shrink-0 hidden sm:flex"
                style={{ background: "rgba(43,179,42,0.15)", border: "1px solid rgba(43,179,42,0.25)" }}
              >
                <GitCompare className="w-6 h-6" style={{ color: "#2bb32a" }} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Broker & Prop Firm Comparisons
                </h1>
                <p className="text-base max-w-2xl" style={{ color: "rgba(255,255,255,0.55)" }}>
                  In-depth head-to-head analysis. Pick any matchup to see how they stack up across regulation, fees, funding rules, and more.
                </p>
                {totalCount > 0 && (
                  <p className="text-sm mt-3 font-medium" style={{ color: "#2bb32a" }}>
                    {totalCount} comparisons published
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 items-start">
            {/* Broker column */}
            <ComparisonColumn
              title="Broker Comparisons"
              icon={TrendingUp}
              accentColor="#2bb32a"
              comparisons={brokerComparisons}
              brokerMap={entityMap}
              entityType="broker"
              hubHref="/compare/broker"
              isLoading={loadingBrokers}
            />

            {/* Prop Firm column */}
            <ComparisonColumn
              title="Prop Firm Comparisons"
              icon={Building2}
              accentColor="#6366f1"
              comparisons={propFirmComparisons}
              brokerMap={entityMap}
              entityType="prop_firm"
              hubHref="/compare/prop-firm"
              isLoading={loadingPropFirms}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
