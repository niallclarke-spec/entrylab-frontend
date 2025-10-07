import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { BrokerCardEnhanced } from "@/components/BrokerCardEnhanced";
import { Loader2, Shield, Star, TrendingUp, Zap, CheckCircle2, Award, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Broker } from "@shared/schema";

export default function Brokers() {
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);

  const { data: wordpressBrokers, isLoading } = useQuery<any[]>({
    queryKey: ["/api/wordpress/brokers"],
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

  const brokers = wordpressBrokers?.map(transformBroker).filter((b): b is Broker => b !== null) || [];
  
  const filteredBrokers = filterFeatured === null 
    ? brokers 
    : brokers.filter(b => b.featured === filterFeatured);

  const featuredCount = brokers.filter(b => b.featured).length;
  const avgRating = brokers.length > 0 
    ? (brokers.reduce((sum, b) => sum + b.rating, 0) / brokers.length).toFixed(1)
    : "0.0";
  const totalVerified = brokers.filter(b => b.verified).length;

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

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Broker Reviews | EntryLab"
        description="Compare and review the top forex brokers. Find verified brokers with competitive spreads, fast execution, and trusted regulation."
        url="https://entrylab.io/brokers"
      />
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border-b">
        {/* Animated background accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="text-center mb-12">
            {/* Badge */}
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <Award className="h-3 w-3 mr-1.5" />
              Trusted Broker Reviews Since 2020
            </Badge>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                Forex Broker
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Compare {brokers.length} verified brokers with unbiased reviews based on real trading conditions
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mb-10">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border">
                <Shield className="h-5 w-5 text-emerald-500" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-foreground">{totalVerified}</div>
                  <div className="text-xs text-muted-foreground">Verified Brokers</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border">
                <Star className="h-5 w-5 text-amber-500" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-foreground">{avgRating}</div>
                  <div className="text-xs text-muted-foreground">Avg Rating</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-foreground">{featuredCount}</div>
                  <div className="text-xs text-muted-foreground">Top Rated</div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground mb-10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>100% Unbiased Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>Real Trading Conditions</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-chart-2" />
                <span>Community Verified</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex items-center gap-2 p-1 rounded-lg bg-muted/50 backdrop-blur-sm">
              <Badge 
                variant={filterFeatured === null ? "default" : "secondary"}
                className="cursor-pointer px-6 py-2 hover-elevate active-elevate-2"
                onClick={() => setFilterFeatured(null)}
                data-testid="badge-filter-all"
              >
                All Brokers ({brokers.length})
              </Badge>
              <Badge 
                variant={filterFeatured === true ? "default" : "secondary"}
                className="cursor-pointer px-6 py-2 hover-elevate active-elevate-2"
                onClick={() => setFilterFeatured(true)}
                data-testid="badge-filter-featured"
              >
                <Star className="h-3.5 w-3.5 mr-1.5" />
                Featured ({featuredCount})
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Brokers Grid */}
          {filteredBrokers.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBrokers.map((broker) => (
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
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No brokers found with the selected filter.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
