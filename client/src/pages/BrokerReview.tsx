import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Star, Shield, DollarSign, TrendingUp, Award, Globe, Headphones, CreditCard, ArrowLeft, ExternalLink, Check, X, ChevronRight, Zap, ArrowRight, Gauge, Activity, Info, ArrowUp, ArrowDownToLine, MessageSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Broker } from "@shared/schema";
import { trackPageView, trackReviewView, trackAffiliateClick } from "@/lib/gtm";
import { ReviewModalSimple as ReviewModal } from "@/components/ReviewModalSimple";

export default function BrokerReview() {
  const params = useParams();
  const slug = params.slug;
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { data: wpBroker, isLoading } = useQuery<any>({
    queryKey: ["/api/wordpress/broker", slug],
    enabled: !!slug,
  });

  const { data: reviews = [] } = useQuery<any[]>({
    queryKey: ["/api/wordpress/reviews", wpBroker?.id],
    enabled: !!wpBroker?.id,
  });

  const transformBroker = (wpBroker: any): Broker | null => {
    const acf = wpBroker.acf || {};
    const logo = acf.broker_logo?.url || wpBroker._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    const name = wpBroker.title?.rendered;
    if (!name) return null;

    const isFeatured = acf.is_featured === true || acf.is_featured === "1";
    
    // broker_usp = Features Array (used for highlights)
    const brokerUsp = acf.broker_usp 
      ? acf.broker_usp.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f)
      : [];
    
    // why_choose = Why Choose section
    const whyChoose = acf.why_choose 
      ? acf.why_choose.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f)
      : [];
    
    // pros = Pros text field
    const prosList = acf.pros 
      ? acf.pros.split(/[,\n]+/).map((p: string) => p.trim()).filter((p: string) => p)
      : whyChoose;
    
    // cons = Cons text field
    const consList = acf.cons 
      ? acf.cons.split(/[,\n]+/).map((c: string) => c.trim()).filter((c: string) => c)
      : [];

    // Format modified date
    const modifiedDate = wpBroker.modified ? new Date(wpBroker.modified) : null;

    return {
      id: wpBroker.id.toString(),
      slug: wpBroker.slug,
      name: name,
      logo: logo || "https://placehold.co/200x80/1a1a1a/8b5cf6?text=" + encodeURIComponent(name),
      rating: parseFloat(acf.rating) || 4.5,
      verified: true,
      featured: isFeatured,
      tagline: acf.broker_intro || "",
      bonusOffer: acf.bonus_offer || "",
      link: acf.affiliate_link || wpBroker.link || "#",
      pros: prosList,
      highlights: brokerUsp, // "At a Glance" section
      features: brokerUsp.map((f: string) => ({ icon: "trending", text: f })),
      featuredHighlights: brokerUsp,
      content: acf.review_summary || "", // WYSIWYG review content
      minDeposit: acf.min_deposit,
      minWithdrawal: acf.minimum_withdrawal,
      maxLeverage: acf.max_leverage,
      spreadFrom: acf.spread_from,
      regulation: acf.regulation,
      cons: consList,
      platforms: acf.trading_platforms, // Updated field name
      paymentMethods: acf.deposit_methods, // Updated field name
      headquarters: acf.headquarters, // New field
      support: acf.support, // Support information field
      totalUsers: acf.popularity, // New field (popularity -> totalUsers for display)
      lastUpdated: modifiedDate, // WordPress modified date
      seoTitle: acf.seo_title, // Custom SEO title (optional)
      seoDescription: acf.seo_description, // Custom SEO description (optional)
    };
  };

  const broker = wpBroker ? transformBroker(wpBroker) : null;

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
    }
  }, [broker, slug]);

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
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

  if (!broker) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Broker Not Found</h2>
            <Link href="/brokers">
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

  // SEO with fallbacks: Custom ACF fields OR auto-generated defaults
  const seoTitle = broker.seoTitle || `${stripHtml(broker.name)} Review 2025 | EntryLab`;
  const seoDescription = broker.seoDescription || broker.tagline || `Comprehensive review of ${stripHtml(broker.name)}. Read about spreads, regulation, platforms, and more.`;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={seoTitle}
        description={seoDescription}
        url={`https://entrylab.io/broker/${broker.slug}`}
      />
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
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
                    {broker.lastUpdated && (
                      <span className="text-xs text-muted-foreground" data-testid="text-last-updated">
                        Updated {broker.lastUpdated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
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
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {broker.minDeposit && (
              <div className="text-center" data-testid="stat-min-deposit">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mx-auto mb-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div className="font-bold text-foreground">{broker.minDeposit}</div>
                <div className="text-xs text-muted-foreground">Min Deposit</div>
              </div>
            )}
            {broker.maxLeverage && (
              <div className="text-center" data-testid="stat-max-leverage">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-500/10 mx-auto mb-2">
                  <Zap className="h-6 w-6 text-amber-500" />
                </div>
                <div className="font-bold text-foreground">{broker.maxLeverage}</div>
                <div className="text-xs text-muted-foreground">Max Leverage</div>
              </div>
            )}
            {broker.spreadFrom && (
              <div className="text-center" data-testid="stat-spread">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 mx-auto mb-2">
                  <Activity className="h-6 w-6 text-blue-500" />
                </div>
                <div className="font-bold text-foreground">{broker.spreadFrom}</div>
                <div className="text-xs text-muted-foreground">Spread From</div>
              </div>
            )}
            {broker.minWithdrawal && (
              <div className="text-center" data-testid="stat-min-withdrawal">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 mx-auto mb-2">
                  <ArrowDownToLine className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="font-bold text-foreground">{broker.minWithdrawal}</div>
                <div className="text-xs text-muted-foreground">Min Withdrawal</div>
              </div>
            )}
            {broker.instrumentsCount && (
              <div className="text-center" data-testid="stat-instruments">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mx-auto mb-2">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div className="font-bold text-foreground">{broker.instrumentsCount}</div>
                <div className="text-xs text-muted-foreground">Instruments</div>
              </div>
            )}
            {broker.supportHours && (
              <div className="text-center" data-testid="stat-support">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mx-auto mb-2">
                  <Headphones className="h-6 w-6 text-primary" />
                </div>
                <div className="font-bold text-foreground">{broker.supportHours}</div>
                <div className="text-xs text-muted-foreground">Support</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1fr_350px] gap-8">
            <div className="space-y-8">
              {/* Pros & Cons */}
              {(broker.pros.length > 0 || broker.cons && broker.cons.length > 0) && (
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Pros & Cons</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {broker.pros.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-emerald-500 mb-3 flex items-center gap-2">
                          <Check className="h-5 w-5" /> Pros
                        </h3>
                        <ul className="space-y-2">
                          {broker.pros.map((pro, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm" data-testid={`text-pro-${index}`}>
                              <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {broker.cons && broker.cons.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                          <X className="h-5 w-5" /> Cons
                        </h3>
                        <ul className="space-y-2">
                          {broker.cons.map((con, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm" data-testid={`text-con-${index}`}>
                              <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
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
                    className="prose prose-slate dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: broker.content }}
                    data-testid="content-review"
                  />
                </Card>
              )}

              {/* Bottom CTA */}
              <Card className="p-8 text-center bg-gradient-to-br from-primary/10 to-transparent">
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
                  <a href={broker.link} target="_blank" rel="noopener noreferrer">
                    Visit {stripHtml(broker.name)} <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info Card */}
              <Card className="p-6 sticky top-6">
                <h3 className="font-bold mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  {broker.headquarters && (
                    <div className="flex justify-between gap-3" data-testid="info-headquarters">
                      <span className="text-muted-foreground flex-shrink-0">Headquarters:</span>
                      <span className="font-medium text-right">{broker.headquarters}</span>
                    </div>
                  )}
                  {broker.support && (
                    <div className="flex justify-between" data-testid="info-support">
                      <span className="text-muted-foreground">Support:</span>
                      <span className="font-medium">{broker.support}</span>
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
                  <div className="mt-6 pt-6 border-t">
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

                <Button className="w-full mt-6" asChild data-testid="button-visit-sidebar" onClick={() => trackAffiliateClick({
                  broker_name: broker.name,
                  broker_type: 'broker',
                  page_location: 'broker_review',
                  placement_type: 'quick_stats_cta',
                  rating: broker.rating,
                  affiliate_link: broker.link
                })}>
                  <a href={broker.link} target="_blank" rel="noopener noreferrer">
                    Visit Broker <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* User Reviews Section */}
      <section className="py-16 bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid="text-reviews-title">
                User Reviews
              </h2>
              <p className="text-muted-foreground">
                Read what traders say about {stripHtml(broker.name)}
              </p>
            </div>
            <Button 
              variant="default" 
              onClick={() => setIsReviewModalOpen(true)}
              data-testid="button-write-review-section"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Write a Review
            </Button>
          </div>

          {reviews.length > 0 ? (
            <div className="grid gap-6">
              {reviews.map((review: any) => {
                const acf = review.acf || {};
                return (
                  <Card key={review.id} className="p-6" data-testid={`review-${review.id}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground" data-testid={`review-title-${review.id}`}>
                            {acf.review_title || review.title?.rendered}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-semibold" data-testid={`review-rating-${review.id}`}>
                              {acf.rating}/10
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid={`review-author-${review.id}`}>
                          By {acf.reviewer_name} • {new Date(review.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <p className="text-foreground leading-relaxed" data-testid={`review-text-${review.id}`}>
                      {acf.review_text}
                    </p>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No reviews yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to share your experience with {stripHtml(broker.name)}
              </p>
              <Button onClick={() => setIsReviewModalOpen(true)} data-testid="button-first-review">
                <MessageSquare className="mr-2 h-4 w-4" />
                Write the First Review
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-y">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-final-cta-headline">
              Ready to Start Trading with {stripHtml(broker.name)}?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of traders who trust {stripHtml(broker.name)} for their forex trading needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="flex flex-col items-center gap-2" data-testid="cta-benefit-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-foreground">Regulated & Safe</h3>
              <p className="text-sm text-muted-foreground">Your funds are protected</p>
            </div>
            <div className="flex flex-col items-center gap-2" data-testid="cta-benefit-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Competitive Spreads</h3>
              <p className="text-sm text-muted-foreground">Trade with low costs</p>
            </div>
            <div className="flex flex-col items-center gap-2" data-testid="cta-benefit-3">
              <div className="w-12 h-12 rounded-full bg-chart-2/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-chart-2" />
              </div>
              <h3 className="font-semibold text-foreground">Fast Execution</h3>
              <p className="text-sm text-muted-foreground">No slippage, instant trades</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Button size="lg" asChild className="min-w-[200px]" data-testid="button-final-cta">
              <a href={broker.link} target="_blank" rel="noopener noreferrer">
                Open Account Now <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Link href="/brokers">
              <Button variant="outline" size="lg" className="min-w-[200px]" data-testid="button-compare-brokers">
                Compare Other Brokers
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Risk Warning: CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. 
            You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money.
          </p>
        </div>
      </section>

      <Footer />
      
      {broker && (
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
      )}
      
      {/* Debug: Log when modal should be open */}
      {isReviewModalOpen && console.log("Modal should be open, broker exists:", !!broker, "broker data:", broker)}
    </div>
  );
}
