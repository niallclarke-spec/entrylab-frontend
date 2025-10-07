import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { InlineBrokerCard } from "@/components/InlineBrokerCard";
import { BrokerCardEnhanced } from "@/components/BrokerCardEnhanced";
import { ArticleCard } from "@/components/ArticleCard";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, User, Share2, BookOpen, TrendingUp, Building2, BarChart3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WordPressPost, Broker } from "@shared/schema";

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

  const { data: posts } = useQuery<WordPressPost[]>({
    queryKey: ["/api/wordpress/posts"],
  });

  const transformBroker = (wpBroker: any): Broker | null => {
    const acf = wpBroker.acf || {};
    const logo = acf.broker_logo?.url || wpBroker._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    const name = wpBroker.title?.rendered;
    if (!name) return null;

    const isFeatured = acf.is_featured === true || acf.is_featured === "1";
    const keyFeatures = acf.broker_usp 
      ? acf.broker_usp.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f).slice(0, 4)
      : ["Ultra-low spreads", "Fast execution", "Regulated broker", "24/7 support"];
    const whyChoose = acf.why_choose 
      ? acf.why_choose.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f)
      : keyFeatures;

    return {
      id: wpBroker.id.toString(),
      name: name,
      logo: logo || "https://placehold.co/200x80/1a1a1a/8b5cf6?text=" + encodeURIComponent(name),
      rating: parseFloat(acf.rating) || 4.5,
      verified: true,
      featured: isFeatured,
      tagline: acf.broker_intro || "Trusted forex broker",
      bonusOffer: acf.bonus_offer || "Get 100% Deposit Bonus",
      link: acf.affiliate_link || wpBroker.link || "#",
      pros: whyChoose.slice(0, 3),
      highlights: whyChoose,
      features: keyFeatures.map((f: string) => ({ icon: "trending", text: f })),
      featuredHighlights: keyFeatures,
    };
  };

  const wpBrokers = wordpressBrokers?.map(transformBroker).filter((b): b is Broker => b !== null) || [];
  const featuredBroker = wpBrokers.find(b => b.featured);
  const popularBrokers = wpBrokers.slice(0, 3);

  const getCategoryName = (p: WordPressPost) => p._embedded?.["wp:term"]?.[0]?.[0]?.name || "News";
  const getAuthorName = (p: WordPressPost) => p._embedded?.author?.[0]?.name || "EntryLab Team";
  const getFeaturedImage = (p: WordPressPost) => p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;

  // Get related articles from same category
  const currentCategoryId = post?._embedded?.["wp:term"]?.[0]?.[0]?.id;
  const relatedPosts = posts
    ?.filter(p => p.id !== post?.id && p._embedded?.["wp:term"]?.[0]?.[0]?.id === currentCategoryId)
    .slice(0, 2) || [];

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const calculateReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const parseContentWithBroker = (content: string, broker: Broker | undefined) => {
    if (!broker) {
      return <div dangerouslySetInnerHTML={{ __html: content }} className="prose prose-lg max-w-none dark:prose-invert" />;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const paragraphs = Array.from(doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote'));

    if (paragraphs.length < 3) {
      return (
        <>
          <div dangerouslySetInnerHTML={{ __html: content }} className="prose prose-lg max-w-none dark:prose-invert" />
          <InlineBrokerCard broker={broker} />
        </>
      );
    }

    const insertIndex = Math.floor(paragraphs.length * 0.45);
    const beforeBroker: Element[] = [];
    const afterBroker: Element[] = [];

    paragraphs.forEach((p, i) => {
      if (i < insertIndex) {
        beforeBroker.push(p);
      } else {
        afterBroker.push(p);
      }
    });

    return (
      <>
        <div 
          dangerouslySetInnerHTML={{ __html: beforeBroker.map(el => el.outerHTML).join('') }} 
          className="prose prose-lg max-w-none dark:prose-invert" 
        />
        <InlineBrokerCard broker={broker} />
        <div 
          dangerouslySetInnerHTML={{ __html: afterBroker.map(el => el.outerHTML).join('') }} 
          className="prose prose-lg max-w-none dark:prose-invert" 
        />
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
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
  const readingTime = calculateReadingTime(stripHtml(post.content.rendered));
  
  const seoTitle = stripHtml(post.title.rendered) + " | EntryLab";
  const seoDescription = stripHtml(post.excerpt.rendered).substring(0, 160) || 
    stripHtml(post.content.rendered).substring(0, 160);
  const seoImage = featuredImage || "https://entrylab.io/og-image.jpg";
  const seoUrl = `https://entrylab.io/article/${post.slug}`;

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
      />
      <Navigation />
      
      {/* Hero Section */}
      {featuredImage && (
        <div className="w-full h-[300px] md:h-[400px] overflow-hidden bg-muted relative">
          <img
            src={featuredImage}
            alt={stripHtml(post.title.rendered)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      )}

      <main className="flex-1 -mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-[1fr_350px] gap-8 xl:gap-12">
            {/* Main Content */}
            <article className="min-w-0">
              {/* Article Header with Subtle Top Glow */}
              <div className="bg-card rounded-xl p-6 md:p-8 mb-8 relative shadow-lg before:absolute before:inset-0 before:rounded-xl before:pointer-events-none before:bg-gradient-to-b before:from-primary/20 before:to-transparent before:h-[25%]">
                {/* Unified top accent line that wraps corners */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(168, 85, 247, 0.8) 5%, rgba(168, 85, 247, 1) 50%, rgba(168, 85, 247, 0.8) 95%, transparent 100%)'
                  }}
                />
                
                <div className="relative">
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <Badge 
                      variant="secondary" 
                      data-testid="badge-category"
                      className="bg-emerald-500 text-white hover:bg-emerald-600 border-0"
                    >
                      {getCategoryName(post)}
                    </Badge>
                    <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                      <BookOpen className="h-3 w-3" />
                      {readingTime} min read
                    </Badge>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                  
                  <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{getAuthorName(post)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>

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

              {/* Mobile: Popular Brokers Below Article */}
              {popularBrokers.length > 0 && (
                <div className="lg:hidden mt-8 space-y-6">
                  <h3 className="text-2xl font-bold text-foreground">Top Rated Brokers</h3>
                  <div className="grid gap-4">
                    {popularBrokers.map((broker) => (
                      <BrokerCardEnhanced
                        key={broker.id}
                        name={broker.name}
                        logo={broker.logo}
                        verified={broker.verified}
                        rating={broker.rating}
                        pros={broker.pros}
                        highlights={broker.highlights}
                        link={broker.link}
                      />
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Desktop: Sticky Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-8">
                {/* Popular Brokers */}
                {popularBrokers.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-4">Top Rated Brokers</h3>
                    <div className="space-y-4">
                      {popularBrokers.map((broker) => (
                        <BrokerCardEnhanced
                          key={broker.id}
                          name={broker.name}
                          logo={broker.logo}
                          verified={broker.verified}
                          rating={broker.rating}
                          pros={broker.pros}
                          highlights={broker.highlights}
                          link={broker.link}
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
                          excerpt={relatedPost.excerpt.rendered}
                          author={getAuthorName(relatedPost)}
                          date={relatedPost.date}
                          category={getCategoryName(relatedPost)}
                          link={`/article/${relatedPost.slug}`}
                          imageUrl={getFeaturedImage(relatedPost)}
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
    </div>
  );
}
