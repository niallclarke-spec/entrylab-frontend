import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ArticleCard } from "@/components/ArticleCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { WordPressPost } from "@shared/schema";
import { trackPageView, trackSearch, trackCategoryFilter } from "@/lib/gtm";
import { EXCLUDED_CATEGORIES } from "@/lib/constants";
import { ArticleCardSkeletonList } from "@/components/skeletons/ArticleCardSkeleton";

export default function Archive() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    trackPageView("/archive", "Article Archive | EntryLab");
  }, []);

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/wordpress/categories"],
  });

  const { data: posts, isLoading } = useQuery<WordPressPost[]>({
    queryKey: ["/api/wordpress/posts"],
  });

  const getCategoryName = (post: WordPressPost) => 
    post._embedded?.["wp:term"]?.[0]?.[0]?.name || "News";
  
  const getCategorySlug = (post: WordPressPost) => 
    post._embedded?.["wp:term"]?.[0]?.[0]?.slug || "";

  const getAuthorName = (post: WordPressPost) => 
    post._embedded?.author?.[0]?.name || "EntryLab Team";
  
  const getFeaturedImage = (post: WordPressPost) => {
    const media = post._embedded?.["wp:featuredmedia"]?.[0];
    if (!media) return undefined;
    const sizes = (media as any).media_details?.sizes;
    if (sizes) {
      // Archive cards are smaller, use medium for better performance
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

  const filteredPosts = posts?.filter(post => {
    const matchesCategory = selectedCategory === "all" || getCategorySlug(post) === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      stripHtml(post.title.rendered).toLowerCase().includes(searchQuery.toLowerCase()) ||
      stripHtml(post.excerpt.rendered).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  // Debounced search tracking
  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(() => {
        trackSearch(searchQuery, filteredPosts.length, 'archive');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, filteredPosts.length]);

  const allCategories = [
    { name: "All Posts", slug: "all" },
    ...(categories || [])
      .filter(cat => !EXCLUDED_CATEGORIES.includes(cat.slug.toLowerCase()))
      .map(cat => ({ name: cat.name, slug: cat.slug }))
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Article Archive | EntryLab - Forex Broker & Prop Firm News"
        description="Browse our complete collection of forex broker news, prop firm updates, and trading analysis. Find the insights you need for successful trading."
        url="https://entrylab.io/archive"
        type="website"
        breadcrumbs={[
          { name: "Home", url: "https://entrylab.io" },
          { name: "Archive", url: "https://entrylab.io/archive" }
        ]}
      />
      <Navigation />
      
      <main className="flex-1 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Article Archive
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse our complete collection of forex broker news, prop firm updates, and trading analysis
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 focus-visible:ring-primary focus-visible:ring-2 focus-visible:shadow-[0_0_20px_rgba(168,85,246,0.3)]"
                data-testid="input-search-articles"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {allCategories.map((category) => (
              <Badge
                key={category.slug}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                className="cursor-pointer hover-elevate active-elevate-2 transition-all px-4 py-2"
                onClick={() => {
                  setSelectedCategory(category.slug);
                  trackCategoryFilter('article', category.name);
                }}
                data-testid={`badge-category-${category.slug}`}
              >
                {category.name}
              </Badge>
            ))}
          </div>

          {/* Posts Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ArticleCardSkeletonList count={9} />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No articles found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <ArticleCard
                  key={post.id}
                  title={post.title.rendered}
                  excerpt={stripHtml((post as any).acf?.article_description || post.excerpt.rendered)}
                  author={getAuthorName(post)}
                  date={post.date}
                  category={getCategoryName(post)}
                  link={`/article/${post.slug}`}
                  imageUrl={getFeaturedImage(post)}
                  slug={post.slug}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
