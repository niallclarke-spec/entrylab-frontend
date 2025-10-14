import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { OptimizedImage } from "@/components/OptimizedImage";
import { InlineBrokerCard } from "@/components/InlineBrokerCard";
import { BrokerCardEnhanced } from "@/components/BrokerCardEnhanced";
import { ArticleCard } from "@/components/ArticleCard";
import { NewsletterCTA } from "@/components/NewsletterCTA";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Share2, BookOpen, TrendingUp, Building2, BarChart3, AlertCircle, ShieldCheck, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { transformBroker } from "@/lib/transforms";
import type { WordPressPost, Broker } from "@shared/schema";
import { trackPageView, trackArticleView } from "@/lib/gtm";

// Lazy load broker popup for better performance
const BrokerAlertPopup = lazy(() => import("@/components/BrokerAlertPopup").then(m => ({ default: m.BrokerAlertPopup })));

export default function Article() {
  const params = useParams();
  const slug = params.slug;

  const { data: post, isLoading } = useQuery<WordPressPost>({
    queryKey: ["/api/wordpress/post", slug],
    enabled: !!slug,
  });

  const { data: wordpressBrokers } = useQuery<any[]>({
    queryKey: ["/api/wordpress/brokers"],
  });

  const { data: wordpressPropFirms } = useQuery<any[]>({
    queryKey: ["/api/wordpress/prop-firms"],
  });

  const { data: posts } = useQuery<WordPressPost[]>({
    queryKey: ["/api/wordpress/posts"],
  });

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const wpBrokers = wordpressBrokers?.map(transformBroker).filter((b): b is Broker => b !== null) || [];
  const featuredBroker = wpBrokers.find(b => b.featured);
  const popularBrokers = wpBrokers.slice(0, 3);
  
  // Transform related broker if it exists (from ACF relationship field)
  const relatedBroker = (post as any)?.relatedBroker ? transformBroker((post as any).relatedBroker) : null;

  const getCategoryName = (p: WordPressPost) => p._embedded?.["wp:term"]?.[0]?.[0]?.name || "News";
  const getAuthorName = (p: WordPressPost) => p._embedded?.author?.[0]?.name || "EntryLab Team";
  const getFeaturedImage = (p: WordPressPost) => {
    const media = p._embedded?.["wp:featuredmedia"]?.[0];
    if (!media) return undefined;
    const sizes = (media as any).media_details?.sizes;
    
    // Use FULL SIZE for hero images to avoid blurriness from stretching
    // Hero section is 1200px+ wide, so we need original resolution
    // Only fallback to smaller sizes if full size unavailable
    if (media.source_url) return media.source_url;
    if (sizes?.large?.source_url) return sizes.large.source_url;
    if (sizes?.medium_large?.source_url) return sizes.medium_large.source_url;
    
    return media.source_url;
  };

  // Fetch featured media separately if _embed fails but featured_media ID exists
  const shouldFetchMedia = post && post.featured_media && !getFeaturedImage(post);
  const { data: featuredMediaData } = useQuery({
    queryKey: [`/api/wordpress/media/${post?.featured_media}`],
    enabled: !!shouldFetchMedia,
  });

  useEffect(() => {
    if (post) {
      const title = stripHtml(post.title.rendered);
      const categories = post._embedded?.["wp:term"]?.[0]?.map((term: any) => term.name) || [];
      const author = getAuthorName(post);
      
      trackPageView(`/article/${slug}`, `${title} | EntryLab`);
      trackArticleView({
        article_title: title,
        article_slug: slug || '',
        categories: categories,
        author: author,
      });
    }
  }, [post, slug]);

  // Get related articles from same category
  const currentCategoryId = post?._embedded?.["wp:term"]?.[0]?.[0]?.id;
  const relatedPosts = posts
    ?.filter(p => p.id !== post?.id && p._embedded?.["wp:term"]?.[0]?.[0]?.id === currentCategoryId)
    .slice(0, 2) || [];

  const calculateReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  // SEO: Use Yoast fields if available, otherwise auto-generate
  const seoTitle = (post as any)?.yoast_head_json?.title || 
                   `${stripHtml(post?.title?.rendered || '')} | EntryLab`;
  const seoDescription = (post as any)?.yoast_head_json?.og_description || 
                         (post as any)?.yoast_head_json?.description ||
                         stripHtml(post?.excerpt?.rendered || '').substring(0, 155) ||
                         `Read ${stripHtml(post?.title?.rendered || '')} on EntryLab - Forex broker news and trading analysis.`;

  const addAffiliateLinks = (content: string): string => {
    // Build keyword map from brokers and prop firms
    const affiliateKeywords: { name: string; url: string }[] = [];
    
    // Add brokers
    wordpressBrokers?.forEach((wpItem: any) => {
      const name = wpItem.title?.rendered;
      const affiliateLink = wpItem.acf?.affiliate_link;
      if (name && affiliateLink) {
        affiliateKeywords.push({ 
          name: stripHtml(name).trim(), 
          url: affiliateLink 
        });
      }
    });
    
    // Add prop firms
    wordpressPropFirms?.forEach((wpItem: any) => {
      const name = wpItem.title?.rendered;
      const affiliateLink = wpItem.acf?.affiliate_link;
      if (name && affiliateLink) {
        affiliateKeywords.push({ 
          name: stripHtml(name).trim(), 
          url: affiliateLink 
        });
      }
    });

    if (affiliateKeywords.length === 0) {
      return content;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    // Process each brand keyword
    affiliateKeywords.forEach(({ name, url }) => {
      const occurrences: { node: Text; index: number; position: number }[] = [];
      
      // Find all text nodes
      const walker = document.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node: Text | null;
      let position = 0;
      
      while ((node = walker.nextNode() as Text | null)) {
        // Skip if already inside a link or heading
        let parent = node.parentElement;
        let skipNode = false;
        while (parent) {
          if (['A', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'CODE', 'PRE'].includes(parent.tagName)) {
            skipNode = true;
            break;
          }
          parent = parent.parentElement;
        }
        
        if (skipNode || !node.textContent) continue;
        
        // Case-insensitive search for brand name with word boundaries
        const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(node.textContent)) !== null) {
          occurrences.push({
            node,
            index: match.index,
            position: position++
          });
        }
      }
      
      // Link first and last occurrence only (max 2)
      if (occurrences.length === 0) return;
      
      const toLink = occurrences.length === 1 
        ? [occurrences[0]]
        : [occurrences[0], occurrences[occurrences.length - 1]];
      
      // Sort by position in document (reverse to avoid index shifting)
      toLink.sort((a, b) => b.position - a.position);
      
      toLink.forEach(({ node, index }) => {
        const text = node.textContent || '';
        const matchLength = name.length;
        
        // Split text node
        const beforeText = text.substring(0, index);
        const matchText = text.substring(index, index + matchLength);
        const afterText = text.substring(index + matchLength);
        
        // Create link element
        const link = document.createElement('a');
        link.href = url;
        link.textContent = matchText;
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'sponsored noopener noreferrer');
        link.className = 'affiliate-link';
        
        // Create new nodes
        const beforeNode = document.createTextNode(beforeText);
        const afterNode = document.createTextNode(afterText);
        
        // Replace original node
        const parent = node.parentNode;
        if (parent) {
          parent.insertBefore(beforeNode, node);
          parent.insertBefore(link, node);
          parent.insertBefore(afterNode, node);
          parent.removeChild(node);
        }
      });
    });
    
    return doc.body.innerHTML;
  };

  const parseContentWithBroker = (content: string, broker: Broker | undefined) => {
    // First, add affiliate links to the content
    const contentWithAffiliateLinks = addAffiliateLinks(content);
    
    if (!broker) {
      return <div dangerouslySetInnerHTML={{ __html: contentWithAffiliateLinks }} className="prose prose-slate dark:prose-invert max-w-none" />;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(contentWithAffiliateLinks, 'text/html');
    const allElements = Array.from(doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, table, figure, div.wp-block-table, div.wp-block-image, pre'));

    if (allElements.length < 3) {
      return (
        <>
          <div dangerouslySetInnerHTML={{ __html: content }} className="prose prose-slate dark:prose-invert max-w-none" />
          <InlineBrokerCard broker={broker} />
        </>
      );
    }

    // Calculate 40% position
    const targetIndex = Math.floor(allElements.length * 0.40);
    
    // Find first heading (h2, h3, h4, h5, h6) at or after 40% mark
    let insertIndex = -1;
    for (let i = targetIndex; i < allElements.length; i++) {
      const tagName = allElements[i].tagName.toLowerCase();
      if (['h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        insertIndex = i;
        break;
      }
    }

    // Fallback: if no heading found after 40%, use 45% of all elements
    if (insertIndex === -1) {
      insertIndex = Math.floor(allElements.length * 0.45);
    }

    const beforeBroker: Element[] = [];
    const afterBroker: Element[] = [];

    allElements.forEach((el, i) => {
      if (i < insertIndex) {
        beforeBroker.push(el);
      } else {
        afterBroker.push(el);
      }
    });

    return (
      <>
        <div 
          dangerouslySetInnerHTML={{ __html: beforeBroker.map(el => el.outerHTML).join('') }} 
          className="prose prose-slate dark:prose-invert max-w-none" 
        />
        <InlineBrokerCard broker={broker} />
        <div 
          dangerouslySetInnerHTML={{ __html: afterBroker.map(el => el.outerHTML).join('') }} 
          className="prose prose-slate dark:prose-invert max-w-none" 
        />
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <Navigation />
        
        {/* Hero Image Skeleton */}
        <Skeleton className="w-full h-[300px] md:h-[400px]" />
        
        <main className="flex-1 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid lg:grid-cols-[1fr_350px] gap-8 xl:gap-12">
              {/* Main Content */}
              <article className="min-w-0">
                <div className="bg-card rounded-xl p-6 md:p-8 mb-8">
                  <Skeleton className="h-8 w-24 mb-4" />
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-12 w-4/5 mb-8" />
                  
                  <div className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </article>
              
              {/* Sidebar Skeleton */}
              <aside className="space-y-6">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </aside>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center py-32">
          <p className="text-muted-foreground">Article not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Use embedded image first, fallback to separately fetched media
  const featuredImage = getFeaturedImage(post) || 
    (featuredMediaData as any)?.source_url || 
    (featuredMediaData as any)?.media_details?.sizes?.large?.source_url;
  const readingTime = calculateReadingTime(stripHtml(post.content.rendered));
  
  const seoImage = featuredImage || "https://entrylab.io/og-image.jpg";
  const seoUrl = `https://entrylab.io/article/${post.slug}`;

  // Extract categories and tags for structured data
  const categories = post._embedded?.["wp:term"]?.[0]?.map((term: any) => term.name) || [];
  const tags = post._embedded?.["wp:term"]?.[1]?.map((term: any) => term.name) || [];
  
  // Breadcrumbs for structured data
  const breadcrumbs = [
    { name: "Home", url: "https://entrylab.io" },
    { name: "Articles", url: "https://entrylab.io/archive" },
    { name: stripHtml(post.title.rendered), url: seoUrl }
  ];

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        url={seoUrl}
        type="article"
        publishedTime={post.date}
        modifiedTime={post.modified}
        author={getAuthorName(post)}
        preloadImage={featuredImage}
        categories={categories}
        tags={tags}
        breadcrumbs={breadcrumbs}
      />
      <Navigation />
      
      {/* Hero Section - Dark Moody Purple Banner */}
      {featuredImage && (
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 border-b">
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.2) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
          
          {/* Forex News Graphics */}
          <div className="absolute top-8 left-8 text-primary/10 hidden lg:block">
            <TrendingUp className="h-32 w-32" />
          </div>
          <div className="absolute bottom-8 right-8 text-primary/10 hidden lg:block">
            <BarChart3 className="h-32 w-32" />
          </div>
          <div className="absolute top-1/2 left-1/4 text-primary/5 hidden xl:block">
            <Building2 className="h-24 w-24" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
            <div className="grid lg:grid-cols-[55%_45%] gap-8 items-center">
              {/* Article Info (60% desktop, full width mobile - shows second on mobile) */}
              <div className="space-y-6 text-white order-2 lg:order-1">
                {/* Category Badge */}
                <Badge className="bg-primary/20 text-purple-300 border-primary/30 hover:bg-primary/30 backdrop-blur-sm">
                  <BookOpen className="h-3 w-3 mr-1.5" />
                  {getCategoryName(post)}
                </Badge>

                {/* Title */}
                <h1 
                  className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight" 
                  dangerouslySetInnerHTML={{ __html: post.title.rendered }} 
                />

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{getAuthorName(post)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{readingTime} min read</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="gap-1 bg-emerald-500/20 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/30">
                      <Award className="h-3 w-3" />
                      Premium Analysis
                    </Badge>
                  </div>
                </div>

                {/* Article Description - Custom ACF field or fallback to excerpt (capped at 155 chars) */}
                <p className="text-lg text-white/80 leading-relaxed max-w-2xl">
                  {(post as any).acf?.article_description?.substring(0, 155) || stripHtml(post.excerpt.rendered).substring(0, 155)}
                  {((post as any).acf?.article_description?.length > 155 || stripHtml(post.excerpt.rendered).length > 155) ? '...' : ''}
                </p>

                {/* Forex News Icons Row */}
                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs text-white/70">Market</div>
                      <div className="text-sm font-semibold">Analysis</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs text-white/70">Expert</div>
                      <div className="text-sm font-semibold">Insights</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs text-white/70">Verified</div>
                      <div className="text-sm font-semibold">Source</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Featured Image (45% desktop - 10% bigger, shows first on mobile) */}
              <div className="relative lg:ml-auto w-full lg:w-auto order-1 lg:order-2">
                <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-primary/30 bg-card">
                  <div className="relative aspect-[16/9] md:aspect-[16/10] bg-muted">
                    <OptimizedImage
                      src={featuredImage}
                      alt={stripHtml(post.title.rendered)}
                      width="900"
                      height="500"
                      className="w-full h-full object-cover"
                      priority={true}
                      data-testid="img-article-hero"
                    />
                  </div>
                </div>
                {/* Decorative glow */}
                <div className="absolute -inset-4 bg-primary/20 rounded-xl blur-2xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-[1fr_350px] gap-8 xl:gap-12">
            {/* Main Content */}
            <article className="min-w-0">
              {/* Trending Topics */}
              <div className="mb-8">
                <div className="flex items-center gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2">
                  <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                    Trending:
                  </span>
                  <Badge variant="outline" className="gap-2 px-3 py-1.5 whitespace-nowrap border-destructive/30">
                    <TrendingUp className="h-3.5 w-3.5 text-destructive" />
                    Broker Closures
                  </Badge>
                  <Badge variant="outline" className="gap-2 px-3 py-1.5 whitespace-nowrap border-primary/30">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Prop Firm Updates
                  </Badge>
                  <Badge variant="outline" className="gap-2 px-3 py-1.5 whitespace-nowrap border-chart-2/30 hidden sm:flex">
                    <BarChart3 className="h-3.5 w-3.5 text-chart-2" />
                    Market Analysis
                  </Badge>
                  <Badge variant="outline" className="gap-2 px-3 py-1.5 whitespace-nowrap border-chart-4/30 hidden md:flex">
                    <AlertCircle className="h-3.5 w-3.5 text-chart-4" />
                    Trading Alerts
                  </Badge>
                </div>
              </div>

              {/* Article Content with Broker Insertion */}
              <div className="bg-card rounded-lg p-6 md:p-8 shadow-lg">
                {parseContentWithBroker(post.content.rendered, featuredBroker)}
              </div>

              {/* Affiliate Disclosure */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                  <span>
                    This article may contain affiliate links. We may earn a commission at no extra cost to you when you click these links and make a purchase.
                  </span>
                </p>
              </div>

              {/* Mobile: Related Broker (if exists) */}
              {relatedBroker && (
                <div className="lg:hidden mt-8">
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 mt-1">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Featured Broker</h3>
                  </div>
                  <BrokerCardEnhanced
                    name={relatedBroker.name}
                    logo={relatedBroker.logo}
                    verified={relatedBroker.verified}
                    rating={relatedBroker.rating}
                    pros={relatedBroker.pros}
                    highlights={relatedBroker.highlights}
                    link={relatedBroker.link}
                    slug={relatedBroker.slug}
                    type="broker"
                    pageLocation="article"
                    placementType="featured_widget"
                  />
                </div>
              )}

              {/* Mobile: Popular Brokers Below Article */}
              {popularBrokers.length > 0 && (
                <div className="lg:hidden mt-8 space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Top Rated Brokers</h3>
                  </div>
                  <div className="grid gap-4">
                    {popularBrokers.map((broker, index) => (
                      <BrokerCardEnhanced
                        key={broker.id}
                        name={broker.name}
                        logo={broker.logo}
                        verified={broker.verified}
                        rating={broker.rating}
                        pros={broker.pros}
                        highlights={broker.highlights}
                        link={broker.link}
                        slug={broker.slug}
                        type="broker"
                        pageLocation="article"
                        placementType="top_rated_card"
                        position={index + 1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter Subscription */}
              <div className="mt-8">
                <NewsletterCTA />
              </div>
            </article>

            {/* Desktop: Sticky Sidebar */}
            <aside className="hidden lg:block">
              {/* Match trending topics spacing (mb-8 = 32px) + badges height (~40px) */}
              <div className="sticky top-24 space-y-8" style={{ marginTop: '72px' }}>
                {/* Related Broker (from ACF field) */}
                {relatedBroker && (
                  <div>
                    <div className="flex items-start gap-2 mb-6">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 mt-1">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">Featured Broker</h3>
                    </div>
                    <BrokerCardEnhanced
                      name={relatedBroker.name}
                      logo={relatedBroker.logo}
                      verified={relatedBroker.verified}
                      rating={relatedBroker.rating}
                      pros={relatedBroker.pros}
                      highlights={relatedBroker.highlights}
                      link={relatedBroker.link}
                      slug={relatedBroker.slug}
                      type="broker"
                      pageLocation="article"
                      placementType="featured_widget"
                    />
                  </div>
                )}

                {/* Popular Brokers */}
                {popularBrokers.length > 0 && (
                  <div>
                    <div className="flex items-start gap-2 mb-6">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 mt-1">
                        <Award className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">Top Rated Brokers</h3>
                    </div>
                    <div className="space-y-4">
                      {popularBrokers.map((broker, index) => (
                        <BrokerCardEnhanced
                          key={broker.id}
                          name={broker.name}
                          logo={broker.logo}
                          verified={broker.verified}
                          rating={broker.rating}
                          pros={broker.pros}
                          highlights={broker.highlights}
                          link={broker.link}
                          slug={broker.slug}
                          type="broker"
                          pageLocation="article"
                          placementType="top_rated_card"
                          position={index + 1}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Articles */}
                {relatedPosts.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-4">Related Articles</h3>
                    <div className="space-y-4">
                      {relatedPosts.map((relatedPost) => (
                        <ArticleCard
                          key={relatedPost.id}
                          title={relatedPost.title.rendered}
                          excerpt={stripHtml((relatedPost as any).acf?.article_description || relatedPost.excerpt.rendered)}
                          author={getAuthorName(relatedPost)}
                          date={relatedPost.date}
                          category={getCategoryName(relatedPost)}
                          link={`/article/${relatedPost.slug}`}
                          imageUrl={getFeaturedImage(relatedPost)}
                          slug={relatedPost.slug}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Broker Alert Popup - only for articles with related broker */}
      {relatedBroker && (
        <Suspense fallback={null}>
          <BrokerAlertPopup
            brokerId={relatedBroker.id}
            brokerName={stripHtml(relatedBroker.name)}
            brokerLogo={relatedBroker.logo}
            brokerType="broker"
            scrollThreshold={80}
          />
        </Suspense>
      )}
    </div>
  );
}
