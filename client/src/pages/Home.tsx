import { useState, useEffect, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Hero } from "@/components/Hero";
import { ArticleCard } from "@/components/ArticleCard";
import { Footer } from "@/components/Footer";
import { transformBroker, transformPropFirm } from "@/lib/transforms";
import { getArticleUrl, getCategoryName } from "@/lib/articleUtils";
import type { WordPressPost, Broker } from "@shared/schema";
import { trackPageView } from "@/lib/gtm";
import { ArticleCardSkeletonList } from "@/components/skeletons/ArticleCardSkeleton";
import { BrokerCardSkeletonList } from "@/components/skeletons/BrokerCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

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

  const { data: categoryData } = useQuery<any[]>({
    queryKey: ["/api/wordpress/categories", selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return null;
      const response = await fetch(`/api/wordpress/categories?slug=${selectedCategory}`);
      if (!response.ok) throw new Error("Failed to fetch category");
      return response.json();
    },
    enabled: !!selectedCategory,
  });

  const activeCategoryId = selectedCategory && categoryData?.[0]?.id ? categoryData[0].id : null;

  const { data: posts, isLoading } = useQuery<WordPressPost[]>({
    queryKey: ["/api/wordpress/posts", activeCategoryId],
    queryFn: async () => {
      const url = activeCategoryId
        ? `/api/wordpress/posts?category=${activeCategoryId}`
        : "/api/wordpress/posts";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  const { data: wordpressBrokers } = useQuery<any[]>({
    queryKey: ["/api/wordpress/brokers"],
  });

  const { data: fallbackBrokers } = useQuery<Broker[]>({
    queryKey: ["/api/brokers"],
  });

  const { data: wordpressPropFirms } = useQuery<any[]>({
    queryKey: ["/api/wordpress/prop-firms"],
  });

  const wpBrokers = wordpressBrokers?.map(transformBroker).filter((b): b is Broker => b !== null) || [];
  const brokers = wpBrokers.length > 0 ? wpBrokers : (fallbackBrokers || []);
  const propFirms = (wordpressPropFirms?.map(transformPropFirm).filter(Boolean) || []).slice(0, 3);

  const featuredPost = posts?.[0];
  const latestPosts = posts?.slice(1, 7) || [];

  const featuredBroker = brokers.find(b => b.featured);
  const popularBrokers = brokers.slice(0, 3);

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const getAuthorName = (post: WordPressPost) => {
    return post._embedded?.author?.[0]?.name || "EntryLab Team";
  };

  const getFeaturedImage = (post: WordPressPost) => {
    const media = post._embedded?.["wp:featuredmedia"]?.[0];
    if (!media) return undefined;
    const sizes = (media as any).media_details?.sizes;
    if (sizes?.medium_large?.source_url) return sizes.medium_large.source_url;
    if (sizes?.large?.source_url) return sizes.large.source_url;
    if (sizes?.medium?.source_url) return sizes.medium.source_url;
    return media.source_url;
  };

  const featuredImage = featuredPost ? getFeaturedImage(featuredPost) : undefined;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <SEO
        title="EntryLab - Forex Broker & Prop Firm News"
        description="Stay informed with the latest forex broker news, prop firm updates, and trading analysis. Unbiased reviews and market insights for traders worldwide."
        url="https://entrylab.io"
        type="website"
        preloadImage={featuredImage}
        breadcrumbs={[
          { name: "Home", url: "https://entrylab.io" }
        ]}
      />
      <Navigation />

      {isLoading ? (
        <>
          <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
            <Skeleton className="absolute inset-0" />
            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-4">
              <Skeleton className="h-8 w-32 mx-auto" />
              <Skeleton className="h-12 w-full max-w-3xl mx-auto" />
              <Skeleton className="h-12 w-4/5 mx-auto" />
              <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
            </div>
          </section>

          <div style={{ background: "linear-gradient(180deg, #f8faf8 0%, #eef2ef 100%)" }}>
            <section className="py-16 md:py-24">
              <div className="max-w-7xl mx-auto px-6">
                <Skeleton className="h-10 w-48 mb-8" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ArticleCardSkeletonList count={6} />
                </div>
              </div>
            </section>

            <section className="py-16 md:py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="mb-12">
                  <Skeleton className="h-10 w-64 mb-4" />
                  <Skeleton className="h-6 w-96" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <BrokerCardSkeletonList count={3} />
                </div>
              </div>
            </section>
          </div>
        </>
      ) : featuredPost ? (
        <>
          <Hero
            title={featuredPost.title.rendered}
            excerpt={featuredPost.excerpt.rendered}
            author={getAuthorName(featuredPost)}
            date={featuredPost.date}
            category={getCategoryName(featuredPost)}
            link={getArticleUrl(featuredPost)}
            imageUrl={getFeaturedImage(featuredPost)}
          />

          <div style={{ background: "linear-gradient(180deg, #f8faf8 0%, #eef2ef 100%)" }}>
            <Suspense fallback={<Skeleton className="h-16 w-full" />}>
              <TrendingTopics
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
              />
            </Suspense>

            {featuredBroker && (
              <Suspense fallback={<Skeleton className="h-96 w-full max-w-7xl mx-auto" />}>
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
            <section className="py-16 md:py-24" style={{ borderTop: "1px solid #e8edea" }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900" data-testid="text-latest-news">
                      Latest News
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">Breaking updates from the forex & prop firm world</p>
                  </div>
                  <a
                    href="/news"
                    className="hidden sm:flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: "#2bb32a" }}
                    data-testid="link-view-all"
                  >
                    View All
                  </a>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {latestPosts.map((post) => (
                    <ArticleCard
                      key={post.id}
                      title={post.title.rendered}
                      excerpt={stripHtml((post as any).acf?.article_description || post.excerpt.rendered)}
                      author={getAuthorName(post)}
                      date={post.date}
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
              <section className="py-16 md:py-24" style={{ borderTop: "1px solid #e8edea" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                  <div className="flex items-end justify-between mb-12 gap-4">
                    <div>
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                        style={{ background: "rgba(43,179,42,0.10)", color: "#186818", border: "1px solid rgba(43,179,42,0.22)" }}
                      >
                        Verified & Rated
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" data-testid="text-popular-brokers">
                        Top Rated Brokers
                      </h2>
                      <p className="text-base max-w-xl text-gray-500">
                        Compare the best forex brokers trusted by thousands of traders worldwide
                      </p>
                    </div>
                    <a
                      href="/top-cfd-brokers"
                      className="hidden sm:flex items-center gap-1.5 text-sm font-medium flex-shrink-0 transition-colors hover:opacity-80"
                      style={{ color: "#2bb32a" }}
                    >
                      View All
                    </a>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {popularBrokers.map((broker, index) => (
                      <Suspense key={broker.id} fallback={<Skeleton className="h-72 w-full" />}>
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
              <section className="py-16 md:py-24" style={{ borderTop: "1px solid #e8edea" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                  <div className="flex items-end justify-between mb-10 gap-4">
                    <div>
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                        style={{ background: "rgba(43,179,42,0.10)", color: "#186818", border: "1px solid rgba(43,179,42,0.22)" }}
                      >
                        Funded Trading
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" data-testid="text-popular-prop-firms">
                        Top Rated Prop Firms
                      </h2>
                      <p className="text-base max-w-xl text-gray-500">
                        Start your funded trading journey with the best prop firms
                      </p>
                    </div>
                    <a
                      href="/best-verified-propfirms"
                      className="hidden sm:flex items-center gap-1.5 text-sm font-medium flex-shrink-0 transition-colors hover:opacity-80"
                      style={{ color: "#2bb32a" }}
                    >
                      View All
                    </a>
                  </div>
                  <div className="flex flex-col gap-3">
                    {propFirms.map((firm, index) => (
                      <Suspense key={(firm as any).id} fallback={<Skeleton className="h-20 w-full" />}>
                        <PropFirmRow
                          name={(firm as any).name}
                          logo={(firm as any).logo}
                          rating={(firm as any).rating}
                          pros={(firm as any).pros || []}
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

            <Suspense fallback={<Skeleton className="h-96 w-full max-w-7xl mx-auto" />}>
              <NewsletterCTA />
            </Suspense>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center py-32">
          <p className="text-muted-foreground">No articles found</p>
        </div>
      )}

      <Footer />
    </div>
  );
}
