import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ArticleCard } from "@/components/ArticleCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, TrendingUp } from "lucide-react";
import type { Article } from "@shared/schema";
import { getArticleUrl, getCategoryName, getCategorySlug } from "@/lib/articleUtils";
import { trackPageView, trackSearch, trackCategoryFilter } from "@/lib/gtm";
import { EXCLUDED_CATEGORIES } from "@/lib/constants";
import { ArticleCardSkeletonList } from "@/components/skeletons/ArticleCardSkeleton";

export default function Archive() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    trackPageView("/news", "News & Articles | EntryLab");
  }, []);

  useLayoutEffect(() => {
    document.body.style.setProperty("background", "#f8faf8", "important");
    document.documentElement.style.setProperty("background", "#f8faf8", "important");
    return () => {
      document.body.style.removeProperty("background");
      document.documentElement.style.removeProperty("background");
    };
  }, []);

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: posts, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const getAuthorName = (post: Article) => post.author || "EntryLab Team";
  
  const getFeaturedImage = (post: Article) => post.featuredImage || undefined;

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const filteredPosts = posts?.filter(post => {
    const matchesCategory = selectedCategory === "all" || getCategorySlug(post) === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      stripHtml(post.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
      stripHtml(post.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
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
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}>
      <SEO
        title="News & Articles | EntryLab - Forex Broker & Prop Firm Updates"
        description="Browse our complete collection of forex broker news, prop firm updates, and trading analysis. Find the insights you need for successful trading."
        url="https://entrylab.io/news"
        type="website"
        breadcrumbs={[
          { name: "Home", url: "https://entrylab.io" },
          { name: "News", url: "https://entrylab.io/news" }
        ]}
      />
      <Navigation />
      
      {/* Dark hero */}
      <div style={{ background: "#1a1e1c" }} className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-18">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: "rgba(43,179,42,0.10)", color: "#6ee870", border: "1px solid rgba(43,179,42,0.22)" }}>
            Latest Coverage
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight" style={{ color: "#f9fafb" }}>
            News &amp; Articles
          </h1>
          <p className="text-base md:text-lg max-w-xl" style={{ color: "#9ca3af" }}>
            Forex broker news, prop firm updates, and trading analysis
          </p>
        </div>
      </div>

      <main className="flex-1 py-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "#9ca3af" }} />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-articles"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {[{ name: "All Posts", slug: "all" }, ...(categories || []).filter(cat => !EXCLUDED_CATEGORIES.includes(cat.slug.toLowerCase()))].map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer"
                  style={{
                    background: isSelected ? "rgba(43,179,42,0.08)" : "rgba(255,255,255,0.55)",
                    border: isSelected ? "1px solid rgba(43,179,42,0.15)" : "1px solid rgba(255,255,255,0.70)",
                    color: isSelected ? "#14531a" : "#374151",
                  }}
                  onClick={() => setSelectedCategory(cat.slug)}
                  data-testid={`badge-category-${cat.slug}`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Directory Links */}
          <div className="mb-10 flex flex-wrap gap-3 justify-center">
            <Link href="/top-cfd-brokers">
              <Button variant="ghost" size="default" className="gap-2" style={{ color: "#186818" }} data-testid="button-brokers-directory">
                <Shield className="h-4 w-4" />
                Browse Broker Reviews
              </Button>
            </Link>
            <Link href="/best-verified-propfirms">
              <Button variant="ghost" size="default" className="gap-2" style={{ color: "#186818" }} data-testid="button-prop-firms-directory">
                <TrendingUp className="h-4 w-4" />
                Browse Prop Firm Reviews
              </Button>
            </Link>
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
