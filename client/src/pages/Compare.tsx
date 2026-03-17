import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Broker } from "@shared/schema";
import type { ComparisonRecord } from "@shared/schema";
import { Star, X, Plus, ExternalLink, Shield, DollarSign, TrendingUp, Monitor, CreditCard, Headphones, Check, Minus, Trophy, ArrowRight, GitCompare, Flame } from "lucide-react";
import { Link } from "wouter";

const COMPARISON_ROWS: { label: string; key: keyof Broker; icon: any }[] = [
  { label: "Rating", key: "rating", icon: Star },
  { label: "Regulation", key: "regulation", icon: Shield },
  { label: "Min Deposit", key: "minDeposit", icon: DollarSign },
  { label: "Max Leverage", key: "maxLeverage", icon: TrendingUp },
  { label: "Spread From", key: "spreadFrom", icon: TrendingUp },
  { label: "Platforms", key: "platforms", icon: Monitor },
  { label: "Payment Methods", key: "paymentMethods", icon: CreditCard },
  { label: "Headquarters", key: "headquarters", icon: Headphones },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= Math.round(rating) ? "text-[#2bb32a] fill-[#2bb32a]" : "text-gray-300"}`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
    </div>
  );
}

function BrokerSearchDropdown({
  brokers,
  selectedIds,
  onSelect,
  placeholder,
}: {
  brokers: Broker[];
  selectedIds: string[];
  onSelect: (broker: Broker) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      brokers
        .filter(
          (b) =>
            !selectedIds.includes(b.id) &&
            b.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8),
    [brokers, selectedIds, query]
  );

  return (
    <div className="relative w-64">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2bb32a]/30 focus:border-[#2bb32a]/60 transition-all"
        data-testid="input-broker-search"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filtered.map((b) => (
            <button
              key={b.id}
              onMouseDown={() => {
                onSelect(b);
                setQuery("");
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              data-testid={`option-broker-${b.slug}`}
            >
              {b.logo && (
                <img src={b.logo} alt={b.name} className="w-8 h-5 object-contain rounded" />
              )}
              <span className="font-medium">{b.name}</span>
              {b.rating && (
                <span className="ml-auto text-xs text-gray-400">{b.rating}/5</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Compare() {
  const [selectedBrokers, setSelectedBrokers] = useState<Broker[]>([]);

  const { data: rawBrokers, isLoading } = useQuery<any[]>({
    queryKey: ["/api/brokers"],
  });

  const { data: popularComparisons } = useQuery<ComparisonRecord[]>({
    queryKey: ["/api/comparisons/hub/broker"],
    queryFn: async () => {
      const res = await fetch("/api/comparisons/hub/broker");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const brokers: Broker[] = useMemo(
    () => (rawBrokers || []) as Broker[],
    [rawBrokers]
  );

  const brokerMap = useMemo(() => {
    const map = new Map<string, Broker>();
    brokers.forEach((b) => { map.set(b.slug, b); map.set(b.id, b); });
    return map;
  }, [brokers]);

  const addBroker = (broker: Broker) => {
    if (selectedBrokers.length < 4 && !selectedBrokers.find((b) => b.id === broker.id)) {
      setSelectedBrokers((prev) => [...prev, broker]);
    }
  };

  const removeBroker = (id: string) => {
    setSelectedBrokers((prev) => prev.filter((b) => b.id !== id));
  };

  const selectedIds = selectedBrokers.map((b) => b.id);

  const canAddMore = selectedBrokers.length < 4;

  function renderCell(broker: Broker, key: keyof Broker) {
    const value = broker[key];
    if (key === "rating") return <StarRating rating={broker.rating} />;
    if (!value) return <span className="text-gray-300 text-sm">—</span>;
    if (Array.isArray(value)) {
      return (
        <ul className="space-y-1">
          {(value as string[]).map((v, i) => (
            <li key={i} className="flex items-start gap-1.5 text-sm text-gray-600">
              <Check className="w-3.5 h-3.5 text-[#2bb32a] mt-0.5 flex-shrink-0" />
              {v}
            </li>
          ))}
        </ul>
      );
    }
    return <span className="text-sm text-gray-700">{String(value)}</span>;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}>
      <SEO
        title="Compare Forex Brokers Side by Side | EntryLab"
        description="Compare forex brokers on regulation, min deposit, leverage, platforms and spreads. Find the best broker for your trading style."
      />
      <Navigation />

      {/* Hero */}
      <div style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: "rgba(43,179,42,0.12)", color: "#2bb32a", border: "1px solid rgba(43,179,42,0.2)" }}>
            <TrendingUp className="w-3 h-3" />
            Broker Comparison Tool
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Compare Forex Brokers</h1>
          <p className="text-gray-400 text-base max-w-2xl">
            Select up to 4 brokers to compare side by side on regulation, fees, leverage, platforms and more.
          </p>
        </div>
      </div>

      {/* Selector bar */}
      <div className="sticky top-16 z-40 border-b" style={{ background: "rgba(248,250,248,0.95)", backdropFilter: "blur(12px)", borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-gray-600 mr-1">Add broker:</span>
            {isLoading ? (
              <Skeleton className="h-10 w-64 rounded-lg" />
            ) : (
              canAddMore && (
                <BrokerSearchDropdown
                  brokers={brokers}
                  selectedIds={selectedIds}
                  onSelect={addBroker}
                  placeholder="Search brokers..."
                />
              )
            )}
            {selectedBrokers.map((b) => (
              <div key={b.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700">
                {b.name}
                <button
                  onClick={() => removeBroker(b.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  data-testid={`button-remove-${b.slug}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {selectedBrokers.length > 0 && (
              <button
                onClick={() => setSelectedBrokers([])}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors ml-auto"
                data-testid="button-clear-all"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {selectedBrokers.length === 0 ? (
            /* Popular Comparisons discovery section */
            <div className="py-6">
              {/* Section header */}
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg" style={{ background: "rgba(43,179,42,0.1)" }}>
                    <Flame className="w-4 h-4" style={{ color: "#2bb32a" }} />
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: "#111827" }}>Popular Broker Comparisons</h2>
                </div>
                <Link href="/compare/broker" className="text-sm font-semibold flex items-center gap-1 hover:underline" style={{ color: "#15803d" }}>
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {!popularComparisons ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                </div>
              ) : popularComparisons.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ background: "#ffffff", border: "1px solid #e8edea" }}>
                  <GitCompare className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#374151" }} />
                  <p className="font-medium" style={{ color: "#374151" }}>No comparisons published yet</p>
                  <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>Use the search above to build a custom comparison</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {popularComparisons.slice(0, 9).map((c) => {
                    const bA = brokerMap.get(c.entityASlug) || brokerMap.get(c.entityAId);
                    const bB = brokerMap.get(c.entityBSlug ?? "") || brokerMap.get(c.entityBId ?? "");
                    const logoA = bA?.logoUrl;
                    const logoB = bB?.logoUrl;
                    const winnerIsA = c.overallWinnerId === c.entityAId;
                    const winnerIsB = c.overallWinnerId === c.entityBId;
                    const winnerName = winnerIsA ? c.entityAName : winnerIsB ? c.entityBName : null;

                    return (
                      <Link
                        key={c.id}
                        href={`/compare/broker/${c.slug}`}
                        className="group block"
                        data-testid={`link-popular-${c.id}`}
                      >
                        <div
                          className="rounded-2xl p-4 transition-all duration-200 group-hover:shadow-md"
                          style={{ background: "#ffffff", border: "1px solid #e8edea" }}
                        >
                          {/* Broker pair row */}
                          <div className="flex items-center gap-2 mb-3">
                            {/* Logo A */}
                            <div className="flex-shrink-0">
                              {logoA ? (
                                <img src={logoA} alt={c.entityAName} className="w-9 h-9 rounded-lg object-contain bg-white p-1" style={{ border: "1px solid #e8edea" }} />
                              ) : (
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black text-white" style={{ background: "#2bb32a" }}>
                                  {c.entityAName.charAt(0)}
                                </div>
                              )}
                            </div>

                            {/* Names */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold leading-tight truncate group-hover:text-[#15803d] transition-colors" style={{ color: "#111827" }}>
                                {c.entityAName}
                              </p>
                            </div>

                            {/* VS pill */}
                            <span className="flex-shrink-0 text-xs font-black px-2 py-0.5 rounded-full" style={{ background: "#f0fdf4", color: "#2bb32a", border: "1px solid #bbf7d0" }}>
                              VS
                            </span>

                            {/* Names B */}
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-sm font-bold leading-tight truncate group-hover:text-[#15803d] transition-colors" style={{ color: "#111827" }}>
                                {c.entityBName}
                              </p>
                            </div>

                            {/* Logo B */}
                            <div className="flex-shrink-0">
                              {logoB ? (
                                <img src={logoB} alt={c.entityBName ?? ""} className="w-9 h-9 rounded-lg object-contain bg-white p-1" style={{ border: "1px solid #e8edea" }} />
                              ) : (
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black text-white" style={{ background: "#2bb32a" }}>
                                  {(c.entityBName ?? "?").charAt(0)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between">
                            {winnerName ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#15803d" }}>
                                <Trophy className="w-3 h-3" /> {winnerName}
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>No overall winner</span>
                            )}
                            <span className="text-[11px] font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#2bb32a" }}>
                              Read analysis <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Separator before custom tool hint */}
              <div className="mt-10 mb-2 flex items-center gap-4">
                <div className="flex-1 h-px" style={{ background: "#e8edea" }} />
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "#9ca3af" }}>or build your own</span>
                <div className="flex-1 h-px" style={{ background: "#e8edea" }} />
              </div>
              <p className="text-center text-sm" style={{ color: "#6b7280" }}>
                Use the search bar above to select up to 4 brokers and create a custom side-by-side comparison.
              </p>
            </div>
          ) : (
            /* Comparison table */
            <div className="overflow-x-auto">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `200px repeat(${selectedBrokers.length}, minmax(200px, 1fr))`,
                }}
                className="min-w-fit"
              >
                {/* Header row — broker cards */}
                <div className="bg-transparent" />
                {selectedBrokers.map((broker) => (
                  <div
                    key={broker.id}
                    className="p-5 flex flex-col items-center text-center gap-3 bg-white rounded-t-2xl border border-b-0 border-gray-200 mx-1"
                    data-testid={`column-broker-${broker.slug}`}
                  >
                    <div className="relative w-full flex justify-end">
                      <button
                        onClick={() => removeBroker(broker.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        data-testid={`button-remove-col-${broker.slug}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <img
                      src={broker.logo}
                      alt={broker.name}
                      className="h-10 max-w-[120px] object-contain"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{broker.name}</p>
                      {broker.featured && (
                        <Badge className="mt-1 text-[10px]" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a", border: "1px solid rgba(43,179,42,0.2)" }}>
                          Featured
                        </Badge>
                      )}
                    </div>
                    <StarRating rating={broker.rating} />
                    <a
                      href={broker.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 text-xs font-semibold text-white rounded-lg flex items-center justify-center gap-1 transition-colors"
                      style={{ background: "#2bb32a" }}
                      data-testid={`link-visit-${broker.slug}`}
                    >
                      Visit Broker <ExternalLink className="w-3 h-3" />
                    </a>
                    <Link
                      href={`/broker/${broker.slug}`}
                      className="text-xs text-[#2bb32a] hover:underline"
                      data-testid={`link-review-${broker.slug}`}
                    >
                      Full Review
                    </Link>
                  </div>
                ))}

                {/* Data rows */}
                {COMPARISON_ROWS.map(({ label, key, icon: Icon }, rowIdx) => (
                  <>
                    {/* Label cell */}
                    <div
                      key={`label-${key}`}
                      className={`flex items-center gap-2 px-4 py-4 ${rowIdx % 2 === 0 ? "bg-white/60" : "bg-transparent"}`}
                    >
                      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-600">{label}</span>
                    </div>

                    {/* Value cells */}
                    {selectedBrokers.map((broker) => (
                      <div
                        key={`${broker.id}-${key}`}
                        className={`px-5 py-4 mx-1 border-x border-gray-200 ${rowIdx % 2 === 0 ? "bg-white/60" : "bg-white"}`}
                      >
                        {renderCell(broker, key)}
                      </div>
                    ))}
                  </>
                ))}

                {/* Pros row */}
                <div className="flex items-start gap-2 px-4 py-4 bg-white/60">
                  <Check className="w-4 h-4 text-[#2bb32a] flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-600">Pros</span>
                </div>
                {selectedBrokers.map((broker) => (
                  <div key={`${broker.id}-pros`} className="px-5 py-4 mx-1 border-x border-gray-200 bg-white/60">
                    <ul className="space-y-1.5">
                      {(broker.pros || []).map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-gray-600">
                          <Check className="w-3.5 h-3.5 text-[#2bb32a] mt-0.5 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Cons row */}
                <div className="flex items-start gap-2 px-4 py-4">
                  <Minus className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-600">Cons</span>
                </div>
                {selectedBrokers.map((broker) => (
                  <div key={`${broker.id}-cons`} className="px-5 py-4 mx-1 border-x border-gray-200">
                    <ul className="space-y-1.5">
                      {(broker.cons || []).length > 0 ? (
                        (broker.cons as string[]).map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-sm text-gray-500">
                            <Minus className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </ul>
                  </div>
                ))}

                {/* Bottom CTA row */}
                <div className="bg-transparent" />
                {selectedBrokers.map((broker) => (
                  <div
                    key={`${broker.id}-cta`}
                    className="p-5 flex flex-col items-center gap-3 bg-white rounded-b-2xl border border-t-0 border-gray-200 mx-1"
                  >
                    <a
                      href={broker.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 text-sm font-semibold text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      style={{ background: "#2bb32a" }}
                      data-testid={`link-cta-${broker.slug}`}
                    >
                      Open Account <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Broker grid for discovery */}
          {selectedBrokers.length === 0 && !isLoading && brokers.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-semibold text-gray-700 mb-6">All Brokers</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {brokers.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => addBroker(b)}
                    className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-200 hover-elevate transition-all text-center"
                    data-testid={`button-add-broker-${b.slug}`}
                  >
                    <img src={b.logo} alt={b.name} className="h-8 max-w-[100px] object-contain" />
                    <span className="text-xs font-medium text-gray-600">{b.name}</span>
                    <span className="text-xs text-gray-400">{b.rating}/5</span>
                    <span className="text-[10px] text-[#2bb32a] opacity-0 group-hover:opacity-100 transition-opacity">+ Compare</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
