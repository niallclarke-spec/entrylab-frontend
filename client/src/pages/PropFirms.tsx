import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { BrokerCardEnhanced } from "@/components/BrokerCardEnhanced";
import { Loader2, Shield, Star, TrendingUp, Zap, CheckCircle2, Award, Users, Key, DollarSign, Headphones, FileText, Target, Tag } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Broker } from "@shared/schema";

interface PropFirmCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export default function PropFirms() {
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data: wordpressPropFirms, isLoading } = useQuery<any[]>({
    queryKey: ["/api/wordpress/prop-firms"],
  });

  const { data: categories = [] } = useQuery<PropFirmCategory[]>({
    queryKey: ["/api/wordpress/prop-firm-categories"],
  });

  const transformPropFirm = (wpPropFirm: any): (Broker & { categoryIds: number[] }) | null => {
    const acf = wpPropFirm.acf || {};
    const logo = acf.prop_firm_logo?.url || wpPropFirm._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    const name = wpPropFirm.title?.rendered;
    if (!name) return null;

    const isFeatured = acf.is_featured === true || acf.is_featured === "1";
    const keyFeatures = acf.prop_firm_usp 
      ? acf.prop_firm_usp.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f).slice(0, 4)
      : ["Funded accounts up to $200K", "Profit split 80/20", "Quick evaluation", "Professional support"];
    const prosText = acf.pros 
      ? acf.pros.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f)
      : keyFeatures;

    // Extract category IDs from WordPress taxonomy data (uses dashes, not underscores)
    const categoryIds = wpPropFirm["prop-firm-category"] || [];

    return {
      id: wpPropFirm.id.toString(),
      name: name,
      logo: logo || "https://placehold.co/200x80/1a1a1a/8b5cf6?text=" + encodeURIComponent(name),
      rating: parseFloat(acf.rating) || 4.5,
      verified: true,
      featured: isFeatured,
      tagline: acf.prop_firm_usp ? acf.prop_firm_usp.split(/[,\n]+/)[0] : "Trusted prop trading firm",
      bonusOffer: acf.discount_code || "Get Funded Today",
      link: acf.affiliate_link || wpPropFirm.link || "#",
      pros: prosText.slice(0, 3),
      highlights: prosText,
      features: keyFeatures.map((f: string) => ({ icon: "trending", text: f })),
      featuredHighlights: keyFeatures,
      categoryIds,
    };
  };

  const propFirms = wordpressPropFirms?.map(transformPropFirm).filter((p): p is (Broker & { categoryIds: number[] }) => p !== null) || [];
  
  // Apply filters
  let filteredPropFirms = propFirms;
  
  // Filter by featured
  if (filterFeatured !== null) {
    filteredPropFirms = filteredPropFirms.filter(p => p.featured === filterFeatured);
  }
  
  // Filter by category
  if (selectedCategory !== null) {
    filteredPropFirms = filteredPropFirms.filter(p => p.categoryIds.includes(selectedCategory));
  }

  const featuredCount = propFirms.filter(p => p.featured).length;
  const avgRating = propFirms.length > 0 
    ? (propFirms.reduce((sum, p) => sum + p.rating, 0) / propFirms.length).toFixed(1)
    : "0.0";
  const totalVerified = propFirms.filter(p => p.verified).length;

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
        title="Prop Firm Reviews | EntryLab"
        description="Compare and review top prop trading firms. Find the best funded trading opportunities with competitive profit splits and evaluation processes."
        url="https://entrylab.io/prop-firms"
      />
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border-b">
        {/* Animated background accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="text-center mb-12">
            {/* Badge */}
            <Badge className="mb-6 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
              <Target className="h-3 w-3 mr-1.5" />
              Trusted Prop Firm Reviews
            </Badge>
            
            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Compare Top Prop Trading Firms
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Get funded and trade with the best proprietary trading firms. Compare evaluations, profit splits, and funding opportunities.
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-8">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium text-muted-foreground">
                {avgRating} Avg Rating
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-chart-2" />
              <span>{totalVerified} Verified Firms</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-chart-2" />
              <span>Community Verified</span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Filter by category:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl">
              <Badge 
                variant={filterFeatured === null && selectedCategory === null ? "default" : "secondary"}
                className="cursor-pointer px-6 py-2 hover-elevate active-elevate-2"
                onClick={() => {
                  setFilterFeatured(null);
                  setSelectedCategory(null);
                }}
                data-testid="badge-filter-all"
              >
                All Prop Firms ({propFirms.length})
              </Badge>
              <Badge 
                variant={filterFeatured === true && selectedCategory === null ? "default" : "secondary"}
                className="cursor-pointer px-6 py-2 hover-elevate active-elevate-2"
                onClick={() => {
                  setFilterFeatured(true);
                  setSelectedCategory(null);
                }}
                data-testid="badge-filter-featured"
              >
                <Star className="h-3.5 w-3.5 mr-1.5" />
                Featured ({featuredCount})
              </Badge>
              
              {/* Dynamic Category Filters - Only show categories with prop firms */}
              {categories
                .map((category) => ({
                  ...category,
                  count: propFirms.filter(p => p.categoryIds.includes(category.id)).length
                }))
                .filter(category => category.count > 0)
                .map((category) => (
                  <Badge 
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "secondary"}
                    className="cursor-pointer px-6 py-2 hover-elevate active-elevate-2"
                    onClick={() => {
                      setSelectedCategory(selectedCategory === category.id ? null : category.id);
                      setFilterFeatured(null);
                    }}
                    data-testid={`badge-filter-${category.slug}`}
                  >
                    <Tag className="h-3.5 w-3.5 mr-1.5" />
                    {category.name} ({category.count})
                  </Badge>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Key Decision Factors */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <Key className="h-5 w-5 text-emerald-500" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                What to Look for in a Prop Firm
              </h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Make an informed decision with these key factors to consider
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Profit Split */}
            <div className="bg-card rounded-xl p-6 border hover-elevate transition-all" data-testid="card-decision-profit-split">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 mb-4">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Profit Split
              </h3>
              <p className="text-sm text-muted-foreground">
                Compare profit sharing ratios and find firms offering competitive trader compensation
              </p>
            </div>

            {/* Evaluation Process */}
            <div className="bg-card rounded-xl p-6 border hover-elevate transition-all" data-testid="card-decision-evaluation">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 mb-4">
                <Target className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Evaluation Process
              </h3>
              <p className="text-sm text-muted-foreground">
                Review challenge difficulty, time limits, and rules to find programs that match your style
              </p>
            </div>

            {/* Scaling Plans */}
            <div className="bg-card rounded-xl p-6 border hover-elevate transition-all" data-testid="card-decision-scaling">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 mb-4">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Scaling Plans
              </h3>
              <p className="text-sm text-muted-foreground">
                Check account scaling opportunities and maximum funding available for successful traders
              </p>
            </div>

            {/* Payout Speed */}
            <div className="bg-card rounded-xl p-6 border hover-elevate transition-all" data-testid="card-decision-payouts">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 mb-4">
                <Zap className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Payout Speed
              </h3>
              <p className="text-sm text-muted-foreground">
                Verify withdrawal frequency and processing times to ensure timely access to your profits
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Section Heading */}
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Top Prop Trading Firms
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Compare and choose from our curated selection of trusted prop firms
            </p>
          </div>

          {/* Prop Firms Grid */}
          {filteredPropFirms.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPropFirms.map((firm) => (
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
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No prop firms found with the selected filter.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
