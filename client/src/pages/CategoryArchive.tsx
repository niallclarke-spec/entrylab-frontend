import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ArticleCard } from "@/components/ArticleCard";
import { BrokerCardEnhanced } from "@/components/BrokerCardEnhanced";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft } from "lucide-react";
import type { WordPressPost, Broker } from "@shared/schema";
import { getArticleUrl, getCategoryName, getCategorySlug } from "@/lib/articleUtils";
import { trackPageView, trackSearch } from "@/lib/gtm";
import { ArticleCardSkeletonList } from "@/components/skeletons/ArticleCardSkeleton";
import { EXCLUDED_CATEGORIES } from "@/lib/constants";
import { transformBroker } from "@/lib/transforms";

export default function CategoryArchive() {
  const params = useParams();
  // Extract category slug from URL path (e.g., /broker-news -> broker-news)
  const categorySlug = params.slug || params.category || window.location.pathname.slice(1);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categoryData, isLoading: categoryLoading } = useQuery<any>({
    queryKey: [`/api/wordpress/categories?slug=${categorySlug}`],
    enabled: !!categorySlug,
  });

  const category = categoryData?.[0];

  // Fetch all content types for this category
  const { data: categoryContent, isLoading: contentLoading } = useQuery<{
    posts: any[];
    brokers: any[];
    propFirms: any[];
  }>({
    queryKey: [`/api/wordpress/category-content?category=${categorySlug}`],
    enabled: !!categorySlug,
  });

  const { data: allCategories } = useQuery<any[]>({
    queryKey: ["/api/wordpress/categories"],
  });

  // Transform data
  const posts = categoryContent?.posts || [];
  const brokers = categoryContent?.brokers?.map(transformBroker).filter((b): b is Broker => b !== null) || [];
  const propFirms = categoryContent?.propFirms?.map(transformBroker).filter((b): b is Broker => b !== null) || [];

  useEffect(() => {
    if (category) {
      const title = category.yoast_head_json?.title || `${category.name} | EntryLab`;
      trackPageView(`/${categorySlug}`, title);
    }
  }, [category, categorySlug]);

  const getAuthorName = (post: WordPressPost) => 
    post._embedded?.author?.[0]?.name || "EntryLab Team";
  
  const getFeaturedImage = (post: WordPressPost) => {
    const media = post._embedded?.["wp:featuredmedia"]?.[0];
    if (!media) return undefined;
    const sizes = (media as any).media_details?.sizes;
    if (sizes) {
      if (sizes.medium?.source_url) return sizes.medium.source_url;
      if (sizes.medium_large?.source_url) return sizes.medium_large.source_url;
      if (sizes.large?.source_url) return sizes.large.source_url;
    }
    return media.source_url;
  };

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  // Filter all content types by search query
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === "" || 
      stripHtml(post.title.rendered).toLowerCase().includes(searchQuery.toLowerCase()) ||
      stripHtml(post.excerpt.rendered).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredBrokers = brokers.filter(broker => {
    const matchesSearch = searchQuery === "" || 
      broker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broker.tagline?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredPropFirms = propFirms.filter(firm => {
    const matchesSearch = searchQuery === "" || 
      firm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      firm.tagline?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalResults = filteredPosts.length + filteredBrokers.length + filteredPropFirms.length;

  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(() => {
        trackSearch(searchQuery, totalResults, categorySlug || 'category');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, totalResults, categorySlug]);

  if (categoryLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <ArticleCardSkeletonList count={9} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Category Not Found</h2>
            <Link href="/archive">
              <Button data-testid="button-back-archive">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Archive
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // SEO with fallbacks: Yoast SEO fields OR auto-generated defaults
  const seoTitle = category.yoast_head_json?.title || 
                   `${category.name} | EntryLab - Forex News & Analysis`;
  const seoDescription = category.yoast_head_json?.og_description || 
                         category.yoast_head_json?.description ||
                         category.description || 
                         `Browse the latest ${category.name.toLowerCase()} articles from EntryLab. Expert analysis and insights for forex traders.`;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={seoTitle}
        description={seoDescription}
        url={`https://entrylab.io/${categorySlug}`}
        type="website"
        breadcrumbs={[
          { name: "Home", url: "https://entrylab.io" },
          { name: category.name, url: `https://entrylab.io/${categorySlug}` }
        ]}
      />
      <Navigation />
      
      <main className="flex-1 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Back Button */}
          <Link href="/archive">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-archive-top">
              <ArrowLeft className="mr-2 h-3 w-3" /> All Categories
            </Button>
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-category-name">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {category.description}
              </p>
            )}
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Search ${category.name.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 focus-visible:ring-primary focus-visible:ring-2 focus-visible:shadow-[0_0_20px_rgba(168,85,246,0.3)]"
                data-testid="input-search-articles"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            <Link href="/archive">
              <Badge
                variant="outline"
                className="cursor-pointer hover-elevate active-elevate-2 transition-all px-4 py-2"
                data-testid="badge-category-all"
              >
                All Posts
              </Badge>
            </Link>
            {(allCategories || [])
              .filter(cat => !EXCLUDED_CATEGORIES.includes(cat.slug.toLowerCase()))
              .map((cat) => (
                <Link key={cat.slug} href={`/${cat.slug}`}>
                  <Badge
                    variant={cat.slug === categorySlug ? "default" : "outline"}
                    className="cursor-pointer hover-elevate active-elevate-2 transition-all px-4 py-2"
                    data-testid={`badge-category-${cat.slug}`}
                  >
                    {cat.name}
                  </Badge>
                </Link>
              ))}
          </div>

          {/* Content Grid */}
          {contentLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ArticleCardSkeletonList count={9} />
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "No content found matching your search." 
                  : `No content in ${category.name} yet.`}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Brokers Section */}
              {filteredBrokers.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Brokers</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        pageLocation="archive"
                        placementType="broker_list_card"
                        position={index + 1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Prop Firms Section */}
              {filteredPropFirms.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Prop Firms</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPropFirms.map((firm, index) => (
                      <BrokerCardEnhanced
                        key={firm.id}
                        name={firm.name}
                        logo={firm.logo}
                        verified={firm.verified}
                        rating={firm.rating}
                        pros={firm.pros}
                        highlights={firm.highlights}
                        link={firm.link}
                        featured={firm.featured}
                        slug={firm.slug}
                        type="prop-firm"
                        pageLocation="archive"
                        placementType="broker_list_card"
                        position={index + 1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Articles Section */}
              {filteredPosts.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Articles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map((post) => (
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
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
