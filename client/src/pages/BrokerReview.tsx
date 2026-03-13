import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, lazy, Suspense } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Star, Shield, DollarSign, TrendingUp, Award, Globe, Headphones, CreditCard, ArrowLeft, ExternalLink, Check, X, ChevronRight, Zap, ArrowRight, Gauge, Activity, Info, ArrowUp, ArrowDownToLine, MessageSquare, Monitor, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { processBrokerContent } from "@/lib/transforms";
import type { Broker } from "@shared/schema";
import { trackPageView, trackReviewView, trackAffiliateClick } from "@/lib/gtm";
import { getCountryCode } from "@/lib/countryCodeMap";

// Lazy load modals and popups for better performance
const ReviewModal = lazy(() => import("@/components/ReviewModalSimple").then(m => ({ default: m.ReviewModalSimple })));
const BrokerAlertPopup = lazy(() => import("@/components/BrokerAlertPopup").then(m => ({ default: m.BrokerAlertPopup })));
import { TableOfContents } from "@/components/TableOfContents";

export default function BrokerReview() {
  const params = useParams();
  const slug = params.slug;
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { data: rawBroker, isLoading } = useQuery<any>({
    queryKey: ["/api/brokers", slug],
    enabled: !!slug,
  });

  const { data: reviews = [] } = useQuery<any[]>({
    queryKey: ["/api/reviews", rawBroker?.id],
    enabled: !!rawBroker?.id,
  });

  const broker: Broker | null = rawBroker ?? null;
  const processedContent = broker?.content ? processBrokerContent(broker.content) : "";

  useEffect(() => {
    if (broker) {
      trackPageView(`/broker/${slug}`, `${broker.name} Review | EntryLab`);
      trackReviewView({
        broker_name: broker.name,
        broker_type: 'broker',
        rating: broker.rating,
        min_deposit: broker.minDeposit,
        regulation: broker.regulation,
      });
      // Track page view in our own DB for dashboard analytics
      fetch("/api/views/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name: broker.name, type: "broker" }),
        keepalive: true,
      }).catch(() => {});
    }
  }, [broker, slug]);

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

  if (!broker) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}>
        <Navigation />
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#111827" }}>Broker Not Found</h2>
            <Link href="/top-cfd-brokers">
              <Button data-testid="button-back-brokers">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Brokers
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // SEO with fallbacks: auto-generated defaults from DB data
  const seoTitle = `${stripHtml(broker.name)} Review 2025 | EntryLab`;
  const seoDescription = broker.tagline || 
                         `Comprehensive review of ${stripHtml(broker.name)}. Read about spreads, regulation, platforms, and more.`;

  // Breadcrumbs for structured data
  const breadcrumbs = [
    { name: "Home", url: "https://entrylab.io" },
    { name: "Brokers", url: "https://entrylab.io/brokers" },
    { name: stripHtml(broker.name), url: `https://entrylab.io/broker/${broker.slug}` }
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

  const { locality, country } = parseHeadquarters(broker.headquarters);

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

  // Create comprehensive FinancialService schema for broker entity
  const financialServiceData = {
    name: stripHtml(broker.name),
    description: seoDescription, // Use Yoast SEO description (already prioritized in seoDescription)
    url: broker.link, // Broker's official website (not affiliate link)
    addressLocality: locality,
    addressCountry: getCountryCode(country), // Convert to ISO code for Schema.org compliance
    ...(broker.support && isValidPhone(broker.support) && {
      telephone: broker.support
    }),
    priceRange: broker.minDeposit ? `From ${broker.minDeposit}` : undefined,
    foundingDate: broker.yearFounded,
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
    // Omitting for now until we have official broker social media URLs
    sameAs: undefined
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}>
      <SEO
        title={seoTitle}
        description={seoDescription}
        url={`https://entrylab.io/broker/${broker.slug}`}
        image={broker.logo}
        breadcrumbs={breadcrumbs}
        financialServiceData={financialServiceData}
        reviewData={{
          itemName: stripHtml(broker.name),
          itemType: "FinancialService",
          rating: {
            ratingValue: broker.rating,
            bestRating: 5,
            worstRating: 1
          },
          author: "EntryLab",
          datePublished: broker.lastUpdated ? new Date(broker.lastUpdated).toISOString() : new Date().toISOString()
        }}
        disableStructuredData={true}
      />
      <Navigation />

      {/* Hero Section */}
      <div style={{ background: "#1a1e1c", borderBottom: "1px solid rgba(43,179,42,0.12)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <Link href="/brokers">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-brokers-top">
              <ArrowLeft className="mr-2 h-3 w-3" /> Back to Brokers
            </Button>
          </Link>

          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={broker.logo} 
                  alt={stripHtml(broker.name)}
                  width="120"
                  height="64"
                  className="h-16 w-auto object-contain bg-white rounded-lg p-2"
                  data-testid="img-broker-logo"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2" data-testid="text-broker-name">
                    {stripHtml(broker.name)} Review
                  </h1>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1" data-testid="text-broker-rating">
                      <Star className="h-5 w-5 fill-emerald-500 text-emerald-500" />
                      <span className="text-lg font-semibold">{broker.rating}</span>
                      <span className="text-muted-foreground text-sm">/5</span>
                    </div>
                    {broker.verified && (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20" data-testid="badge-verified">
                        <Shield className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                    {broker.featured && (
                      <Badge className="bg-primary/10 text-primary border-primary/20" data-testid="badge-featured">
                        <Award className="h-3 w-3 mr-1" /> Featured
                      </Badge>
                    )}
                    <Badge className="bg-white/10 text-white border border-white/20" data-testid="badge-last-updated">
                      <Calendar className="h-3 w-3 mr-1 text-emerald-500" />
                      Updated {new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Badge>
                  </div>
                </div>
              </div>

              {broker.tagline && (
                <p className="text-lg text-muted-foreground mb-6" data-testid="text-broker-tagline">
                  {broker.tagline}
                </p>
              )}

              {/* At a Glance Highlights */}
              {(broker.highlights && broker.highlights.length > 0) && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" /> At a Glance
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {broker.highlights.slice(0, 4).map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`hero-highlight-${index}`}>
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {broker.bestFor && (
                <div className="mb-6">
                  <span className="text-sm font-medium text-muted-foreground">Best For: </span>
                  <span className="text-sm text-foreground" data-testid="text-best-for">{broker.bestFor}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 w-full lg:w-72">
              <Button size="lg" asChild className="w-full" data-testid="button-visit-broker" onClick={() => trackAffiliateClick({
                broker_name: broker.name,
                broker_type: 'broker',
                page_location: 'broker_review',
                placement_type: 'hero_cta',
                rating: broker.rating,
                affiliate_link: broker.link
              })}>
                <a href={broker.link} target="_blank" rel="noopener noreferrer">
                  Visit {stripHtml(broker.name)} <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full" 
                data-testid="button-write-review"
                onClick={() => setIsReviewModalOpen(true)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Write a Review
              </Button>
              {broker.bonusOffer && (
                <div className="relative">
                  <ArrowUp className="h-4 w-4 text-blue-500 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Badge className="w-full text-center justify-center py-2.5 bg-blue-500/10 text-blue-500 border-blue-500/20 cursor-help text-base" data-testid="badge-bonus">
                            🎁 {broker.bonusOffer} <Info className="h-3.5 w-3.5 ml-1 inline" />
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-center">
                        <p className="text-xs">Get "{broker.bonusOffer}" if you sign up with the button above</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e8edea" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center" data-testid="stat-regulation">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg mx-auto mb-2" style={{ background: "rgba(43,179,42,0.08)" }}>
                <Shield className="h-6 w-6" style={{ color: "#186818" }} />
              </div>
              <div className="font-bold truncate px-2" style={{ color: "#111827" }}>
                {broker.regulation && broker.regulation.trim() && broker.regulation.toLowerCase() !== 'none' && broker.regulation.toLowerCase() !== 'no regulation' && broker.regulation.toLowerCase() !== 'unregulated'
                  ? broker.regulation.split(',')[0]
                  : 'No Regulation'}
              </div>
              <div className="text-xs" style={{ color: "#6b7280" }}>Regulation</div>
            </div>

            <div className="text-center" data-testid="stat-min-deposit">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg mx-auto mb-2" style={{ background: "rgba(43,179,42,0.08)" }}>
                <DollarSign className="h-6 w-6" style={{ color: "#186818" }} />
              </div>
              <div className="font-bold" style={{ color: "#111827" }}>{broker.minDeposit || 'N/A'}</div>
              <div className="text-xs" style={{ color: "#6b7280" }}>Min Deposit</div>
            </div>

            <div className="text-center" data-testid="stat-min-withdrawal">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg mx-auto mb-2" style={{ background: "rgba(59,130,246,0.08)" }}>
                <ArrowDownToLine className="h-6 w-6 text-blue-500" />
              </div>
              <div className="font-bold" style={{ color: "#111827" }}>{broker.minWithdrawal || 'N/A'}</div>
              <div className="text-xs" style={{ color: "#6b7280" }}>Min Withdrawal</div>
            </div>

            <div className="text-center" data-testid="stat-platforms">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg mx-auto mb-2" style={{ background: "rgba(168,85,247,0.08)" }}>
                <Monitor className="h-6 w-6 text-purple-500" />
              </div>
              <div className="font-bold truncate px-2" style={{ color: "#111827" }}>
                {broker.platforms ? (broker.platforms.split(',')[0] + (broker.platforms.includes(',') ? '+' : '')) : 'N/A'}
              </div>
              <div className="text-xs" style={{ color: "#6b7280" }}>Trading Platforms</div>
            </div>

            <div className="text-center" data-testid="stat-max-leverage">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg mx-auto mb-2" style={{ background: "rgba(245,158,11,0.08)" }}>
                <Zap className="h-6 w-6 text-amber-500" />
              </div>
              <div className="font-bold" style={{ color: "#111827" }}>{broker.maxLeverage || 'N/A'}</div>
              <div className="text-xs" style={{ color: "#6b7280" }}>Max Leverage</div>
            </div>

            <div className="text-center" data-testid="stat-payment">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg mx-auto mb-2" style={{ background: "rgba(43,179,42,0.08)" }}>
                <CreditCard className="h-6 w-6" style={{ color: "#186818" }} />
              </div>
              <div className="font-bold truncate px-2" style={{ color: "#111827" }}>
                {broker.paymentMethods ? (broker.paymentMethods.split(',')[0] + (broker.paymentMethods.includes(',') ? '+' : '')) : 'N/A'}
              </div>
              <div className="text-xs" style={{ color: "#6b7280" }}>Deposit Methods</div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-12 md:py-16" style={{ background: "#f5f7f6" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_350px] gap-8">
            <div className="space-y-8 content-light min-w-0">
              {/* Pros & Cons - Market Chart Inspired */}
              {(broker.pros.length > 0 || broker.cons && broker.cons.length > 0) && (
                <Card className="relative overflow-hidden p-6">
                  <h2 className="text-2xl font-bold mb-6">Pros & Cons</h2>
                  
                  {/* Chart-line background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                      <path d="M0,50 Q250,30 500,50 T1000,50" stroke="currentColor" fill="none" strokeWidth="1" className="text-primary"/>
                      <path d="M0,80 Q250,60 500,80 T1000,80" stroke="currentColor" fill="none" strokeWidth="1" className="text-primary"/>
                    </svg>
                  </div>

                  {/* Broker Analysis Indicator */}
                  <div className="relative mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold text-muted-foreground">Broker Analysis</span>
                      </div>
                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="text-emerald-500">{broker.pros.length} Pros</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-destructive">{broker.cons?.length || 0} Cons</span>
                        </div>
                      </div>
                      <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all"
                          style={{ width: `${(broker.pros.length / (broker.pros.length + (broker.cons?.length || 0))) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Condensed Pros & Cons */}
                    <div className="relative space-y-6">
                      {/* Pros Pills */}
                      {broker.pros.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Check className="h-4 w-4 text-emerald-500" />
                            <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wide">Strengths</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {broker.pros.map((pro, index) => (
                              <Badge 
                                key={index}
                                className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                data-testid={`text-pro-${index}`}
                              >
                                <Check className="h-3 w-3 mr-1.5" />
                                {pro}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cons Pills */}
                      {broker.cons && broker.cons.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <X className="h-4 w-4 text-destructive" />
                            <h3 className="text-sm font-bold text-destructive uppercase tracking-wide">Limitations</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {broker.cons.map((con, index) => (
                              <Badge 
                                key={index}
                                className="bg-destructive/10 text-destructive border-destructive/20"
                                data-testid={`text-con-${index}`}
                              >
                                <X className="h-3 w-3 mr-1.5" />
                                {con}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
              )}

              {/* Broker Details Grid */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Broker Details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {broker.regulation && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-regulation">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-emerald-500" />
                        <span className="font-semibold">Regulation</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{broker.regulation}</p>
                    </div>
                  )}
                  {broker.minDeposit && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-min-deposit">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Minimum Deposit</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{broker.minDeposit}</p>
                    </div>
                  )}
                  {broker.minWithdrawal && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-min-withdrawal">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Minimum Withdrawal</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{broker.minWithdrawal}</p>
                    </div>
                  )}
                  {broker.platforms && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-platforms">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Trading Platforms</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{broker.platforms}</p>
                    </div>
                  )}
                  {broker.accountTypes && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-account-types">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Account Types</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{broker.accountTypes}</p>
                    </div>
                  )}
                  {broker.maxLeverage && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-max-leverage">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-amber-500" />
                        <span className="font-semibold">Max Leverage</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{broker.maxLeverage}</p>
                    </div>
                  )}
                  {broker.paymentMethods && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-payment">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Deposit Methods</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{broker.paymentMethods}</p>
                    </div>
                  )}
                  {broker.withdrawalTime && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-withdrawal">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Withdrawal Time</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{broker.withdrawalTime}</p>
                    </div>
                  )}
                  {broker.yearFounded && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-founded">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Year Founded</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{broker.yearFounded}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Full Review Content */}
              {broker.content && (
                <Card className="p-6">
                  <div 
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                    data-testid="content-review"
                  />
                </Card>
              )}

              {/* Bottom CTA */}
              <Card className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-3">Ready to Start Trading?</h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of traders who trust {stripHtml(broker.name)}
                </p>
                <Button size="lg" asChild data-testid="button-visit-broker-bottom" onClick={() => trackAffiliateClick({
                  broker_name: broker.name,
                  broker_type: 'broker',
                  page_location: 'broker_review',
                  placement_type: 'bottom_cta',
                  rating: broker.rating,
                  affiliate_link: broker.link
                })}>
                  <a href={broker.link} target="_blank" rel="noopener noreferrer" className="btn-white-link">
                    Visit {stripHtml(broker.name)} <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 content-light min-w-0">
              {/* Combined Card: Quick Info + Visit Button + TOC + Update Badge */}
              <Card className="p-6 sticky top-24">
                {/* Quick Info Section */}
                <h3 className="font-bold mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm mb-6">
                  {broker.headquarters && (
                    <div className="flex justify-between gap-3" data-testid="info-headquarters">
                      <span className="text-muted-foreground flex-shrink-0">Headquarters:</span>
                      <span className="font-medium text-right break-words">{broker.headquarters}</span>
                    </div>
                  )}
                  {broker.support && (
                    <div className="flex justify-between" data-testid="info-support">
                      <span className="text-muted-foreground">Support:</span>
                      <span className="font-medium break-all">{broker.support}</span>
                    </div>
                  )}
                  {broker.totalUsers && (
                    <div className="flex justify-between" data-testid="info-popularity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground flex items-center gap-1 cursor-help">
                              Popularity: <Info className="h-3 w-3 text-blue-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-center">
                            <p className="text-xs">We base this on website traffic according to SimilarWeb tool, social media engagement and affiliates promoting them</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="font-medium">{broker.totalUsers}</span>
                    </div>
                  )}
                </div>

                {broker.awards && broker.awards.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-border/50">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-500" /> Awards
                    </h4>
                    <ul className="space-y-2">
                      {broker.awards.map((award, index) => (
                        <li key={index} className="text-sm text-muted-foreground" data-testid={`award-${index}`}>
                          • {award}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Visit Broker Button */}
                <Button className="w-full mb-6" asChild data-testid="button-visit-sidebar" onClick={() => trackAffiliateClick({
                  broker_name: broker.name,
                  broker_type: 'broker',
                  page_location: 'broker_review',
                  placement_type: 'quick_stats_cta',
                  rating: broker.rating,
                  affiliate_link: broker.link
                })}>
                  <a href={broker.link} target="_blank" rel="noopener noreferrer" className="btn-white-link">
                    Visit Broker <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>

                {/* Table of Contents */}
                {broker.content && (
                  <>
                    <div className="mb-4">
                      <TableOfContents content={broker.content} />
                    </div>
                    
                    {/* Update Badge */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
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
                {stripHtml(broker.name)} Reviews
              </h2>
              <p style={{ color: "#6b7280" }}>
                Read what traders say about {stripHtml(broker.name)}
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
                Be the first to share your experience with {stripHtml(broker.name)}
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
              Ready to Start Trading with {stripHtml(broker.name)}?
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Join thousands of traders who trust {stripHtml(broker.name)} for their forex trading needs
            </p>
          </div>

          {/* Show different content for regulated vs unregulated brokers */}
          {broker.regulation && broker.regulation.trim() && broker.regulation.toLowerCase() !== 'none' && broker.regulation.toLowerCase() !== 'no regulation' && broker.regulation.toLowerCase() !== 'unregulated' ? (
            // REGULATED BROKER: Show benefits
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="flex flex-col items-center gap-2" data-testid="cta-benefit-1">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white">Regulated & Safe</h3>
                <p className="text-sm text-white/60">Your funds are protected</p>
              </div>
              <div className="flex flex-col items-center gap-2" data-testid="cta-benefit-2">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-white">Competitive Spreads</h3>
                <p className="text-sm text-white/60">Trade with low costs</p>
              </div>
              <div className="flex flex-col items-center gap-2" data-testid="cta-benefit-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-white">Fast Execution</h3>
                <p className="text-sm text-white/60">No slippage, instant trades</p>
              </div>
            </div>
          ) : (
            // UNREGULATED BROKER: Show actual stats with circular icons
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="flex flex-col items-center gap-2" data-testid="cta-stat-min-deposit">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-white">{broker.minDeposit || 'N/A'}</h3>
                <p className="text-sm text-white/60">Min Deposit</p>
              </div>
              <div className="flex flex-col items-center gap-2" data-testid="cta-stat-max-leverage">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Zap className="h-7 w-7 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white">{broker.maxLeverage || 'N/A'}</h3>
                <p className="text-sm text-white/60">Max Leverage</p>
              </div>
              <div className="flex flex-col items-center gap-2" data-testid="cta-stat-deposit-methods">
                <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <CreditCard className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white truncate px-2 max-w-full">
                  {broker.paymentMethods ? broker.paymentMethods.split(',')[0] + (broker.paymentMethods.includes(',') ? '+' : '') : 'N/A'}
                </h3>
                <p className="text-sm text-white/60">Deposit Methods</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Button size="lg" asChild className="min-w-[200px]" data-testid="button-final-cta">
              <a href={broker.link} target="_blank" rel="noopener noreferrer" className="btn-white-link">
                Open Account Now <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Link href="/brokers">
              <Button variant="outline" size="lg" className="min-w-[200px] border-white/30 text-white" data-testid="button-compare-brokers">
                Compare Other Brokers
              </Button>
            </Link>
          </div>

          <p className="text-xs text-white/40">
            Risk Warning: CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. 
            You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money.
          </p>
        </div>
      </section>

      <Footer />
      
      {broker ? (
        <>
          <Suspense fallback={null}>
            <ReviewModal
              isOpen={isReviewModalOpen}
              onClose={() => {
                console.log("Closing review modal");
                setIsReviewModalOpen(false);
              }}
              brokerName={stripHtml(broker.name)}
              brokerLogo={broker.logo}
              brokerId={broker.id}
              itemType="broker"
            />
          </Suspense>
          <Suspense fallback={null}>
            <BrokerAlertPopup
              brokerId={broker.id}
              brokerName={stripHtml(broker.name)}
              brokerLogo={broker.logo}
              brokerType="broker"
            />
          </Suspense>
        </>
      ) : null}
    </div>
  );
}
