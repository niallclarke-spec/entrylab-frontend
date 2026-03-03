import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PropFirmRow } from "@/components/PropFirmRow";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Star, TrendingUp, Zap, DollarSign, Target, CheckCircle2, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trackPageView, trackCategoryFilter } from "@/lib/gtm";
import { transformPropFirm } from "@/lib/transforms";
import type { Broker } from "@shared/schema";

interface PropFirmCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

const GLASS = {
  background: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(16px) saturate(200%)",
  WebkitBackdropFilter: "blur(16px) saturate(200%)",
  border: "1px solid rgba(255,255,255,0.38)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.65)",
} as const;

const DECISION_FACTORS = [
  { icon: DollarSign, title: "Profit Split", desc: "Compare profit sharing ratios and find firms offering competitive trader compensation" },
  { icon: Target, title: "Evaluation Process", desc: "Review challenge difficulty, time limits, and rules to find programs that match your style" },
  { icon: TrendingUp, title: "Scaling Plans", desc: "Check account scaling opportunities and maximum funding available for successful traders" },
  { icon: Zap, title: "Payout Speed", desc: "Verify withdrawal frequency and processing times to ensure timely access to your profits" },
];

export default function PropFirms() {
  const params = useParams<{ category?: string }>();
  const [, setLocation] = useLocation();
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);

  const { data: wordpressPropFirms, isLoading } = useQuery<any[]>({
    queryKey: ["/api/wordpress/prop-firms"],
  });

  const { data: categories = [] } = useQuery<PropFirmCategory[]>({
    queryKey: ["/api/wordpress/prop-firm-categories"],
  });

  const urlCategory = params.category
    ? categories.find(cat => cat.slug === params.category)
    : null;

  const selectedCategory = urlCategory?.id || null;

  const propFirms = wordpressPropFirms
    ?.map(transformPropFirm)
    .filter((p): p is Broker & { categoryIds: number[] } => p !== null) || [];

  let filteredPropFirms = propFirms;
  if (filterFeatured !== null) filteredPropFirms = filteredPropFirms.filter(p => p.featured === filterFeatured);
  if (selectedCategory !== null) filteredPropFirms = filteredPropFirms.filter(p => p.categoryIds.includes(selectedCategory));

  const featuredCount = propFirms.filter(p => p.featured).length;
  const avgRating = propFirms.length > 0
    ? (propFirms.reduce((sum, p) => sum + p.rating, 0) / propFirms.length).toFixed(1)
    : "0.0";
  const totalVerified = propFirms.filter(p => p.verified).length;

  const pageTitle = urlCategory ? `${urlCategory.name} Prop Firms | EntryLab` : "Prop Firm Reviews | EntryLab";
  const pageDescription = urlCategory
    ? `Compare top prop trading firms with ${urlCategory.name.toLowerCase()}. Find the best funded trading opportunities with competitive profit splits and evaluation processes.`
    : "Compare and review top prop trading firms. Find the best funded trading opportunities with competitive profit splits and evaluation processes.";
  const pageUrl = urlCategory ? `https://entrylab.io/prop-firms/${urlCategory.slug}` : "https://entrylab.io/prop-firms";

  useEffect(() => {
    const path = urlCategory ? `/prop-firms/${urlCategory.slug}` : "/prop-firms";
    trackPageView(path, pageTitle);
  }, [urlCategory, pageTitle]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-14 md:py-18">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-5 w-36 mb-4 opacity-20" />
            <Skeleton className="h-12 w-96 mb-3 opacity-20" />
            <Skeleton className="h-5 w-64 opacity-20" />
          </div>
        </div>
        <div style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }} className="flex-1 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={pageTitle}
        description={pageDescription}
        url={pageUrl}
        breadcrumbs={urlCategory ? [
          { name: "Home", url: "https://entrylab.io" },
          { name: "Prop Firms", url: "https://entrylab.io/prop-firms" },
          { name: urlCategory.name, url: pageUrl },
        ] : [
          { name: "Home", url: "https://entrylab.io" },
          { name: "Prop Firms", url: "https://entrylab.io/prop-firms" },
        ]}
      />
      <Navigation />

      {/* ── Dark page hero ── */}
      <div style={{ background: "#1a1e1c" }} className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-18">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            {/* Left — identity */}
            <div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                style={{ background: "rgba(43,179,42,0.10)", color: "#6ee870", border: "1px solid rgba(43,179,42,0.22)" }}
              >
                <CheckCircle2 className="h-3 w-3" />
                Funded Trading
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight" style={{ color: "#f9fafb" }}>
                {urlCategory ? `${urlCategory.name} Prop Firms` : "Best Verified Prop Firms"}
              </h1>
              <p className="text-base md:text-lg max-w-xl" style={{ color: "#9ca3af" }}>
                Get funded and trade with the best proprietary trading firms. Compare evaluations, profit splits, and funding opportunities.
              </p>
            </div>

            {/* Right — stat tiles */}
            <div className="flex flex-wrap gap-3 md:flex-shrink-0">
              {[
                { icon: Shield, label: "Verified Firms", value: totalVerified },
                { icon: Star, label: "Avg Rating", value: avgRating },
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
      <div
        className="relative flex-1"
        style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}
      >
        {/* Decorative orbs */}
        <div className="pointer-events-none" aria-hidden="true">
          <div style={{ position: "absolute", top: "5%", left: "5%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(43,179,42,0.05) 0%, transparent 65%)", filter: "blur(100px)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", top: "45%", right: "0%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 65%)", filter: "blur(110px)", borderRadius: "50%" }} />
        </div>

        <div className="relative">
          {/* Filter tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* All */}
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer"
                style={{
                  background: filterFeatured === null && selectedCategory === null ? "rgba(43,179,42,0.08)" : "rgba(255,255,255,0.35)",
                  border: filterFeatured === null && selectedCategory === null ? "1px solid rgba(43,179,42,0.15)" : "1px solid rgba(255,255,255,0.55)",
                  color: filterFeatured === null && selectedCategory === null ? "#14531a" : "#374151",
                }}
                onClick={() => { setFilterFeatured(null); setLocation("/prop-firms"); trackCategoryFilter("prop_firm", "all"); }}
                data-testid="badge-filter-all"
              >
                All Prop Firms ({propFirms.length})
              </button>

              {/* Featured */}
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer"
                style={{
                  background: filterFeatured === true && selectedCategory === null ? "rgba(43,179,42,0.08)" : "rgba(255,255,255,0.35)",
                  border: filterFeatured === true && selectedCategory === null ? "1px solid rgba(43,179,42,0.15)" : "1px solid rgba(255,255,255,0.55)",
                  color: filterFeatured === true && selectedCategory === null ? "#14531a" : "#374151",
                }}
                onClick={() => { setFilterFeatured(true); setLocation("/prop-firms"); trackCategoryFilter("prop_firm", "featured"); }}
                data-testid="badge-filter-featured"
              >
                <Star className="h-3.5 w-3.5" />
                Featured ({featuredCount})
              </button>

              {/* Dynamic category filters */}
              {categories
                .map(cat => ({ ...cat, count: propFirms.filter(p => p.categoryIds.includes(cat.id)).length }))
                .filter(cat => cat.count > 0)
                .map(cat => (
                  <button
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer"
                    style={{
                      background: selectedCategory === cat.id ? "rgba(43,179,42,0.08)" : "rgba(255,255,255,0.35)",
                      border: selectedCategory === cat.id ? "1px solid rgba(43,179,42,0.15)" : "1px solid rgba(255,255,255,0.55)",
                      color: selectedCategory === cat.id ? "#14531a" : "#374151",
                    }}
                    onClick={() => {
                      setFilterFeatured(null);
                      setLocation(selectedCategory === cat.id ? "/prop-firms" : `/prop-firms/${cat.slug}`);
                      trackCategoryFilter("prop_firm", cat.name);
                    }}
                    data-testid={`badge-filter-${cat.slug}`}
                  >
                    {cat.name} ({cat.count})
                  </button>
                ))}
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
                  Prop Firm Guide
                </div>
                <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#111827" }}>
                  What to Look for in a Prop Firm
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

          {/* Prop firms list */}
          <section className="py-4 md:py-8 pb-20" style={{ borderTop: "1px solid rgba(255,255,255,0.4)" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              {/* Section header */}
              <div className="flex items-start justify-between mb-7 gap-4 flex-wrap">
                <div>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3"
                    style={{ background: "rgba(43,179,42,0.07)", color: "#186818", border: "1px solid rgba(43,179,42,0.14)" }}
                  >
                    Funded Trading
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: "#111827" }}>
                    Top Rated Prop Firms
                  </h2>
                  <p className="text-base" style={{ color: "#6b7280" }}>
                    Start your funded trading journey with the best verified prop firms
                  </p>
                </div>
              </div>

              {/* EntryLab Verified pill */}
              <div className="flex mb-6">
                <div
                  className="inline-flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.38)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                  }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)" }}
                  >
                    <ShieldCheck className="h-4 w-4" style={{ color: "#b45309" }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#9ca3af" }}>EntryLab Verified</p>
                    <p className="text-sm font-bold" style={{ color: "#111827" }}>All firms checked</p>
                  </div>
                </div>
              </div>

              {filteredPropFirms.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {filteredPropFirms.map((firm, index) => (
                    <PropFirmRow
                      key={firm.id}
                      name={(firm as any).name}
                      logo={(firm as any).logo}
                      rating={(firm as any).rating}
                      pros={(firm as any).pros || []}
                      tagline={(firm as any).tagline}
                      highlights={(firm as any).highlights}
                      link={(firm as any).link}
                      reviewLink={(firm as any).reviewLink}
                      position={index + 1}
                      pageLocation="prop_firms"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p style={{ color: "#6b7280" }}>No prop firms found with the selected filter.</p>
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
