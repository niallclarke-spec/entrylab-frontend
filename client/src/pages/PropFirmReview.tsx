import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Star, Shield, DollarSign, TrendingUp, Award, Globe, Headphones, CreditCard, ArrowLeft, ExternalLink, Check, X, ChevronRight, Zap, ArrowRight, Gauge, Activity, Info, ArrowUp, MessageSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Broker } from "@shared/schema";
import { trackPageView, trackReviewView, trackAffiliateClick } from "@/lib/gtm";
import { ReviewModal } from "@/components/ReviewModal";

export default function PropFirmReview() {
  const params = useParams();
  const slug = params.slug;
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { data: wpPropFirm, isLoading } = useQuery<any>({
    queryKey: ["/api/wordpress/prop-firm", slug],
    enabled: !!slug,
  });

  const { data: reviews = [] } = useQuery<any[]>({
    queryKey: ["/api/wordpress/reviews", wpPropFirm?.id],
    enabled: !!wpPropFirm?.id,
  });

  const transformPropFirm = (wpPropFirm: any): Broker | null => {
    const acf = wpPropFirm.acf || {};
    const logo = acf.prop_firm_logo?.url || wpPropFirm._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    const name = wpPropFirm.title?.rendered;
    if (!name) return null;

    const isFeatured = acf.is_featured === true || acf.is_featured === "1";
    const keyFeatures = acf.prop_firm_usp 
      ? acf.prop_firm_usp.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f).slice(0, 4)
      : [];
    const prosText = acf.pros 
      ? acf.pros.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f)
      : keyFeatures;
    const consList = acf.cons 
      ? acf.cons.split(/[,\n]+/).map((c: string) => c.trim()).filter((c: string) => c)
      : [];
    const awardsList = acf.awards 
      ? acf.awards.split(/[,\n]+/).map((a: string) => a.trim()).filter((a: string) => a)
      : [];

    // Format modified date
    const modifiedDate = wpPropFirm.modified ? new Date(wpPropFirm.modified) : null;

    return {
      id: wpPropFirm.id.toString(),
      slug: wpPropFirm.slug,
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
      content: wpPropFirm.content?.rendered || "",
      minDeposit: acf.min_deposit,
      maxLeverage: acf.max_leverage,
      spreadFrom: acf.spread_from,
      regulation: acf.regulation,
      instrumentsCount: acf.instruments_count,
      supportHours: acf.support_hours,
      cons: consList,
      bestFor: acf.best_for,
      platforms: acf.platforms,
      accountTypes: acf.account_types,
      paymentMethods: acf.payment_methods,
      yearFounded: acf.year_founded,
      headquarters: acf.headquarters,
      regulationDetails: acf.regulation_details,
      withdrawalTime: acf.withdrawal_time,
      trustScore: acf.trust_score ? parseInt(acf.trust_score) : undefined,
      totalUsers: acf.popularity,
      awards: awardsList,
      lastUpdated: modifiedDate,
      seoTitle: acf.seo_title,
      seoDescription: acf.seo_description,
    };
  };

  const propFirm = wpPropFirm ? transformPropFirm(wpPropFirm) : null;

  useEffect(() => {
    if (propFirm) {
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

  if (!propFirm) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Prop Firm Not Found</h2>
            <Link href="/prop-firms">
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

  // SEO with fallbacks: Custom ACF fields OR auto-generated defaults
  const seoTitle = propFirm.seoTitle || `${stripHtml(propFirm.name)} Review 2025 | EntryLab`;
  const seoDescription = propFirm.seoDescription || propFirm.tagline || `Comprehensive review of ${stripHtml(propFirm.name)}. Read about funding, profit splits, evaluation process, and more.`;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={seoTitle}
        description={seoDescription}
        url={`https://entrylab.io/prop-firm/${propFirm.slug}`}
      />
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <Link href="/prop-firms">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-prop-firms-top">
              <ArrowLeft className="mr-2 h-3 w-3" /> Back to Prop Firms
            </Button>
          </Link>

          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={propFirm.logo} 
                  alt={stripHtml(propFirm.name)} 
                  className="h-16 w-auto object-contain bg-white rounded-lg p-2"
                  data-testid="img-prop-firm-logo"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2" data-testid="text-prop-firm-name">
                    {stripHtml(propFirm.name)} Review
                  </h1>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1" data-testid="text-prop-firm-rating">
                      <Star className="h-5 w-5 fill-emerald-500 text-emerald-500" />
                      <span className="text-lg font-semibold">{propFirm.rating}</span>
                      <span className="text-muted-foreground text-sm">/5</span>
                    </div>
                    {propFirm.verified && (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20" data-testid="badge-verified">
                        <Shield className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                    {propFirm.featured && (
                      <Badge className="bg-primary/10 text-primary border-primary/20" data-testid="badge-featured">
                        <Award className="h-3 w-3 mr-1" /> Featured
                      </Badge>
                    )}
                    {propFirm.lastUpdated && (
                      <span className="text-xs text-muted-foreground" data-testid="text-last-updated">
                        Updated {propFirm.lastUpdated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {propFirm.tagline && (
                <p className="text-lg text-muted-foreground mb-6" data-testid="text-prop-firm-tagline">
                  {propFirm.tagline}
                </p>
              )}

              {/* At a Glance Highlights */}
              {(propFirm.highlights && propFirm.highlights.length > 0) && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" /> At a Glance
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {propFirm.highlights.slice(0, 4).map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`hero-highlight-${index}`}>
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {propFirm.bestFor && (
                <div className="mb-6">
                  <span className="text-sm font-medium text-muted-foreground">Best For: </span>
                  <span className="text-sm text-foreground" data-testid="text-best-for">{propFirm.bestFor}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 w-full lg:w-72">
              <Button size="lg" asChild className="w-full" data-testid="button-visit-prop-firm" onClick={() => trackAffiliateClick({
                broker_name: propFirm.name,
                broker_type: 'prop_firm',
                page_location: 'prop_firm_review',
                placement_type: 'hero_cta',
                rating: propFirm.rating,
                affiliate_link: propFirm.link
              })}>
                <a href={propFirm.link} target="_blank" rel="noopener noreferrer">
                  Visit {stripHtml(propFirm.name)} <ExternalLink className="ml-2 h-4 w-4" />
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
              {propFirm.bonusOffer && (
                <div className="relative">
                  <ArrowUp className="h-4 w-4 text-blue-500 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Badge className="w-full text-center justify-center py-2.5 bg-blue-500/10 text-blue-500 border-blue-500/20 cursor-help text-base" data-testid="badge-bonus">
                            🎁 {propFirm.bonusOffer} <Info className="h-3.5 w-3.5 ml-1 inline" />
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-center">
                        <p className="text-xs">Get "{propFirm.bonusOffer}" if you sign up with the button above</p>
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
            {propFirm.minDeposit && (
              <div className="text-center" data-testid="stat-min-deposit">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mx-auto mb-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div className="font-bold text-foreground">{propFirm.minDeposit}</div>
                <div className="text-xs text-muted-foreground">Starting Capital</div>
              </div>
            )}
            {propFirm.maxLeverage && (
              <div className="text-center" data-testid="stat-max-leverage">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-500/10 mx-auto mb-2">
                  <Zap className="h-6 w-6 text-amber-500" />
                </div>
                <div className="font-bold text-foreground">{propFirm.maxLeverage}</div>
                <div className="text-xs text-muted-foreground">Max Leverage</div>
              </div>
            )}
            {propFirm.spreadFrom && (
              <div className="text-center" data-testid="stat-profit-split">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 mx-auto mb-2">
                  <Activity className="h-6 w-6 text-blue-500" />
                </div>
                <div className="font-bold text-foreground">{propFirm.spreadFrom}</div>
                <div className="text-xs text-muted-foreground">Profit Split</div>
              </div>
            )}
            {propFirm.regulation && (
              <div className="text-center" data-testid="stat-regulation">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 mx-auto mb-2">
                  <Shield className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="font-bold text-foreground text-sm">{propFirm.regulation.split(',')[0].trim()}</div>
                <div className="text-xs text-muted-foreground">Regulated</div>
              </div>
            )}
            {propFirm.instrumentsCount && (
              <div className="text-center" data-testid="stat-instruments">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mx-auto mb-2">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div className="font-bold text-foreground">{propFirm.instrumentsCount}</div>
                <div className="text-xs text-muted-foreground">Instruments</div>
              </div>
            )}
            {propFirm.supportHours && (
              <div className="text-center" data-testid="stat-support">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mx-auto mb-2">
                  <Headphones className="h-6 w-6 text-primary" />
                </div>
                <div className="font-bold text-foreground">{propFirm.supportHours}</div>
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
              {(propFirm.pros.length > 0 || propFirm.cons && propFirm.cons.length > 0) && (
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Pros & Cons</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {propFirm.pros.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-emerald-500 mb-3 flex items-center gap-2">
                          <Check className="h-5 w-5" /> Pros
                        </h3>
                        <ul className="space-y-2">
                          {propFirm.pros.map((pro, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm" data-testid={`text-pro-${index}`}>
                              <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {propFirm.cons && propFirm.cons.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                          <X className="h-5 w-5" /> Cons
                        </h3>
                        <ul className="space-y-2">
                          {propFirm.cons.map((con, index) => (
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
                        <span className="font-semibold">Payout Time</span>
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

              {/* Full Review Content */}
              {propFirm.content && (
                <Card className="p-6">
                  <div 
                    className="prose prose-slate dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: propFirm.content }}
                    data-testid="content-review"
                  />
                </Card>
              )}

              {/* Bottom CTA */}
              <Card className="p-8 text-center bg-gradient-to-br from-primary/10 to-transparent">
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
                  <a href={propFirm.link} target="_blank" rel="noopener noreferrer">
                    Visit {stripHtml(propFirm.name)} <ChevronRight className="ml-2 h-4 w-4" />
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
                  {propFirm.headquarters && (
                    <div className="flex justify-between" data-testid="info-headquarters">
                      <span className="text-muted-foreground">Headquarters:</span>
                      <span className="font-medium">{propFirm.headquarters}</span>
                    </div>
                  )}
                  {propFirm.totalUsers && (
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
                      <span className="font-medium">{propFirm.totalUsers}</span>
                    </div>
                  )}
                  {propFirm.trustScore && (
                    <div className="flex justify-between" data-testid="info-trust-score">
                      <span className="text-muted-foreground">Trust Score:</span>
                      <span className="font-medium">{propFirm.trustScore}/100</span>
                    </div>
                  )}
                </div>

                {propFirm.awards && propFirm.awards.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-500" /> Awards
                    </h4>
                    <ul className="space-y-2">
                      {propFirm.awards.map((award, index) => (
                        <li key={index} className="text-sm text-muted-foreground" data-testid={`award-${index}`}>
                          • {award}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button className="w-full mt-6" asChild data-testid="button-visit-sidebar" onClick={() => trackAffiliateClick({
                  broker_name: propFirm.name,
                  broker_type: 'prop_firm',
                  page_location: 'prop_firm_review',
                  placement_type: 'quick_stats_cta',
                  rating: propFirm.rating,
                  affiliate_link: propFirm.link
                })}>
                  <a href={propFirm.link} target="_blank" rel="noopener noreferrer">
                    Visit Prop Firm <ExternalLink className="ml-2 h-4 w-4" />
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
                Read what funded traders say about {stripHtml(propFirm.name)}
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
                Be the first to share your experience with {stripHtml(propFirm.name)}
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
              Ready to Get Funded with {stripHtml(propFirm.name)}?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of traders who have been funded through {stripHtml(propFirm.name)}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="flex flex-col items-center gap-2" data-testid="cta-benefit-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-foreground">Trusted Platform</h3>
              <p className="text-sm text-muted-foreground">Industry-leading prop firm</p>
            </div>
            <div className="flex flex-col items-center gap-2" data-testid="cta-benefit-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">High Profit Split</h3>
              <p className="text-sm text-muted-foreground">Keep more of your profits</p>
            </div>
            <div className="flex flex-col items-center gap-2" data-testid="cta-benefit-3">
              <div className="w-12 h-12 rounded-full bg-chart-2/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-chart-2" />
              </div>
              <h3 className="font-semibold text-foreground">Quick Evaluation</h3>
              <p className="text-sm text-muted-foreground">Get funded fast</p>
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
            <Link href="/prop-firms">
              <Button variant="outline" size="lg" className="min-w-[200px]" data-testid="button-compare-prop-firms">
                Compare Other Prop Firms
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Risk Warning: Trading involves risk. Ensure you understand the evaluation process and trading rules before participating.
          </p>
        </div>
      </section>

      <Footer />
      
      {propFirm && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          brokerName={stripHtml(propFirm.name)}
          brokerLogo={propFirm.logo}
          brokerId={propFirm.id}
          itemType="prop-firm"
        />
      )}
    </div>
  );
}
