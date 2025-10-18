import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { BrokerCardEnhanced } from "@/components/BrokerCardEnhanced";
import { Loader2, Shield, Star, Award, ArrowRight, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { trackPageView } from "@/lib/gtm";
import { transformPropFirm } from "@/lib/transforms";
import type { Broker } from "@shared/schema";

export default function PropFirmCategoryArchive() {
  const params = useParams();
  const [, setLocation] = useLocation();
  
  // Extract slug from params or from URL
  const slug = params.slug || window.location.pathname.slice(1);

  useEffect(() => {
    trackPageView(`/${slug}`, `${slug} | EntryLab`);
  }, [slug]);

  // Fetch prop firm categories
  const { data: propFirmCategories } = useQuery<any[]>({
    queryKey: ["/api/wordpress/prop-firm-categories"],
  });

  // Fetch category content (prop firms in this category)
  const { data: categoryContent, isLoading } = useQuery<any>({
    queryKey: [`/api/wordpress/category-content?category=${slug}`],
    enabled: !!slug,
  });

  const propFirms = categoryContent?.propFirms?.map(transformPropFirm).filter((p: Broker | null): p is Broker => p !== null) || [];
  
  const totalVerified = propFirms.filter((p: Broker) => p.verified).length;
  const avgRating = propFirms.length > 0 
    ? (propFirms.reduce((sum: number, p: Broker) => sum + p.rating, 0) / propFirms.length).toFixed(1)
    : "0.0";

  // Filter categories to show only prop firm related categories
  const filteredCategories = (propFirmCategories || []);

  // Find current category by slug and use WordPress name instead of generating from slug
  const currentCategory = propFirmCategories?.find((cat: any) => cat.slug === slug);
  const categoryName = currentCategory?.name || slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

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
        title={`${categoryName} | EntryLab`}
        description={`Discover the ${categoryName.toLowerCase()}. Compare verified prop firms with competitive profit splits, fast payouts, and trusted trader reviews.`}
        url={`https://entrylab.io/${slug}`}
        breadcrumbs={[
          { name: "Home", url: "https://entrylab.io" },
          { name: "Prop Firms", url: "https://entrylab.io/prop-firms" },
          { name: categoryName, url: `https://entrylab.io/${slug}` }
        ]}
      />
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="text-center">
            {/* Badge */}
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <Award className="h-3 w-3 mr-1.5" />
              Curated Selection
            </Badge>
            
            {/* Headline */}
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              {categoryName}
            </h1>
            
            {/* Subheading */}
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
              Top verified prop firms. Compare trusted funding programs with competitive profit splits, fast evaluations, and verified trader reviews.
            </p>

            {/* Stats */}
            {propFirms.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card/50 backdrop-blur-sm border">
                  <div className="flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-foreground leading-none mb-1">{totalVerified}</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">Verified</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card/50 backdrop-blur-sm border">
                  <div className="flex items-center justify-center">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-foreground leading-none mb-1">{avgRating}</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">Avg Rating</div>
                  </div>
                </div>
              </div>
            )}

            {/* Category Tabs - Only Prop Firm Categories */}
            {filteredCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {filteredCategories.map((cat: any) => (
                  <Badge
                    key={cat.slug}
                    variant={cat.slug === slug ? "default" : "outline"}
                    className="cursor-pointer hover-elevate active-elevate-2 transition-all px-4 py-2"
                    onClick={() => setLocation(`/${cat.slug}`)}
                    data-testid={`badge-category-${cat.slug}`}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Prop Firms Grid */}
          {propFirms.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                {propFirms.map((propFirm: Broker, index: number) => (
                  <BrokerCardEnhanced
                    key={propFirm.id}
                    name={propFirm.name}
                    logo={propFirm.logo}
                    verified={propFirm.verified}
                    rating={propFirm.rating}
                    pros={propFirm.pros}
                    highlights={propFirm.highlights}
                    link={propFirm.link}
                    featured={propFirm.featured}
                    slug={propFirm.slug}
                    type="prop-firm"
                    pageLocation="archive"
                    placementType="broker_list_card"
                    position={index + 1}
                  />
                ))}
              </div>

              {/* CTA to News */}
              <div className="border-t pt-12">
                <p className="text-center text-sm text-muted-foreground mb-3">
                  Looking for latest market insights?
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button 
                    asChild 
                    variant="ghost" 
                    className="gap-2"
                    data-testid="button-see-latest-news"
                  >
                    <a href="/news">
                      <Newspaper className="h-4 w-4" />
                      See Latest FX News
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No prop firms found in this category.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
