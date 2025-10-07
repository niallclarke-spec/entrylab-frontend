import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { BrokerCardEnhanced } from "@/components/BrokerCardEnhanced";
import { Loader2, Filter } from "lucide-react";
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
      
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Broker Reviews
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Compare verified forex brokers. All reviews are unbiased and based on real trading conditions.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="mb-8 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">Filter:</span>
            </div>
            <Badge 
              variant={filterFeatured === null ? "default" : "outline"}
              className="cursor-pointer px-4 py-1.5"
              onClick={() => setFilterFeatured(null)}
              data-testid="badge-filter-all"
            >
              All Brokers ({brokers.length})
            </Badge>
            <Badge 
              variant={filterFeatured === true ? "default" : "outline"}
              className="cursor-pointer px-4 py-1.5"
              onClick={() => setFilterFeatured(true)}
              data-testid="badge-filter-featured"
            >
              Featured ({featuredCount})
            </Badge>
          </div>

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
