import { useState, useEffect, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Hero } from "@/components/Hero";
import { ArticleCard } from "@/components/ArticleCard";
import { Footer } from "@/components/Footer";
import { getArticleUrl, getCategoryName } from "@/lib/articleUtils";
import type { Article, Broker } from "@shared/schema";
import { trackPageView } from "@/lib/gtm";
import { ArticleCardSkeletonList } from "@/components/skeletons/ArticleCardSkeleton";
import { BrokerCardSkeletonList } from "@/components/skeletons/BrokerCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck } from "lucide-react";
import { SignalsBento } from "@/components/SignalsBento";

const TrendingTopics = lazy(() => import("@/components/TrendingTopics").then(m => ({ default: m.TrendingTopics })));
const FeaturedBroker = lazy(() => import("@/components/FeaturedBroker").then(m => ({ default: m.FeaturedBroker })));
const BrokerCardEnhanced = lazy(() => import("@/components/BrokerCardEnhanced").then(m => ({ default: m.BrokerCardEnhanced })));
const NewsletterCTA = lazy(() => import("@/components/NewsletterCTA").then(m => ({ default: m.NewsletterCTA })));
const PropFirmRow = lazy(() => import("@/components/PropFirmRow").then(m => ({ default: m.PropFirmRow })));

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    trackPageView("/", "Home | EntryLab - Forex News & Trading Intelligence");
  }, []);

  const { data: posts, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory
        ? `/api/articles?category=${selectedCategory}`
        : "/api/articles";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch articles");
      return response.json();
    },
  });

  const { data: brokers = [] } = useQuery<Broker[]>({
    queryKey: ["/api/brokers"],
  });

  const { data: propFirmsRaw = [] } = useQuery<Broker[]>({
    queryKey: ["/api/prop-firms"],
  });

  const propFirms = propFirmsRaw.slice(0, 3);

  const featuredPost = posts?.[0];
  const latestPosts = posts?.slice(1, 7) || [];

  const featuredBroker = brokers.find(b => b.featured);
  const popularBrokers = brokers.slice(0, 3);

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const getAuthorName = (post: Article) => post.author || "EntryLab Team";
  const getFeaturedImage = (post: Article) => post.featuredImage || undefined;

  const featuredImage = featuredPost ? getFeaturedImage(featuredPost) : undefined;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <SEO
        title="EntryLab - Forex Broker & Prop Firm News"
        description="Stay informed with the latest forex broker news, prop firm updates, and trading analysis. Unbiased reviews and market insights for traders worldwide."
        url="https://entrylab.io"
        type="website"
        preloadImage={featuredImage}
        breadcrumbs={[{ name: "Home", url: "https://entrylab.io" }]}
      />
      <Navigation />

      {isLoading ? (
        <>
          <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
            <Skeleton className="absolute inset-0" />
          </section>
          <div style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}>
            <section className="py-16 md:py-24">
              <div className="max-w-7xl mx-auto px-6">
                <Skeleton className="h-10 w-48 mb-8" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ArticleCardSkeletonList count={6} />
                </div>
              </div>
            </section>
          </div>
        </>
      ) : featuredPost ? (
        <>
          <Hero
            title={featuredPost.title}
            excerpt={featuredPost.excerpt || ""}
            author={getAuthorName(featuredPost)}
            date={featuredPost.publishedAt ? String(featuredPost.publishedAt) : ""}
            category={getCategoryName(featuredPost)}
            link={getArticleUrl(featuredPost)}
            imageUrl={getFeaturedImage(featuredPost)}
          />

          {/* ── Main content: single unified glass-ready surface ── */}
          <div
            className="relative"
            style={{
              background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)",
            }}
          >
            {/* Global decorative orbs — always present, bleed through all glass cards */}
            <div className="pointer-events-none" aria-hidden="true">
              <div style={{ position: "absolute", top: "5%", left: "5%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(43,179,42,0.06) 0%, transparent 65%)", filter: "blur(100px)", borderRadius: "50%" }} />
              <div style={{ position: "absolute", top: "20%", right: "0%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 65%)", filter: "blur(110px)", borderRadius: "50%" }} />
              <div style={{ position: "absolute", top: "55%", left: "30%", width: "700px", height: "400px", background: "radial-gradient(circle, rgba(43,179,42,0.04) 0%, transparent 65%)", filter: "blur(120px)", borderRadius: "50%" }} />
            </div>

            <div className="relative">
              <Suspense fallback={<div className="h-16 w-full" />}>
                <TrendingTopics
                  selectedCategory={selectedCategory}
                  onCategorySelect={setSelectedCategory}
                />
              </Suspense>

              {featuredBroker && (
                <Suspense fallback={<Skeleton className="h-48 w-full max-w-7xl mx-auto" />}>
                  <FeaturedBroker
                    name={featuredBroker.name}
                    logo={featuredBroker.logo}
                    tagline={featuredBroker.tagline || ""}
                    rating={featuredBroker.rating}
                    features={featuredBroker.features || []}
                    highlights={featuredBroker.highlights || []}
                    bonusOffer={featuredBroker.bonusOffer}
                    link={featuredBroker.link}
                    reviewLink={featuredBroker.reviewLink}
                  />
                </Suspense>
              )}

              {/* Latest News */}
              <section className="py-16 md:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: "#111827" }} data-testid="text-latest-news">
                        Latest News
                      </h2>
                      <p className="text-sm" style={{ color: "#6b7280" }}>Breaking updates from the forex & prop firm world</p>
                    </div>
                    <a href="/topics/news" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity" style={{ color: "#186818" }} data-testid="link-view-all">
                      View All
                    </a>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {latestPosts.map((post) => (
                      <ArticleCard
                        key={post.id}
                        title={post.title}
                        excerpt={stripHtml(post.excerpt || "")}
                        author={getAuthorName(post)}
                        date={post.publishedAt ? String(post.publishedAt) : ""}
                        category={getCategoryName(post)}
                        link={getArticleUrl(post)}
                        imageUrl={getFeaturedImage(post)}
                        slug={post.slug}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Top Rated Brokers */}
              {popularBrokers.length > 0 && (
                <section className="py-16 md:py-20" style={{ borderTop: "1px solid rgba(255,255,255,0.4)" }}>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-end justify-between mb-10 gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3" style={{ background: "rgba(43,179,42,0.07)", color: "#186818", border: "1px solid rgba(43,179,42,0.14)", backdropFilter: "blur(8px)" }}>
                          Verified & Rated
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: "#111827" }} data-testid="text-popular-brokers">
                          Top Rated Brokers
                        </h2>
                        <p className="text-base max-w-xl" style={{ color: "#6b7280" }}>
                          Compare the best forex brokers trusted by thousands of traders worldwide
                        </p>
                      </div>
                      <a href="/brokers/best-cfd" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold flex-shrink-0 hover:opacity-80 transition-opacity" style={{ color: "#186818" }}>
                        View All
                      </a>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {popularBrokers.map((broker, index) => (
                        <Suspense key={broker.id} fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
                          <BrokerCardEnhanced
                            name={broker.name}
                            logo={broker.logo}
                            verified={broker.verified}
                            rating={broker.rating}
                            pros={broker.pros}
                            highlights={broker.highlights}
                            link={broker.link}
                            slug={broker.slug}
                            type="broker"
                            pageLocation="home"
                            placementType="top_rated_card"
                            position={index + 1}
                          />
                        </Suspense>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Top Rated Prop Firms */}
              {propFirms.length > 0 && (
                <section className="py-16 md:py-20" style={{ borderTop: "1px solid rgba(255,255,255,0.4)" }}>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    {/* Section header */}
                    <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3" style={{ background: "rgba(43,179,42,0.07)", color: "#186818", border: "1px solid rgba(43,179,42,0.14)", backdropFilter: "blur(8px)" }}>
                          Funded Trading
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: "#111827" }} data-testid="text-popular-prop-firms">
                          Top Rated Prop Firms
                        </h2>
                        <p className="text-base max-w-xl" style={{ color: "#6b7280" }}>
                          Start your funded trading journey with the best verified prop firms
                        </p>
                      </div>
                      <a href="/prop-firms/best-verified" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold flex-shrink-0 hover:opacity-80 transition-opacity mt-1" style={{ color: "#186818" }}>
                        View All
                      </a>
                    </div>

                    {/* Stats bar */}
                    <div className="flex mb-7">
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
                        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)" }}>
                          <ShieldCheck className="h-4 w-4" style={{ color: "#b45309" }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium" style={{ color: "#9ca3af" }}>EntryLab Verified</p>
                          <p className="text-sm font-bold" style={{ color: "#111827" }}>All firms checked</p>
                        </div>
                      </div>
                    </div>

                    {/* Firm rows */}
                    <div className="flex flex-col gap-3">
                      {propFirms.map((firm, index) => (
                        <Suspense key={(firm as any).id} fallback={<Skeleton className="h-24 w-full rounded-2xl" />}>
                          <PropFirmRow
                            name={(firm as any).name}
                            logo={(firm as any).logo}
                            rating={(firm as any).rating}
                            pros={(firm as any).pros || []}
                            highlights={(firm as any).highlights}
                            tagline={(firm as any).tagline}
                            link={(firm as any).link}
                            reviewLink={(firm as any).reviewLink}
                            position={index + 1}
                            pageLocation="home"
                          />
                        </Suspense>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              <SignalsBento />

              <Suspense fallback={<Skeleton className="h-96 w-full max-w-7xl mx-auto" />}>
                <NewsletterCTA />
              </Suspense>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center py-32">
          <p style={{ color: "#6b7280" }}>No articles found</p>
        </div>
      )}

      <Footer />
    </div>
  );
}
