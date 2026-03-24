import { useState, useEffect, useLayoutEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ArticleCard } from "@/components/ArticleCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, Shield, TrendingUp } from "lucide-react";
import type { Article } from "@shared/schema";
import { getArticleUrl, getCategoryName, getCategorySlug } from "@/lib/articleUtils";
import { trackPageView, trackSearch } from "@/lib/gtm";
import { ArticleCardSkeletonList } from "@/components/skeletons/ArticleCardSkeleton";
import { EXCLUDED_CATEGORIES } from "@/lib/constants";

export default function CategoryArchive() {
  const params = useParams();
  const [, setLocation] = useLocation();
  // Extract category slug from URL path (e.g., /broker-news -> broker-news)
  const categorySlug = params.slug || params.category || window.location.pathname.slice(1);
  const selectedCategory = categorySlug === 'news' ? 'all' : categorySlug;
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allCategories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch ALL posts once
  const { data: allPosts, isLoading: postsLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  // Find the currently selected category
  const category = allCategories?.find(cat => cat.slug === selectedCategory);
  const isAllPosts = selectedCategory === 'all';

  useEffect(() => {
    if (isAllPosts) {
      trackPageView("/news", "Recent Posts | EntryLab");
    } else if (category) {
      const title = `${category.name} | EntryLab`;
      trackPageView(`/${selectedCategory}`, title);
    }
  }, [category, selectedCategory, isAllPosts]);

  useLayoutEffect(() => {
    document.body.style.setProperty("background", "#f8faf8", "important");
    document.documentElement.style.setProperty("background", "#f8faf8", "important");
    return () => {
      document.body.style.removeProperty("background");
      document.documentElement.style.removeProperty("background");
    };
  }, []);

  const getAuthorName = (post: Article) => post.author || "EntryLab Team";
  
  const getFeaturedImage = (post: Article) => post.featuredImage || undefined;

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  // Filter posts by selected category and search
  const filteredPosts = allPosts?.filter(post => {
    const postCategory = getCategorySlug(post);
    const matchesCategory = isAllPosts || postCategory === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      stripHtml(post.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
      stripHtml(post.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(() => {
        trackSearch(searchQuery, filteredPosts.length, selectedCategory || 'category');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, filteredPosts.length, selectedCategory]);

  const seoTitle = isAllPosts 
    ? "Recent Posts | EntryLab - Latest Forex & Trading News"
    : `${category?.name || 'Category'} | EntryLab - Forex News & Analysis`;
  const seoDescription = isAllPosts
    ? "The latest forex broker news, prop firm updates, and trading analysis. Stay informed with our most recent posts."
    : (category?.description || `Browse the latest ${category?.name?.toLowerCase() || 'articles'} from EntryLab. Expert analysis and insights for forex traders.`);

  const canonicalUrl = isAllPosts ? "https://entrylab.io/news" : `https://entrylab.io/${selectedCategory}`;

  // Create ItemList schema data from filtered posts
  const itemListData = filteredPosts.slice(0, 20).map(post => ({
    url: `https://entrylab.io${getArticleUrl(post)}`,
    name: stripHtml(post.title),
    image: getFeaturedImage(post)
  }));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}>
      <SEO
        title={seoTitle}
        description={seoDescription}
        url={canonicalUrl}
        type="website"
        itemList={itemListData}
        breadcrumbs={[
          { name: "Home", url: "https://entrylab.io" },
          { name: isAllPosts ? "Recent Posts" : (category?.name || 'Category'), url: isAllPosts ? "https://entrylab.io/news" : `https://entrylab.io/${selectedCategory}` }
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
          <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight" style={{ color: "#f9fafb" }} data-testid="text-category-name">
            {isAllPosts ? "Recent Posts" : (category?.name || "Category")}
          </h1>
          <p className="text-base md:text-lg max-w-xl" style={{ color: "#9ca3af" }}>
            {isAllPosts
              ? "The latest forex broker news, prop firm updates, and trading analysis"
              : (category?.description ? stripHtml(category.description) : "Expert analysis and insights for forex traders")}
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
                placeholder={isAllPosts ? "Search articles..." : `Search ${category?.name?.toLowerCase() || "articles"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-articles"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {[{ name: "Recent Posts", slug: "all" }, ...(allCategories || []).filter(cat => !EXCLUDED_CATEGORIES.includes(cat.slug.toLowerCase()) && cat.count > 0)].map((cat) => {
              const isSelected = cat.slug === "all" ? isAllPosts : cat.slug === selectedCategory;
              return (
                <button
                  key={cat.slug}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer"
                  style={{
                    background: isSelected ? "rgba(43,179,42,0.08)" : "rgba(255,255,255,0.55)",
                    border: isSelected ? "1px solid rgba(43,179,42,0.15)" : "1px solid rgba(255,255,255,0.70)",
                    color: isSelected ? "#14531a" : "#374151",
                  }}
                  onClick={() => setLocation(cat.slug === "all" ? "/news" : `/${cat.slug}`)}
                  data-testid={`badge-category-${cat.slug}`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Directory Links */}
          <div className="mb-10 flex flex-wrap gap-3 justify-center">
            <Link href="/brokers/best-cfd">
              <Button variant="ghost" size="default" className="gap-2" style={{ color: "#186818" }} data-testid="button-brokers-directory">
                <Shield className="h-4 w-4" />
                Browse Broker Reviews
              </Button>
            </Link>
            <Link href="/prop-firms/best-verified">
              <Button variant="ghost" size="default" className="gap-2" style={{ color: "#186818" }} data-testid="button-prop-firms-directory">
                <TrendingUp className="h-4 w-4" />
                Browse Prop Firm Reviews
              </Button>
            </Link>
          </div>

          {/* Posts Grid */}
          {postsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ArticleCardSkeletonList count={9} />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "No articles found matching your search." 
                  : isAllPosts 
                    ? "No articles available yet."
                    : `No articles in ${category?.name || 'this category'} yet.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <ArticleCard
                  key={post.id}
                  title={post.title}
                  excerpt={stripHtml(post.excerpt || '')}
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
