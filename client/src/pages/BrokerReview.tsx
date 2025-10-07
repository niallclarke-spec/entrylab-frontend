import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Star, Shield, DollarSign, TrendingUp, Award, Globe, Headphones, CreditCard, ArrowLeft, ExternalLink, Check, X, ChevronRight } from "lucide-react";
import type { Broker } from "@shared/schema";

export default function BrokerReview() {
  const params = useParams();
  const slug = params.slug;

  const { data: wpBroker, isLoading } = useQuery<any>({
    queryKey: ["/api/wordpress/broker", slug],
    enabled: !!slug,
  });

  const transformBroker = (wpBroker: any): Broker | null => {
    const acf = wpBroker.acf || {};
    const logo = acf.broker_logo?.url || wpBroker._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    const name = wpBroker.title?.rendered;
    if (!name) return null;

    const isFeatured = acf.is_featured === true || acf.is_featured === "1";
    const keyFeatures = acf.broker_usp 
      ? acf.broker_usp.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f).slice(0, 4)
      : [];
    const whyChoose = acf.why_choose 
      ? acf.why_choose.split(/[,\n]+/).map((f: string) => f.trim()).filter((f: string) => f)
      : keyFeatures;
    const consList = acf.cons 
      ? acf.cons.split(/[,\n]+/).map((c: string) => c.trim()).filter((c: string) => c)
      : [];
    const awardsList = acf.awards 
      ? acf.awards.split(/[,\n]+/).map((a: string) => a.trim()).filter((a: string) => a)
      : [];

    return {
      id: wpBroker.id.toString(),
      slug: wpBroker.slug,
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
      content: wpBroker.content?.rendered || "",
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
      totalUsers: acf.total_users,
      awards: awardsList,
    };
  };

  const broker = wpBroker ? transformBroker(wpBroker) : null;

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

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={`${stripHtml(broker.name)} Review 2025 | EntryLab`}
        description={broker.tagline || `Comprehensive review of ${stripHtml(broker.name)}. Read about spreads, regulation, platforms, and more.`}
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

          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-start">
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
                  </div>
                </div>
              </div>

              {broker.tagline && (
                <p className="text-lg text-muted-foreground mb-6" data-testid="text-broker-tagline">
                  {broker.tagline}
                </p>
              )}

              {broker.bestFor && (
                <div className="mb-6">
                  <span className="text-sm font-medium text-muted-foreground">Best For: </span>
                  <span className="text-sm text-foreground" data-testid="text-best-for">{broker.bestFor}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button size="lg" asChild className="w-full lg:w-auto" data-testid="button-visit-broker">
                <a href={broker.link} target="_blank" rel="noopener noreferrer">
                  Visit {stripHtml(broker.name)} <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              {broker.bonusOffer && (
                <Badge className="text-center justify-center py-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20" data-testid="badge-bonus">
                  🎁 {broker.bonusOffer}
                </Badge>
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
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mx-auto mb-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="font-bold text-foreground">{broker.maxLeverage}</div>
                <div className="text-xs text-muted-foreground">Max Leverage</div>
              </div>
            )}
            {broker.spreadFrom && (
              <div className="text-center" data-testid="stat-spread">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mx-auto mb-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="font-bold text-foreground">{broker.spreadFrom}</div>
                <div className="text-xs text-muted-foreground">Spread From</div>
              </div>
            )}
            {broker.regulation && (
              <div className="text-center" data-testid="stat-regulation">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 mx-auto mb-2">
                  <Shield className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="font-bold text-foreground text-sm">{broker.regulation.split(',')[0].trim()}</div>
                <div className="text-xs text-muted-foreground">Regulated</div>
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
                  {broker.platforms && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-platforms">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Platforms</span>
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
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Max Leverage</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{broker.maxLeverage}</p>
                    </div>
                  )}
                  {broker.paymentMethods && (
                    <div className="p-4 rounded-lg bg-muted/50" data-testid="detail-payment">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Payment Methods</span>
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
                <Button size="lg" asChild data-testid="button-visit-broker-bottom">
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
                    <div className="flex justify-between" data-testid="info-headquarters">
                      <span className="text-muted-foreground">Headquarters:</span>
                      <span className="font-medium">{broker.headquarters}</span>
                    </div>
                  )}
                  {broker.totalUsers && (
                    <div className="flex justify-between" data-testid="info-users">
                      <span className="text-muted-foreground">Total Users:</span>
                      <span className="font-medium">{broker.totalUsers}</span>
                    </div>
                  )}
                  {broker.trustScore && (
                    <div className="flex justify-between" data-testid="info-trust-score">
                      <span className="text-muted-foreground">Trust Score:</span>
                      <span className="font-medium">{broker.trustScore}/100</span>
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

                <Button className="w-full mt-6" asChild data-testid="button-visit-sidebar">
                  <a href={broker.link} target="_blank" rel="noopener noreferrer">
                    Visit Broker <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
