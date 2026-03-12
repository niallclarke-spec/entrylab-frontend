import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, lazy, Suspense } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { OptimizedImage } from "@/components/OptimizedImage";
import { InlineBrokerCard } from "@/components/InlineBrokerCard";
import { BrokerCardEnhanced } from "@/components/BrokerCardEnhanced";
import { ArticleCard } from "@/components/ArticleCard";
import { NewsletterCTA } from "@/components/NewsletterCTA";
import { ProsConsCard } from "@/components/ProsConsCard";
import { TableOfContents } from "@/components/TableOfContents";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Share2, BookOpen, TrendingUp, Building2, BarChart3, AlertCircle, ShieldCheck, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { processArticleContent } from "@/lib/transforms";
import { getArticleUrl, getCategoryName } from "@/lib/articleUtils";
import type { Article, Broker } from "@shared/schema";
import { trackPageView, trackArticleView } from "@/lib/gtm";

// Lazy load broker popup for better performance
const BrokerAlertPopup = lazy(() => import("@/components/BrokerAlertPopup").then(m => ({ default: m.BrokerAlertPopup })));

export default function Article() {
  const params = useParams();
  const slug = params.slug;

  const { data: post, isLoading } = useQuery<Article>({
    queryKey: ["/api/articles", slug],
    enabled: !!slug,
  });

  const { data: brokers = [] } = useQuery<Broker[]>({
    queryKey: ["/api/brokers"],
  });

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const featuredBroker = brokers.find(b => b.featured);
  const popularBrokers = brokers.slice(0, 3);
  
  const relatedBroker = (post as any)?.relatedBroker as Broker | null || null;

  const getAuthorName = (p: Article) => p.author || "EntryLab Team";
  const getFeaturedImage = (p: Article) => p.featuredImage || undefined;

  useEffect(() => {
    document.body.style.setProperty("background", "#f8faf8", "important");
    document.documentElement.style.setProperty("background", "#f8faf8", "important");
    return () => {
      document.body.style.removeProperty("background");
      document.documentElement.style.removeProperty("background");
    };
  }, []);

  useEffect(() => {
    if (post) {
      const title = stripHtml(post.title);
      const categorySlug = post.category || "uncategorized";
      
      trackPageView(`/${categorySlug}/${slug}`, `${title} | EntryLab`);
      trackArticleView({
        article_title: title,
        article_slug: slug || '',
        categories: post.category ? [post.category] : [],
        author: getAuthorName(post),
      });
    }
  }, [post, slug]);

  // Get related articles from same category
  const relatedPosts = articles
    .filter(p => String(p.id) !== String(post?.id) && p.category === post?.category)
    .slice(0, 2);

  const calculateReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  // Process content with heading IDs and table wrappers for Table of Contents (memoized)
  const contentWithHeadingIds = useMemo(() => {
    return post?.content ? processArticleContent(post.content) : '';
  }, [post?.content]);

  // SEO: Use stored seoTitle/seoDescription or auto-generate
  const seoTitle = post?.seoTitle || `${stripHtml(post?.title || '')} | EntryLab`;
  const seoDescription = post?.seoDescription ||
    stripHtml(post?.excerpt || '').substring(0, 155) ||
    `Read ${stripHtml(post?.title || '')} on EntryLab - Forex broker news and trading analysis.`;

  const addAffiliateLinks = (content: string): string => {
    const affiliateKeywords: { name: string; url: string }[] = [];
    
    brokers.forEach((b: Broker) => {
      if (b.name && b.link && b.link !== "#") {
        affiliateKeywords.push({ name: b.name, url: b.link });
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

  // Extract pros and cons from content and replace with card inline
  const processContentWithProsConsCard = (htmlContent: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Find heading that matches "Pros and Cons" or "Pros & Cons" (case insensitive)
    const headings = Array.from(doc.querySelectorAll('h2, h3, h4'));
    const prosConsHeading = headings.find(h => 
      /pros\s*(&|and)\s*cons/i.test(h.textContent || '')
    );
    
    if (!prosConsHeading) {
      return htmlContent;
    }
    
    // Find the next "Pros" and "Cons" headings or lists
    let currentElement = prosConsHeading.nextElementSibling;
    let prosHeading: Element | null = null;
    let consHeading: Element | null = null;
    let prosItems: string[] = [];
    let consItems: string[] = [];
    
    // Track elements to remove (NOT including main heading)
    const elementsToRemove: Element[] = [];
    
    while (currentElement) {
      const tagName = currentElement.tagName.toLowerCase();
      const textContent = currentElement.textContent?.trim().toLowerCase() || '';
      
      // Check if this is a "Pros" heading - handle both headings and paragraphs with strong tags
      const isProsHeading = (['h2', 'h3', 'h4', 'h5'].includes(tagName) && textContent.match(/^pros\s*$/)) ||
        (tagName === 'p' && currentElement.querySelector('strong') && textContent.match(/^pros\s*$/));
      
      if (isProsHeading) {
        prosHeading = currentElement;
        elementsToRemove.push(currentElement);
        currentElement = currentElement.nextElementSibling;
        continue;
      }
      
      // Check if this is a "Cons" heading - handle both headings and paragraphs with strong tags
      const isConsHeading = (['h2', 'h3', 'h4', 'h5'].includes(tagName) && textContent.match(/^cons\s*$/)) ||
        (tagName === 'p' && currentElement.querySelector('strong') && textContent.match(/^cons\s*$/));
      
      if (isConsHeading) {
        consHeading = currentElement;
        elementsToRemove.push(currentElement);
        currentElement = currentElement.nextElementSibling;
        continue;
      }
      
      // If we found pros heading, collect list items until we hit cons heading
      if (prosHeading && !consHeading && tagName === 'ul') {
        const items = Array.from(currentElement.querySelectorAll('li'));
        prosItems = items.map(li => li.textContent?.trim() || '');
        elementsToRemove.push(currentElement);
      }
      
      // If we found cons heading, collect list items
      if (consHeading && tagName === 'ul') {
        const items = Array.from(currentElement.querySelectorAll('li'));
        consItems = items.map(li => li.textContent?.trim() || '');
        elementsToRemove.push(currentElement);
        break; // Stop after collecting cons
      }
      
      // Stop if we hit another major heading
      if (['h2', 'h3'].includes(tagName) && currentElement !== prosHeading && currentElement !== consHeading) {
        break;
      }
      
      currentElement = currentElement.nextElementSibling;
    }
    
    // Only proceed if we found both pros and cons
    if (prosItems.length > 0 && consItems.length > 0) {
      // Create placeholder div that React will replace with ProsConsCard
      const placeholder = doc.createElement('div');
      placeholder.setAttribute('data-pros-cons-placeholder', 'true');
      placeholder.setAttribute('data-pros', JSON.stringify(prosItems));
      placeholder.setAttribute('data-cons', JSON.stringify(consItems));
      
      // Insert placeholder right after the "Pros and Cons" heading
      prosConsHeading.parentNode?.insertBefore(placeholder, prosConsHeading.nextSibling);
      
      // Remove the subheadings and lists
      elementsToRemove.forEach(el => el.remove());
    }
    
    return doc.body.innerHTML;
  };

  // Render content and replace pros/cons placeholders with actual cards
  const renderContentWithProsConsCards = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const placeholders = Array.from(doc.querySelectorAll('[data-pros-cons-placeholder]'));
    
    if (placeholders.length === 0) {
      return <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="prose prose-slate max-w-none" />;
    }
    
    // Split content by placeholders and interleave with ProsConsCards
    const elements: JSX.Element[] = [];
    let lastIndex = 0;
    
    placeholders.forEach((placeholder, index) => {
      const prosData = placeholder.getAttribute('data-pros');
      const consData = placeholder.getAttribute('data-cons');
      
      if (prosData && consData) {
        const pros = JSON.parse(prosData);
        const cons = JSON.parse(consData);
        
        // Get all content before this placeholder
        const beforeContent = doc.body.innerHTML.substring(lastIndex, doc.body.innerHTML.indexOf(placeholder.outerHTML));
        
        if (beforeContent.trim()) {
          elements.push(
            <div 
              key={`content-${index}`}
              dangerouslySetInnerHTML={{ __html: beforeContent }} 
              className="prose prose-slate max-w-none" 
            />
          );
        }
        
        elements.push(<ProsConsCard key={`pros-cons-${index}`} pros={pros} cons={cons} />);
        
        lastIndex = doc.body.innerHTML.indexOf(placeholder.outerHTML) + placeholder.outerHTML.length;
      }
    });
    
    // Add remaining content after last placeholder
    const remainingContent = doc.body.innerHTML.substring(lastIndex);
    if (remainingContent.trim()) {
      elements.push(
        <div 
          key="content-final"
          dangerouslySetInnerHTML={{ __html: remainingContent }} 
          className="prose prose-slate max-w-none" 
        />
      );
    }
    
    return <>{elements}</>;
  };

  const parseContentWithBroker = (content: string, broker: Broker | undefined) => {
    // Add affiliate links to the content (content already has heading IDs from contentWithHeadingIds variable)
    const contentWithAffiliateLinks = addAffiliateLinks(content);
    
    // Process pros/cons sections inline
    const processedContent = processContentWithProsConsCard(contentWithAffiliateLinks);
    
    if (!broker) {
      return renderContentWithProsConsCards(processedContent);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(processedContent, 'text/html');
    
    // Get all direct children of body to preserve structure and avoid duplicates
    const allElements = Array.from(doc.body.children);

    if (allElements.length < 3) {
      return (
        <>
          {renderContentWithProsConsCards(processedContent)}
          <InlineBrokerCard broker={broker} />
        </>
      );
    }

    // Calculate 40% position
    const targetIndex = Math.floor(allElements.length * 0.40);
    
    // Find first heading (h2, h3, h4, h5, h6) at or after 40% mark (including nested headings)
    let insertIndex = -1;
    for (let i = targetIndex; i < allElements.length; i++) {
      const element = allElements[i];
      const tagName = element.tagName.toLowerCase();
      const hasHeading = ['h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName) || 
                         element.querySelector('h2, h3, h4, h5, h6');
      if (hasHeading) {
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

    const beforeContent = beforeBroker.map(el => el.outerHTML).join('');
    const afterContent = afterBroker.map(el => el.outerHTML).join('');
    
    return (
      <>
        {renderContentWithProsConsCards(beforeContent)}
        <InlineBrokerCard broker={broker} />
        {renderContentWithProsConsCards(afterContent)}
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <Navigation />
        
        {/* Hero Image Skeleton */}
        <Skeleton className="w-full h-[300px] md:h-[400px]" />
        
        <main className="flex-1 relative z-10" style={{ background: "#f5f7f6" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid lg:grid-cols-[1fr_350px] gap-8 xl:gap-12">
              {/* Main Content */}
              <article className="min-w-0 content-light">
                <div className="rounded-xl p-6 md:p-8 mb-8" style={{ background: "#ffffff", border: "1px solid #e8edea" }}>
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

  const featuredImage = getFeaturedImage(post);
  const readingTime = calculateReadingTime(stripHtml(post.content || ''));
  
  const seoImage = featuredImage || "https://entrylab.io/og-image.jpg";
  const seoUrl = `https://entrylab.io${getArticleUrl(post)}`;

  const categorySlug = post.category || "news";
  const categoryName = getCategoryName(post);
  
  const breadcrumbs = [
    { name: "Home", url: "https://entrylab.io" },
    { name: categoryName, url: `https://entrylab.io/${categorySlug}` },
    { name: stripHtml(post.title), url: seoUrl }
  ];

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        url={seoUrl}
        type="article"
        publishedTime={post.publishedAt ? String(post.publishedAt) : undefined}
        modifiedTime={post.updatedAt ? String(post.updatedAt) : undefined}
        author={getAuthorName(post)}
        preloadImage={featuredImage}
        categories={post.category ? [post.category] : []}
        tags={[]}
        breadcrumbs={breadcrumbs}
        disableStructuredData={true}
      />
      <Navigation />
      
      {/* Hero Section */}
      {featuredImage && (
        <div className="relative overflow-hidden" style={{ background: "#1a1e1c" }}>
          {/* Signals-style orbs */}
          <div className="signals-bg-orb signals-bg-orb-1" />
          <div className="signals-bg-orb signals-bg-orb-2" />
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
            backgroundImage: `radial-gradient(circle, #2bb32a 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }} />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
            <div className="grid lg:grid-cols-[55%_45%] gap-6 items-center">
              {/* Article Info (60% desktop, full width mobile - shows second on mobile) */}
              <div className="space-y-4 text-white order-2 lg:order-1">
                {/* Category Badge */}
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(43,179,42,0.15)", border: "1px solid rgba(43,179,42,0.3)", color: "#2bb32a" }}
                >
                  <BookOpen className="h-3 w-3" />
                  {getCategoryName(post)}
                </div>

                {/* Title */}
                <h1 
                  className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight" 
                  dangerouslySetInnerHTML={{ __html: post.title }} 
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

                {/* Article excerpt */}
                <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-2xl">
                  {stripHtml(post.excerpt || '').substring(0, 155)}
                  {stripHtml(post.excerpt || '').length > 155 ? '...' : ''}
                </p>

                {/* Forex News Icons Row */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs text-white/70">Market</div>
                      <div className="text-sm font-semibold">Analysis</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs text-white/70">Expert</div>
                      <div className="text-sm font-semibold">Insights</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
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
                <div className="relative rounded-lg overflow-hidden shadow-2xl border-2 border-primary/30 bg-card">
                  <div className="relative aspect-[22/10] md:aspect-[16/9] bg-muted">
                    <OptimizedImage
                      src={featuredImage}
                      alt={stripHtml(post.title)}
                      width="900"
                      height="500"
                      className="w-full h-full object-cover"
                      priority={true}
                      data-testid="img-article-hero"
                    />
                  </div>
                </div>
                {/* Decorative glow */}
                <div className="absolute -inset-3 bg-primary/20 rounded-lg blur-xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback Title Section (when no featured image) */}
      {!featuredImage && (
        <div className="relative overflow-hidden" style={{ background: "#1a1e1c" }}>
          <div className="signals-bg-orb signals-bg-orb-1" />
          <div className="signals-bg-orb signals-bg-orb-2" />
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
            backgroundImage: `radial-gradient(circle, #2bb32a 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }} />
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
            <div className="space-y-4 text-white max-w-4xl">
              {/* Category Badge */}
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(43,179,42,0.15)", border: "1px solid rgba(43,179,42,0.3)", color: "#2bb32a" }}
              >
                <BookOpen className="h-3 w-3" />
                {getCategoryName(post)}
              </div>

              {/* Title */}
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight" 
                dangerouslySetInnerHTML={{ __html: post.title }} 
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
                    Independant Analysis
                  </Badge>
                </div>
              </div>

              {/* Article Description */}
              <p className="text-base md:text-lg text-white/80 leading-relaxed">
                {stripHtml(post.excerpt || '').substring(0, 155)}
                {stripHtml(post.excerpt || '').length > 155 ? '...' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 relative z-10" style={{ background: "#f5f7f6" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-[1fr_350px] gap-8 xl:gap-12">
            {/* Main Content */}
            <article className="min-w-0 content-light">
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
              <div className="rounded-lg p-6 md:p-8" style={{ background: "#ffffff", border: "1px solid #e8edea" }}>
                <div style={{ color: "#111827" }}>
                  {parseContentWithBroker(contentWithHeadingIds, featuredBroker)}
                </div>
              </div>

              {/* Affiliate Disclosure */}
              <div className="mt-6 p-4 rounded-lg" style={{ background: "#f0f4f2", border: "1px solid #e8edea" }}>
                <p className="text-sm flex items-start gap-2" style={{ color: "#6b7280" }}>
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

            </article>

            {/* Desktop: Sticky Sidebar */}
            <aside className="hidden lg:block content-light">
              {/* Match trending topics spacing (mb-8 = 32px) + badges height (~40px) */}
              <div className="sticky top-24 space-y-8" style={{ marginTop: '72px' }}>
                {/* Table of Contents */}
                {contentWithHeadingIds && (
                  <div className="mb-6">
                    <TableOfContents content={contentWithHeadingIds} />
                  </div>
                )}

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
                          title={relatedPost.title}
                          excerpt={stripHtml(relatedPost.excerpt || '')}
                          author={getAuthorName(relatedPost)}
                          date={relatedPost.publishedAt ? String(relatedPost.publishedAt) : ""}
                          category={getCategoryName(relatedPost)}
                          link={getArticleUrl(relatedPost)}
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
        <NewsletterCTA />
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
