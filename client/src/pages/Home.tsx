import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { MarketTicker } from "@/components/MarketTicker";
import { Hero } from "@/components/Hero";
import { TrendingTopics } from "@/components/TrendingTopics";
import { FeaturedBroker } from "@/components/FeaturedBroker";
import { TrustSignals } from "@/components/TrustSignals";
import { ArticleCard } from "@/components/ArticleCard";
import { BrokerCardEnhanced } from "@/components/BrokerCardEnhanced";
import { NewsletterCTA } from "@/components/NewsletterCTA";
import { Footer } from "@/components/Footer";
import type { WordPressPost, Broker } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  const transformBroker = (wpBroker: any): Broker | null => {
    const acf = wpBroker.acf || {};
    const logo = acf.broker_logo?.url || wpBroker._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    
    const name = wpBroker.title?.rendered;
    if (!name) return null;
    
    // Key features for the 4 feature cards (from broker_usp)
    // Handle both comma-separated and newline-separated
    const keyFeatures = acf.broker_usp 
      ? acf.broker_usp.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f).slice(0, 4)
      : [
        "Ultra-low spreads",
        "Fast execution",
        "Regulated broker",
        "24/7 support"
      ];
    
    // Why choose reasons (from why_choose)
    // Handle both comma-separated and newline-separated
    const whyChoose = acf.why_choose 
      ? acf.why_choose.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f)
      : keyFeatures;
    
    return {
      id: wpBroker.id.toString(),
      name: name,
      logo: logo || "https://placehold.co/200x80/1a1a1a/8b5cf6?text=" + encodeURIComponent(name),
      rating: parseFloat(acf.rating) || 4.5,
      verified: true,
      featured: wpBroker.id === wordpressBrokers?.[0]?.id,
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
  const brokers = wpBrokers.length > 0 ? wpBrokers : (fallbackBrokers || []);

  const featuredPost = posts?.[0];
  const latestPosts = posts?.slice(1, 7) || [];
  const featuredBroker = brokers?.[0];
  const popularBrokers = brokers?.slice(1) || [];

  const getCategoryName = (post: WordPressPost) => {
    return post._embedded?.["wp:term"]?.[0]?.[0]?.name || "News";
  };

  const getAuthorName = (post: WordPressPost) => {
    return post._embedded?.author?.[0]?.name || "EntryLab Team";
  };

  const getFeaturedImage = (post: WordPressPost) => {
    return post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <MarketTicker />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : featuredPost ? (
        <>
          <Hero
            title={featuredPost.title.rendered}
            excerpt={featuredPost.excerpt.rendered}
            author={getAuthorName(featuredPost)}
            date={featuredPost.date}
            category={getCategoryName(featuredPost)}
            link={featuredPost.link}
          />

          <TrendingTopics 
            selectedCategory={selectedCategory} 
            onCategorySelect={setSelectedCategory}
          />

          <TrustSignals />

          {featuredBroker && (
            <FeaturedBroker
              name={featuredBroker.name}
              logo={featuredBroker.logo}
              tagline={featuredBroker.tagline || ""}
              rating={featuredBroker.rating}
              features={featuredBroker.features || []}
              highlights={featuredBroker.highlights || []}
              bonusOffer={featuredBroker.bonusOffer}
              link={featuredBroker.link}
            />
          )}

          <section className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground" data-testid="text-latest-news">
                  Latest News
                </h2>
                <a href="#" className="text-primary hover:underline font-medium" data-testid="link-view-all">
                  View All
                </a>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestPosts.map((post) => (
                  <ArticleCard
                    key={post.id}
                    title={post.title.rendered}
                    excerpt={post.excerpt.rendered}
                    author={getAuthorName(post)}
                    date={post.date}
                    category={getCategoryName(post)}
                    link={post.link}
                    imageUrl={getFeaturedImage(post)}
                  />
                ))}
              </div>
            </div>
          </section>

          {popularBrokers.length > 0 && (
            <section className="py-16 md:py-24 bg-gradient-to-b from-background via-card/50 to-background">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-popular-brokers">
                    Top Rated Brokers
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Compare the best forex brokers trusted by thousands of traders worldwide
                  </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            </section>
          )}

          <NewsletterCTA />
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
