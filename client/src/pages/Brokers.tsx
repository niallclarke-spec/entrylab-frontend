import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { BrokerCardEnhanced } from "@/components/BrokerCardEnhanced";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Star, TrendingUp, Zap, DollarSign, Headphones, FileText, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { trackPageView, trackCategoryFilter } from "@/lib/gtm";
import { transformBroker } from "@/lib/transforms";
import type { Broker } from "@shared/schema";

const GLASS = {
  background: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(16px) saturate(200%)",
  WebkitBackdropFilter: "blur(16px) saturate(200%)",
  border: "1px solid rgba(255,255,255,0.38)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.65)",
} as const;

const DECISION_FACTORS = [
  { icon: Shield, title: "Check Regulation", desc: "Verify broker licensing & regulatory compliance to ensure your funds are protected" },
  { icon: DollarSign, title: "Compare Spreads", desc: "Find competitive trading costs and transparent pricing for better profitability" },
  { icon: Headphones, title: "Test Support", desc: "Ensure reliable customer service with 24/7 availability and quick response times" },
  { icon: FileText, title: "Read Reviews", desc: "Check real trader experiences and independent reviews before making your choice" },
];

export default function Brokers() {
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);

  useEffect(() => {
    trackPageView("/brokers", "Broker Reviews | EntryLab");
  }, []);

  useEffect(() => {
    document.body.style.setProperty("background", "#f8faf8", "important");
    document.documentElement.style.setProperty("background", "#f8faf8", "important");
    return () => {
      document.body.style.removeProperty("background");
      document.documentElement.style.removeProperty("background");
    };
  }, []);

  const { data: wordpressBrokers, isLoading } = useQuery<any[]>({
    queryKey: ["/api/wordpress/brokers"],
  });

  const brokers = wordpressBrokers?.map(transformBroker).filter((b): b is Broker => b !== null) || [];
  const filteredBrokers = filterFeatured === null ? brokers : brokers.filter(b => b.featured === filterFeatured);
  const featuredCount = brokers.filter(b => b.featured).length;
  const avgRating = brokers.length > 0 ? (brokers.reduce((sum, b) => sum + b.rating, 0) / brokers.length).toFixed(1) : "0.0";
  const totalVerified = brokers.filter(b => b.verified).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}>
        <Navigation />
        <div style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-14">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-5 w-32 mb-4 opacity-20" />
            <Skeleton className="h-12 w-80 mb-3 opacity-20" />
            <Skeleton className="h-5 w-64 opacity-20" />
          </div>
        </div>
        <div className="flex-1 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}
    >
      <SEO
        title="Broker Reviews | EntryLab"
        description="Compare and review the top forex brokers. Find verified brokers with competitive spreads, fast execution, and trusted regulation."
        url="https://entrylab.io/brokers"
        breadcrumbs={[
          { name: "Home", url: "https://entrylab.io" },
          { name: "Brokers", url: "https://entrylab.io/brokers" },
        ]}
      />
      <Navigation />

      {/* ── Dark page hero ── */}
      <div style={{ background: "#1a1e1c" }} className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-18">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                style={{ background: "rgba(43,179,42,0.10)", color: "#6ee870", border: "1px solid rgba(43,179,42,0.22)" }}
              >
                <CheckCircle2 className="h-3 w-3" />
                Broker Reviews
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight" style={{ color: "#f9fafb" }}>
                Top CFD Brokers
              </h1>
              <p className="text-base md:text-lg max-w-xl" style={{ color: "#9ca3af" }}>
                Compare {brokers.length} verified brokers with unbiased reviews based on real trading conditions
              </p>
            </div>

            <div className="flex flex-wrap gap-3 md:flex-shrink-0">
              {[
                { icon: Shield, label: "Verified", value: totalVerified },
                { icon: Star, label: "Avg Rating", value: avgRating },
                { icon: TrendingUp, label: "Top Rated", value: featuredCount },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" style={{ color: "#6ee870" }} />
                  <div>
                    <p className="text-lg font-bold leading-none" style={{ color: "#f9fafb" }}>{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Light content surface ── */}
      <div className="relative flex-1">
        {/* Decorative orbs */}
        <div className="pointer-events-none" aria-hidden="true">
          <div style={{ position: "absolute", top: "5%", left: "5%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(43,179,42,0.05) 0%, transparent 65%)", filter: "blur(100px)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", top: "40%", right: "0%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 65%)", filter: "blur(110px)", borderRadius: "50%" }} />
        </div>

        <div className="relative">
          {/* Filter tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: `All Brokers (${brokers.length})`, value: null },
                { label: `Featured (${featuredCount})`, value: true, icon: Star },
              ].map(({ label, value, icon: Icon }) => {
                const isSelected = filterFeatured === value;
                return (
                  <button
                    key={label}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer"
                    style={{
                      background: isSelected ? "rgba(43,179,42,0.08)" : "rgba(255,255,255,0.55)",
                      border: isSelected ? "1px solid rgba(43,179,42,0.15)" : "1px solid rgba(255,255,255,0.70)",
                      color: isSelected ? "#14531a" : "#374151",
                    }}
                    onClick={() => {
                      setFilterFeatured(value);
                      trackCategoryFilter("broker", value === null ? "all" : "featured");
                    }}
                    data-testid={`badge-filter-${value === null ? "all" : "featured"}`}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Decision Factors */}
          <section className="py-12 md:py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="mb-8">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
                  style={{ background: "rgba(43,179,42,0.07)", color: "#186818", border: "1px solid rgba(43,179,42,0.14)" }}
                >
                  Broker Guide
                </div>
                <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#111827" }}>
                  What to Look for in a Forex Broker
                </h2>
                <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Make an informed decision with these key factors</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {DECISION_FACTORS.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex flex-col p-5 rounded-2xl transition-all duration-200"
                    style={GLASS}
                    data-testid={`card-decision-${title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-xl mb-4 flex-shrink-0"
                      style={{ background: "rgba(43,179,42,0.07)", border: "1px solid rgba(43,179,42,0.13)" }}
                    >
                      <Icon className="h-5 w-5" style={{ color: "#186818" }} />
                    </div>
                    <h3 className="text-sm font-bold mb-1.5" style={{ color: "#111827" }}>{title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Brokers grid */}
          <section className="py-4 md:py-8 pb-20" style={{ borderTop: "1px solid rgba(255,255,255,0.4)" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
                <div>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3"
                    style={{ background: "rgba(43,179,42,0.07)", color: "#186818", border: "1px solid rgba(43,179,42,0.14)" }}
                  >
                    Verified &amp; Rated
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: "#111827" }}>
                    Top Forex Brokers
                  </h2>
                  <p className="text-base" style={{ color: "#6b7280" }}>
                    Compare and choose from our curated selection of trusted brokers
                  </p>
                </div>
              </div>

              {filteredBrokers.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {filteredBrokers.map((broker, index) => (
                    <BrokerCardEnhanced
                      key={broker.id}
                      name={broker.name}
                      logo={broker.logo}
                      verified={broker.verified}
                      rating={broker.rating}
                      pros={broker.pros}
                      highlights={broker.highlights}
                      link={broker.link}
                      featured={broker.featured}
                      slug={broker.slug}
                      type="broker"
                      pageLocation="brokers"
                      placementType={filterFeatured === true ? "top_rated_card" : "broker_list_card"}
                      position={index + 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p style={{ color: "#6b7280" }}>No brokers found with the selected filter.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
