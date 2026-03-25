import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { BrokerCardEnhanced } from "@/components/BrokerCardEnhanced";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Star, CheckCircle2, ArrowRight, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useLayoutEffect } from "react";
import { trackPageView } from "@/lib/gtm";
import type { Broker } from "@shared/schema";

const GLASS = {
  background: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(16px) saturate(200%)",
  WebkitBackdropFilter: "blur(16px) saturate(200%)",
  border: "1px solid rgba(255,255,255,0.38)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.65)",
} as const;

export default function BrokerCategoryArchive() {
  const params = useParams();
  const [, setLocation] = useLocation();

  const slug = params.slug || window.location.pathname.split("/").pop() || "";

  useEffect(() => {
    trackPageView(`/${slug}`, `${slug} | EntryLab`);
  }, [slug]);

  useLayoutEffect(() => {
    const prevBody = document.body.style.background;
    const prevHtml = document.documentElement.style.background;
    document.body.style.setProperty("background", "#f8faf8", "important");
    document.documentElement.style.setProperty("background", "#f8faf8", "important");
    return () => {
      document.body.style.background = prevBody;
      document.documentElement.style.background = prevHtml;
    };
  }, []);

  const { data: brokerCategories } = useQuery<any[]>({
    queryKey: ["/api/broker-categories"],
  });

  const { data: categoryContent, isLoading } = useQuery<any>({
    queryKey: [`/api/category-content?category=${slug}`],
    enabled: !!slug,
  });

  const brokers: Broker[] = categoryContent?.brokers || [];
  const totalVerified = brokers.filter((b: Broker) => b.verified).length;
  const avgRating = brokers.length > 0
    ? (brokers.reduce((sum: number, b: Broker) => sum + b.rating, 0) / brokers.length).toFixed(1)
    : "0.0";

  const filteredCategories = brokerCategories || [];
  const currentCategory = brokerCategories?.find((cat: any) => cat.slug === slug);
  const categoryName = currentCategory?.name || slug.split("-").map((w: string) => w.toUpperCase()).join(" ");

  const itemListData = brokers.slice(0, 20).map((broker: Broker) => ({
    url: `https://entrylab.io/brokers/${broker.slug}`,
    name: broker.name,
    image: broker.logo,
  }));

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
        title={`${categoryName} | EntryLab`}
        description={`Discover the ${categoryName.toLowerCase()}. Compare verified brokers with competitive spreads, fast execution, and trusted regulation.`}
        url={`https://entrylab.io/${slug}`}
        itemList={itemListData}
        breadcrumbs={[
          { name: "Home", url: "https://entrylab.io" },
          { name: "Brokers", url: "https://entrylab.io/brokers" },
          { name: categoryName, url: `https://entrylab.io/${slug}` },
        ]}
      />
      <Navigation />

      {/* Dark hero */}
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
                {categoryName}
              </h1>
              <p className="text-base md:text-lg max-w-xl" style={{ color: "#9ca3af" }}>
                Compare verified brokers with competitive spreads, fast execution, and trusted regulation.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 md:flex-shrink-0">
              {[
                { icon: Shield, label: "Verified", value: totalVerified },
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

      {/* Light content surface */}
      <div className="relative flex-1">
        <div className="pointer-events-none" aria-hidden="true">
          <div style={{ position: "absolute", top: "5%", left: "5%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(43,179,42,0.05) 0%, transparent 65%)", filter: "blur(100px)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", top: "40%", right: "0%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 65%)", filter: "blur(110px)", borderRadius: "50%" }} />
        </div>

        <div className="relative">
          {/* Category filter pills */}
          {filteredCategories.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                {filteredCategories.map((cat: any) => {
                  const isSelected = cat.slug === slug;
                  return (
                    <button
                      key={cat.slug}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer"
                      style={{
                        background: isSelected ? "rgba(43,179,42,0.08)" : "rgba(255,255,255,0.55)",
                        border: isSelected ? "1px solid rgba(43,179,42,0.15)" : "1px solid rgba(255,255,255,0.70)",
                        color: isSelected ? "#14531a" : "#374151",
                      }}
                      onClick={() => setLocation(`/brokers/category/${cat.slug}`)}
                      data-testid={`badge-category-${cat.slug}`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <main className="py-10 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="mb-8">
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

              {brokers.length > 0 ? (
                <>
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mb-12">
                    {brokers.map((broker: Broker, index: number) => (
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
                        pageLocation="archive"
                        placementType="broker_list_card"
                        position={index + 1}
                      />
                    ))}
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.4)" }} className="pt-10">
                    <p className="text-center text-sm mb-3" style={{ color: "#6b7280" }}>
                      Looking for the latest market insights?
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Button asChild variant="outline" className="gap-2" style={{ color: "#186818", borderColor: "rgba(43,179,42,0.3)" }} data-testid="button-see-latest-news">
                        <a href="/news">
                          <Newspaper className="h-4 w-4" />
                          See Latest FX News
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <p style={{ color: "#6b7280" }}>No brokers found in this category.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
