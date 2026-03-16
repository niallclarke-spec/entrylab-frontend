import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Star, Shield, DollarSign, TrendingUp, Award, Globe, Headphones, CreditCard, ArrowLeft, ExternalLink, Check, X, ChevronRight, Zap, ArrowRight, Gauge, Activity, Info, ArrowUp, MessageSquare, Copy, CheckCircle2, Calendar, GitCompare, Trophy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { processBrokerContent } from "@/lib/transforms";
import type { Broker } from "@shared/schema";
import { trackPageView, trackReviewView, trackAffiliateClick } from "@/lib/gtm";
import { getCountryCode } from "@/lib/countryCodeMap";
import { ReviewModalSimple as ReviewModal } from "@/components/ReviewModalSimple";
import { BrokerAlertPopup } from "@/components/BrokerAlertPopup";
import { ProsConsCard } from "@/components/ProsConsCard";
import { TableOfContents } from "@/components/TableOfContents";
import { useToast } from "@/hooks/use-toast";

function RelatedComparisons({ slug, entityType, entityName }: { slug: string; entityType: string; entityName: string }) {
  const { data: related } = useQuery<any[]>({
    queryKey: [`/api/comparisons/related/${entityType}/${slug}`],
    queryFn: async () => {
      const res = await fetch(`/api/comparisons/related/${entityType}/${slug}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!slug,
  });

  if (!related?.length) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 pb-12">
      <div className="border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-[#2bb32a]" />
          Compare {entityName} with Other Prop Firms
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {related.slice(0, 6).map((c: any) => {
            const otherName = c.entityASlug === slug ? c.entityBName : c.entityAName;
            const winnerName = c.overallWinnerId === c.entityAId ? c.entityAName : c.overallWinnerId === c.entityBId ? c.entityBName : null;
            return (
              <Link
                key={c.id}
                href={`/compare/prop-firm/${c.slug}`}
                className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:border-[#2bb32a]/30 hover:bg-white/3 transition-all group"
                data-testid={`link-related-${c.id}`}
              >
                <div>
                  <p className="text-sm text-white group-hover:text-[#2bb32a] transition-colors">
                    {entityName} vs {otherName}
                  </p>
                  {winnerName && (
                    <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-[#2bb32a]" /> Winner: {winnerName}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-[#2bb32a] flex-shrink-0 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function PropFirmReview() {
  const params = useParams();
  const slug = params.slug;
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const { toast } = useToast();

  const copyDiscountCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast({
      title: "Discount code copied!",
      description: `"${code}" has been copied to your clipboard`,
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const { data: rawPropFirm, isLoading } = useQuery<any>({
    queryKey: ["/api/prop-firms", slug],
    enabled: !!slug,
  });

  const { data: reviews = [] } = useQuery<any[]>({
    queryKey: ["/api/reviews", rawPropFirm?.id],
    enabled: !!rawPropFirm?.id,
  });

  const propFirm: Broker | null = rawPropFirm ?? null;
  const processedContent = propFirm?.content ? processBrokerContent(propFirm.content) : "";

  useEffect(() => {
    if (propFirm) {
      // Track page view in our own DB for dashboard analytics
      fetch("/api/views/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name: propFirm.name, type: "prop_firm" }),
        keepalive: true,
      }).catch(() => {});
      trackPageView(`/prop-firm/${slug}`, `${propFirm.name} Review | EntryLab`);
      trackReviewView({
        broker_name: propFirm.name,
        broker_type: 'prop_firm',
        rating: propFirm.rating,
        min_deposit: propFirm.minDeposit,
        regulation: propFirm.regulation,
      });
    }
  }, [propFirm, slug]);

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  useEffect(() => {
    document.body.style.setProperty("background", "#f8faf8", "important");
    document.documentElement.style.setProperty("background", "#f8faf8", "important");
    return () => {
      document.body.style.removeProperty("background");
      document.documentElement.style.removeProperty("background");
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}>
        <Navigation />
        <div className="flex-1 flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#2bb32a" }} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!propFirm) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}>
        <Navigation />
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#111827" }}>Prop Firm Not Found</h2>
            <Link href="/best-verified-propfirms">
              <Button data-testid="button-back-prop-firms">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Prop Firms
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // SEO with auto-generated defaults from DB data
  const seoTitle = `${stripHtml(propFirm.name)} Review 2025 | EntryLab`;
  const seoDescription = propFirm.tagline || 
                         `Comprehensive review of ${stripHtml(propFirm.name)}. Read about funding, profit splits, evaluation process, and more.`;

  // Breadcrumbs for structured data
  const breadcrumbs = [
    { name: "Home", url: "https://entrylab.io" },
    { name: "Prop Firms", url: "https://entrylab.io/prop-firms" },
    { name: stripHtml(propFirm.name), url: `https://entrylab.io/prop-firm/${propFirm.slug}` }
  ];

  // Parse headquarters to extract city and country (don't use full string as street address)
  const parseHeadquarters = (hq: string | undefined) => {
    if (!hq) return { locality: undefined, country: undefined };
    const parts = hq.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      // If last part is numeric (postal code), use second-to-last as country
      const lastPart = parts[parts.length - 1];
      const isPostalCode = /^\d+$/.test(lastPart);
      
      return {
        locality: parts[0],
        country: isPostalCode && parts.length >= 3 
          ? parts[parts.length - 2]  // Use second-to-last if last is postal code
          : parts[parts.length - 1]   // Otherwise use last part
      };
    }
    return { locality: hq, country: undefined };
  };

  const { locality, country } = parseHeadquarters(propFirm.headquarters);

  // Calculate actual user reviews (only use real user submissions)
  const userRatings = reviews?.map((r: any) => parseFloat(r.rating || 0)).filter((r: number) => r > 0) || [];
  const hasUserReviews = userRatings.length >= 3; // Minimum 3 reviews to show aggregate
  const avgUserRating = hasUserReviews 
    ? userRatings.reduce((sum: number, r: number) => sum + r, 0) / userRatings.length 
    : null;

  // Validate telephone (only include if it looks like a phone number, not email/URL)
  const isValidPhone = (contact: string | undefined) => {
    if (!contact) return false;
    // Check if it looks like a phone: contains digits, may have +, (, ), -, spaces
    return /^[\d\s\+\-\(\)]+$/.test(contact.trim());
  };

  // Create comprehensive FinancialService schema for prop firm entity
  const financialServiceData = {
    name: stripHtml(propFirm.name),
    description: seoDescription, // Use Yoast SEO description (already prioritized in seoDescription)
    url: propFirm.link, // Prop firm's official website (not affiliate link)
    addressLocality: locality,
    addressCountry: getCountryCode(country), // Convert to ISO code for Schema.org compliance
    ...(propFirm.support && isValidPhone(propFirm.support) && {
      telephone: propFirm.support
    }),
    priceRange: propFirm.minDeposit ? `From ${propFirm.minDeposit}` : undefined,
    foundingDate: propFirm.yearFounded,
    // Only show aggregate rating if we have real user reviews (minimum 3)
    ...(hasUserReviews && avgUserRating && {
      aggregateRating: {
        ratingValue: Number(avgUserRating.toFixed(1)),
        bestRating: 5,
        worstRating: 1,
        reviewCount: userRatings.length
      }
    }),
    // Note: sameAs should be official social profiles, not affiliate links
    // Omitting for now until we have official prop firm social media URLs
    sameAs: undefined
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}>
      <SEO
        title={seoTitle}
        description={seoDescription}
        url={`https://entrylab.io/prop-firm/${propFirm.slug}`}
        image={propFirm.logo}
        breadcrumbs={breadcrumbs}
        financialServiceData={financialServiceData}
        reviewData={{
          itemName: stripHtml(propFirm.name),
          itemType: "FinancialService",
          rating: {
            ratingValue: propFirm.rating,
            bestRating: 5,
            worstRating: 1
          },
          author: "EntryLab",
          datePublished: propFirm.lastUpdated ? new Date(propFirm.lastUpdated).toISOString() : new Date().toISOString()
        }}
        disableStructuredData={true}
      />
      <Navigation />

      {/* Hero "Command Center" - Two-Tier Layout */}
      <div className="relative overflow-visible" style={{ background: "#1a1e1c", borderBottom: "1px solid rgba(43,179,42,0.12)" }}>
        <div className="signals-bg-orb signals-bg-orb-1" />
        <div className="signals-bg-orb signals-bg-orb-2" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Top Meta Bar */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/prop-firms">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="button-back-prop-firms-top">
                <ArrowLeft className="mr-2 h-3 w-3" /> Back to Prop Firms
              </Button>
            </Link>
            <Badge className="bg-white/10 text-white border border-white/20" data-testid="badge-last-updated">
              <Calendar className="h-3 w-3 mr-1 text-emerald-500" />
              Updated {new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Badge>
          </div>

          {/* Main Content Grid - Two Columns */}
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 mb-8">
            {/* LEFT COLUMN: Brand Identity & Actions */}
            <div className="space-y-6">
              {/* Brand Identity Card */}
              <Card className="bg-background/60 backdrop-blur-sm border-border/50 overflow-visible">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {/* Logo */}
                    <img 
                      src={propFirm.logo} 
                      alt={stripHtml(propFirm.name)}
                      width="120"
                      height="60"
                      className="h-16 w-auto object-contain bg-white rounded-lg p-2 border border-border/30"
                      data-testid="img-prop-firm-logo"
                    />
                    
                    {/* Title + Rating */}
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-foreground mb-3" data-testid="text-prop-firm-name">
                        {stripHtml(propFirm.name)}
                      </h1>
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        {/* Rating Badge - No background */}
                        <div className="flex items-center gap-2" data-testid="text-prop-firm-rating">
                          <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                          <span className="text-2xl font-bold text-foreground">{propFirm.rating}</span>
                          <span className="text-muted-foreground text-sm">/5</span>
                        </div>
                        {/* Trust Signals */}
                        {propFirm.verified && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" data-testid="badge-verified">
                            <Shield className="h-3 w-3 mr-1" /> Verified
                          </Badge>
                        )}
                        {propFirm.featured && (
                          <Badge className="bg-primary/10 text-primary border-primary/20" data-testid="badge-featured">
                            <Award className="h-3 w-3 mr-1" /> Featured
                          </Badge>
                        )}
                      </div>
                      {/* USP / Tagline */}
                      {propFirm.tagline && (
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {stripHtml(propFirm.tagline)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Primary Actions Row */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Visit Firm CTA - Primary */}
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20"
                  onClick={() => {
                    trackAffiliateClick({
                      broker_name: propFirm.name,
                      broker_type: 'prop_firm',
                      page_location: 'prop_firm_review',
                      placement_type: 'hero_cta',
                      rating: propFirm.rating,
                    });
                    window.open(propFirm.link, '_blank');
                  }}
                  data-testid="button-visit-prop-firm"
                >
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Visit {stripHtml(propFirm.name).split(' ')[0]}
                </Button>

                {/* Write Review CTA - Secondary */}
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-primary/30 hover:bg-primary/10"
                  onClick={() => setIsReviewModalOpen(true)}
                  data-testid="button-write-review-hero"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Write a Review
                </Button>
              </div>

              {/* Discount Code - If Available */}
              {propFirm.bonusOffer && (
                <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-2 border-emerald-500/30 overflow-visible">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="absolute inset-0 bg-emerald-500/40 blur-md rounded-full" />
                          <Zap className="relative h-5 w-5 text-emerald-500" />
                        </div>
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Exclusive Discount</span>
                      </div>
                      {propFirm.discountAmount && (
                        <Badge className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold text-sm px-4 py-1.5 border-2 border-yellow-600/50" data-testid="badge-discount-amount">
                          🎉 {propFirm.discountAmount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="bg-background/95 rounded-lg px-4 py-3 border border-border/50">
                          <code className="text-xl font-bold text-foreground tracking-wider block text-center" data-testid="text-discount-code">
                            {propFirm.bonusOffer}
                          </code>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                          Copy and apply at checkout
                        </p>
                      </div>
                      <Button
                        size="lg"
                        className="bg-emerald-600 hover:bg-emerald-700 px-6"
                        onClick={() => copyDiscountCode(propFirm.bonusOffer!)}
                        data-testid="button-copy-discount"
                      >
                        {copiedCode ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Social Proof */}
              {reviews && reviews.length > 0 && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="font-medium">{reviews.length} user reviews</span>
                  </div>
                  {propFirm.verified && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium">Verified Firm</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Intel Snapshot */}
            <Card className="bg-background/60 backdrop-blur-sm border-border/50">
              <div className="p-6">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> At a Glance
                </h3>
                
                {/* Key Highlights */}
                {propFirm.highlights && propFirm.highlights.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {propFirm.highlights.slice(0, 5).map((highlight, index) => (
                      <div key={index} className="flex items-start gap-2" data-testid={`hero-highlight-${index}`}>
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{highlight}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                  {propFirm.platforms && Array.isArray(propFirm.platforms) && propFirm.platforms.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/30" data-testid="intel-platforms">
                      <div className="text-xs text-muted-foreground mb-1">Platforms</div>
                      <div className="font-semibold text-sm text-foreground">
                        {(propFirm.platforms as string[]).slice(0, 2).join(', ')}
                        {(propFirm.platforms as string[]).length > 2 && ` +${(propFirm.platforms as string[]).length - 2}`}
                      </div>
                    </div>
                  )}
                  {propFirm.platforms && typeof propFirm.platforms === 'string' && (
                    <div className="p-3 rounded-lg bg-muted/30" data-testid="intel-platforms">
                      <div className="text-xs text-muted-foreground mb-1">Platforms</div>
                      <div className="font-semibold text-sm text-foreground">
                        {propFirm.platforms}
                      </div>
                    </div>
                  )}
                  {propFirm.paymentMethods && Array.isArray(propFirm.paymentMethods) && propFirm.paymentMethods.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/30" data-testid="intel-payout">
                      <div className="text-xs text-muted-foreground mb-1">Payout Methods</div>
                      <div className="font-semibold text-sm text-foreground">
                        {(propFirm.paymentMethods as string[]).slice(0, 2).join(', ')}
                        {(propFirm.paymentMethods as string[]).length > 2 && ` +${(propFirm.paymentMethods as string[]).length - 2}`}
                      </div>
                    </div>
                  )}
                  {propFirm.support && (
                    <div className="p-3 rounded-lg bg-muted/30" data-testid="intel-support">
                      <div className="text-xs text-muted-foreground mb-1">Support</div>
                      <div className="font-semibold text-sm text-foreground break-all">{propFirm.support}</div>
                    </div>
                  )}
                  {propFirm.headquarters && (
                    <div className="p-3 rounded-lg bg-muted/30" data-testid="intel-headquarters">
                      <div className="text-xs text-muted-foreground mb-1">Headquarters</div>
                      <div className="font-semibold text-sm text-foreground break-words">{propFirm.headquarters}</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Stats Bar */}
          {(propFirm.minDeposit || propFirm.maxLeverage || propFirm.spreadFrom || propFirm.regulation) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {propFirm.minDeposit && (
                <Card className="bg-background/40 backdrop-blur-sm border-border/50" data-testid="stat-min-deposit">
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mx-auto mb-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-bold text-foreground text-lg">{propFirm.minDeposit}</div>
                    <div className="text-xs text-muted-foreground">Starting Capital</div>
                  </div>
                </Card>
              )}
              {propFirm.spreadFrom && (
                <Card className="bg-background/40 backdrop-blur-sm border-border/50" data-testid="stat-profit-split">
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 mx-auto mb-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="font-bold text-foreground text-lg">{propFirm.spreadFrom}</div>
                    <div className="text-xs text-muted-foreground">Profit Split</div>
                  </div>
                </Card>
              )}
              {propFirm.maxLeverage && (
                <Card className="bg-background/40 backdrop-blur-sm border-border/50" data-testid="stat-max-leverage">
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 mx-auto mb-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="font-bold text-foreground text-lg">{propFirm.maxLeverage}</div>
                    <div className="text-xs text-muted-foreground">Max Leverage</div>
                  </div>
                </Card>
              )}
              {propFirm.regulation && (
                <Card className="bg-background/40 backdrop-blur-sm border-border/50" data-testid="stat-regulation">
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 mx-auto mb-2">
                      <Shield className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="font-bold text-foreground text-sm">{propFirm.regulation.split(',')[0].trim()}</div>
                    <div className="text-xs text-muted-foreground">Regulated</div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 py-12" style={{ background: "#f5f7f6" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-8">
            {/* Main Content Column */}
            <div className="space-y-8 content-light min-w-0">
              {/* Pros & Cons - Use new card component */}
              {(propFirm.pros.length > 0 || propFirm.cons && propFirm.cons.length > 0) && (
                <ProsConsCard 
                  pros={propFirm.pros}
                  cons={propFirm.cons || []}
                />
              )}

              {/* Prop Firm Details Grid */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Prop Firm Details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {propFirm.regulation && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-regulation">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-emerald-500" />
                        <span className="font-semibold">Regulation</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{propFirm.regulation}</p>
                    </div>
                  )}
                  {propFirm.minDeposit && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-min-deposit">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Starting Capital</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{propFirm.minDeposit}</p>
                    </div>
                  )}
                  {propFirm.platforms && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-platforms">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Platforms</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{propFirm.platforms}</p>
                    </div>
                  )}
                  {propFirm.accountTypes && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-account-types">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Challenge Types</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{propFirm.accountTypes}</p>
                    </div>
                  )}
                  {propFirm.maxLeverage && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-max-leverage">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-amber-500" />
                        <span className="font-semibold">Max Leverage</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{propFirm.maxLeverage}</p>
                    </div>
                  )}
                  {propFirm.paymentMethods && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-payment">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Payment Methods</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{propFirm.paymentMethods}</p>
                    </div>
                  )}
                  {propFirm.withdrawalTime && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-withdrawal">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Payout Methods</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{propFirm.withdrawalTime}</p>
                    </div>
                  )}
                  {propFirm.yearFounded && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-founded">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Year Founded</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{propFirm.yearFounded}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Review Summary - WYSIWYG Content from ACF */}
              {processedContent && (
                <Card className="p-8">
                  <div 
                    className="prose prose-lg max-w-none
                    prose-headings:font-bold prose-headings:text-foreground
                    prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-3 prose-h2:scroll-mt-24
                    prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                    prose-h4:text-lg prose-h4:mt-4 prose-h4:mb-2
                    prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                    prose-ul:my-4 prose-li:text-muted-foreground
                    prose-strong:text-foreground prose-strong:font-semibold"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                    data-testid="content-review-summary"
                  />
                </Card>
              )}

              {/* Bottom CTA */}
              <Card className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-3">Ready to Get Funded?</h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of funded traders with {stripHtml(propFirm.name)}
                </p>
                <Button size="lg" asChild data-testid="button-visit-prop-firm-bottom" onClick={() => trackAffiliateClick({
                  broker_name: propFirm.name,
                  broker_type: 'prop_firm',
                  page_location: 'prop_firm_review',
                  placement_type: 'bottom_cta',
                  rating: propFirm.rating,
                  affiliate_link: propFirm.link
                })}>
                  <a href={propFirm.link} target="_blank" rel="noopener noreferrer" className="btn-white-link">
                    Visit {stripHtml(propFirm.name)} <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </Card>
            </div>

            {/* Sticky Conversion Sidebar */}
            <div className="space-y-6 content-light min-w-0">
              {/* Primary CTA Card */}
              <Card className="p-6 sticky top-24">
                <Button 
                  size="lg" 
                  asChild 
                  className="w-full mb-4" 
                  data-testid="button-visit-sidebar" 
                  onClick={() => trackAffiliateClick({
                    broker_name: propFirm.name,
                    broker_type: 'prop_firm',
                    page_location: 'prop_firm_review',
                    placement_type: 'quick_stats_cta',
                    rating: propFirm.rating,
                    affiliate_link: propFirm.link
                  })}
                >
                  <a href={propFirm.link} target="_blank" rel="noopener noreferrer" className="btn-white-link">
                    Visit {stripHtml(propFirm.name)} <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full mb-6" 
                  data-testid="button-write-review-sidebar"
                  onClick={() => setIsReviewModalOpen(true)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Write a Review
                </Button>

                {/* Table of Contents */}
                {propFirm.content && (
                  <>
                    <div className="mb-4">
                      <TableOfContents content={propFirm.content} />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 mb-6">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-medium text-gray-500">
                        Updated {new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* User Reviews Section */}
      <section className="py-16" style={{ background: "#ffffff", borderTop: "1px solid #e8edea", borderBottom: "1px solid #e8edea" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "#111827" }} data-testid="text-reviews-title">
                {stripHtml(propFirm.name)} Reviews
              </h2>
              <p style={{ color: "#6b7280" }}>
                Read what funded traders say about {stripHtml(propFirm.name)}
              </p>
            </div>
            <Button 
              onClick={() => setIsReviewModalOpen(true)}
              style={{ background: "#2bb32a", color: "#fff" }}
              data-testid="button-write-review-section"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Write a Review
            </Button>
          </div>

          {reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review: any) => {
                const reviewerName = review.reviewerName || 'Anonymous';
                const initials = reviewerName
                  .split(' ')
                  .map((word: string) => word[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                
                return (
                  <Card key={review.id} className="p-6 flex flex-col" data-testid={`review-${review.id}`}>
                    <div className="flex items-start gap-3 mb-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "#2bb32a" }}
                        data-testid={`review-avatar-${review.id}`}
                      >
                        <span className="font-semibold text-base" style={{ color: "#fff" }}>
                          {initials}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate" data-testid={`review-title-${review.id}`}>
                          {review.title}
                        </h3>
                        <p className="text-xs text-muted-foreground" data-testid={`review-author-${review.id}`}>
                          {reviewerName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < (review.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} 
                        />
                      ))}
                      <span className="text-sm font-semibold ml-1" data-testid={`review-rating-${review.id}`}>
                        {review.rating}/5
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 flex-1" data-testid={`review-text-${review.id}`}>
                      {review.reviewText}
                    </p>
                    
                    <p className="text-xs text-muted-foreground/60 mt-3">
                      {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 rounded-lg" style={{ background: "#f6f9f6", border: "1px dashed #d1d5db" }}>
              <MessageSquare className="h-12 w-12 mx-auto mb-4" style={{ color: "#9ca3af" }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#111827" }}>No reviews yet</h3>
              <p className="mb-6" style={{ color: "#6b7280" }}>
                Be the first to share your experience with {stripHtml(propFirm.name)}
              </p>
              <Button 
                onClick={() => setIsReviewModalOpen(true)}
                style={{ background: "#2bb32a", color: "#fff" }}
                data-testid="button-first-review"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Write the First Review
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden py-16" style={{ background: "#1a1e1c" }}>
        <div className="signals-bg-orb signals-bg-orb-1" />
        <div className="signals-bg-orb signals-bg-orb-2" />
        <div className="signals-bg-orb signals-bg-orb-3" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-final-cta-headline">
              Ready to Get Funded with {stripHtml(propFirm.name)}?
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Join thousands of traders who have been funded through {stripHtml(propFirm.name)}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="flex flex-col items-center gap-2" data-testid="cta-benefit-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white">Trusted Platform</h3>
              <p className="text-sm text-white/60">Industry-leading prop firm</p>
            </div>
            <div className="flex flex-col items-center gap-2" data-testid="cta-benefit-2">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-white">High Profit Split</h3>
              <p className="text-sm text-white/60">Keep more of your profits</p>
            </div>
            <div className="flex flex-col items-center gap-2" data-testid="cta-benefit-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white">Quick Evaluation</h3>
              <p className="text-sm text-white/60">Get funded fast</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Button size="lg" asChild className="min-w-[200px]" data-testid="button-final-cta" onClick={() => trackAffiliateClick({
              broker_name: propFirm.name,
              broker_type: 'prop_firm',
              page_location: 'prop_firm_review',
              placement_type: 'bottom_cta',
              rating: propFirm.rating,
              affiliate_link: propFirm.link
            })}>
              <a href={propFirm.link} target="_blank" rel="noopener noreferrer">
                Start Evaluation Now <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Link href="/compare/prop-firm">
              <Button variant="outline" size="lg" className="min-w-[200px] border-white/30 text-white" data-testid="button-compare-prop-firms">
                <GitCompare className="w-4 h-4 mr-2" /> Compare Prop Firms
              </Button>
            </Link>
          </div>

          <p className="text-xs text-white/40">
            Risk Warning: Trading involves risk. Ensure you understand the evaluation process and trading rules before participating.
          </p>
        </div>
      </section>

      <RelatedComparisons slug={slug!} entityType="prop_firm" entityName={propFirm.name} />

      <Footer />
      
      {propFirm ? (
        <>
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            brokerName={stripHtml(propFirm.name)}
            brokerLogo={propFirm.logo}
            brokerId={propFirm.id}
            itemType="prop-firm"
          />
          <BrokerAlertPopup
            brokerId={propFirm.id}
            brokerName={stripHtml(propFirm.name)}
            brokerLogo={propFirm.logo}
            brokerType="prop-firm"
          />
        </>
      ) : null}
    </div>
  );
}
