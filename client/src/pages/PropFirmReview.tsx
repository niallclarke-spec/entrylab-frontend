import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Star, Shield, DollarSign, TrendingUp, Award, Globe, Headphones, CreditCard, ArrowLeft, ExternalLink, Check, X, ChevronRight, Zap, ArrowRight, Gauge, Activity, Info, ArrowUp, MessageSquare, Target, Users, Clock, Percent, Calendar, TrendingDown, Scale, CheckCircle2, XCircle, AlertCircle, BarChart3, Trophy, LineChart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { transformPropFirmDetailed } from "@/lib/transforms";
import type { Broker } from "@shared/schema";
import { trackPageView, trackReviewView, trackAffiliateClick } from "@/lib/gtm";
import { ReviewModalSimple as ReviewModal } from "@/components/ReviewModalSimple";
import { BrokerAlertPopup } from "@/components/BrokerAlertPopup";

// Dummy data for funding programs (will be ACF fields later)
const fundingPrograms = [
  { size: "$10K", fee: "$89", profitTarget: "8%", dailyLoss: "5%", totalLoss: "10%", popular: false },
  { size: "$25K", fee: "$149", profitTarget: "8%", dailyLoss: "5%", totalLoss: "10%", popular: false },
  { size: "$50K", fee: "$249", profitTarget: "8%", dailyLoss: "5%", totalLoss: "10%", popular: true },
  { size: "$100K", fee: "$449", profitTarget: "8%", dailyLoss: "5%", totalLoss: "10%", popular: false },
  { size: "$200K", fee: "$849", profitTarget: "8%", dailyLoss: "5%", totalLoss: "10%", popular: false },
];

// Dummy data for challenge phases
const challengePhases = [
  { phase: 1, name: "Evaluation Phase", target: "8% profit", maxDays: "Unlimited", minDays: "4", dailyLoss: "5%", totalLoss: "10%" },
  { phase: 2, name: "Verification Phase", target: "5% profit", maxDays: "Unlimited", minDays: "4", dailyLoss: "5%", totalLoss: "10%" },
  { phase: 3, name: "Funded Account", target: "No target", maxDays: "Unlimited", minDays: "N/A", dailyLoss: "5%", totalLoss: "10%" },
];

// Dummy data for trading rules
const tradingRules = [
  { icon: TrendingDown, title: "Max Daily Loss", value: "5%", description: "Maximum loss per day from daily balance", color: "destructive" },
  { icon: AlertCircle, title: "Max Total Loss", value: "10%", description: "Maximum total drawdown from starting balance", color: "destructive" },
  { icon: Target, title: "Profit Target", value: "8%", description: "Profit goal for challenge phase", color: "emerald" },
  { icon: Calendar, title: "Minimum Days", value: "4 days", description: "Minimum trading days required", color: "blue" },
  { icon: Users, title: "Copy Trading", value: "Allowed", description: "Use expert advisors and copy trading", color: "emerald" },
  { icon: Clock, title: "News Trading", value: "Allowed", description: "Trade during high-impact news events", color: "emerald" },
];

// Dummy data for profit splits
const profitSplits = [
  { phase: "Initial", split: "80%", withdrawal: "Bi-weekly", notes: "First funded payout" },
  { phase: "After 1st Payout", split: "85%", withdrawal: "Bi-weekly", notes: "Increased profit share" },
  { phase: "After 3rd Payout", split: "90%", withdrawal: "Weekly", notes: "Maximum profit share" },
];

// Dummy comparison data
const competitorComparison = [
  { firm: "Current Firm", profitSplit: "90%", challenge: "$249", evaluation: "2-step", payoutTime: "24h", rating: 4.8, popular: true },
  { firm: "Competitor A", profitSplit: "80%", challenge: "$299", evaluation: "2-step", payoutTime: "14 days", rating: 4.5, popular: false },
  { firm: "Competitor B", profitSplit: "85%", challenge: "$199", evaluation: "1-step", payoutTime: "7 days", rating: 4.3, popular: false },
  { firm: "Competitor C", profitSplit: "75%", challenge: "$350", evaluation: "2-step", payoutTime: "30 days", rating: 4.1, popular: false },
];

// Dummy FAQ data
const faqs = [
  { q: "What is the success rate for passing the challenge?", a: "Our current success rate is approximately 45%, which is higher than the industry average of 10-15%. We provide comprehensive educational resources and support to help traders succeed." },
  { q: "How long does it take to receive my first payout?", a: "Once you complete your first profitable trade cycle and request a withdrawal, payouts are processed within 24-48 hours. Most traders receive their funds via bank transfer within 1-3 business days." },
  { q: "Can I trade during news events?", a: "Yes, we allow trading during all news events including NFP, FOMC, and other high-impact releases. There are no trading restrictions during specific times of day." },
  { q: "What happens if I fail the challenge?", a: "If you breach the rules during the evaluation, you can restart the challenge with a 20% discount. We also offer free retakes for traders who come close to passing but don't quite make it." },
  { q: "Do you offer refunds on challenge fees?", a: "Yes, your challenge fee is refundable with your first profit withdrawal. This means the challenge effectively becomes free once you're funded and profitable." },
  { q: "Can I have multiple accounts?", a: "Yes, traders can operate up to 5 funded accounts simultaneously. Many successful traders scale up by managing multiple accounts to maximize their earning potential." },
  { q: "What trading platforms do you support?", a: "We support MetaTrader 5, cTrader, and TradingView. You can choose your preferred platform during the registration process." },
  { q: "Is there a time limit to complete the challenge?", a: "No, there is no maximum time limit for the evaluation phase. You can take as long as you need to reach the profit target, as long as you respect the drawdown limits." },
];

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

  const propFirm = wpPropFirm ? transformPropFirmDetailed(wpPropFirm) : null;

  // Dummy data for demonstration (will use real data when available)
  const dummyPropFirm = propFirm ? propFirm : {
    name: "EntryFX Funding",
    slug: "entryfx-funding",
    logo: "https://placehold.co/200x80/8B5CF6/white?text=EntryFX",
    rating: 4.8,
    verified: true,
    featured: true,
    tagline: "Get funded with the industry's most trader-friendly prop firm",
    highlights: [
      "90% profit split after scaling",
      "24-hour payout processing",
      "No time limits on evaluation",
      "Challenge fee refunded with first payout"
    ],
    bestFor: "Experienced traders seeking maximum profit share and fast payouts",
    link: "#",
    bonusOffer: "20% Off All Accounts",
    pros: [
      "Industry-leading 90% profit split",
      "Ultra-fast 24h payout processing",
      "No trading restrictions during news",
      "Unlimited time to pass challenge",
    ],
    cons: [
      "Not regulated",
    ],
    content: "<p>EntryFX Funding has established itself as one of the premier prop trading firms in 2025, offering some of the most competitive terms in the industry...</p>",
    headquarters: "Dubai, UAE",
    trustScore: 92,
    totalUsers: "High",
    yearFounded: "2022",
    awards: [
      "Best Profit Split 2024",
      "Fastest Payouts Award 2024",
      "Trader's Choice 2025"
    ],
  };

  const displayFirm = propFirm || dummyPropFirm;

  useEffect(() => {
    if (displayFirm) {
      trackPageView(`/prop-firm/${slug}`, `${displayFirm.name} Review | EntryLab`);
      trackReviewView({
        broker_name: displayFirm.name,
        broker_type: 'prop_firm',
        rating: displayFirm.rating,
        min_deposit: "$89",
        regulation: "Not Regulated",
      });
    }
  }, [displayFirm, slug]);

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  if (isLoading && !propFirm) {
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

  const seoTitle = `${stripHtml(displayFirm.name)} Review 2025 | EntryLab`;
  const seoDescription = displayFirm.tagline || `Comprehensive review of ${stripHtml(displayFirm.name)}. Read about funding, profit splits, evaluation process, and more.`;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={seoTitle}
        description={seoDescription}
        url={`https://entrylab.io/prop-firm/${displayFirm.slug}`}
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
                  src={displayFirm.logo} 
                  alt={stripHtml(displayFirm.name)}
                  width="120"
                  height="64"
                  className="h-16 w-auto object-contain bg-white rounded-lg p-2"
                  data-testid="img-prop-firm-logo"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2" data-testid="text-prop-firm-name">
                    {stripHtml(displayFirm.name)} Review
                  </h1>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1" data-testid="text-prop-firm-rating">
                      <Star className="h-5 w-5 fill-emerald-500 text-emerald-500" />
                      <span className="text-lg font-semibold">{displayFirm.rating}</span>
                      <span className="text-muted-foreground text-sm">/5</span>
                    </div>
                    {displayFirm.verified && (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20" data-testid="badge-verified">
                        <Shield className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                    {displayFirm.featured && (
                      <Badge className="bg-primary/10 text-primary border-primary/20" data-testid="badge-featured">
                        <Award className="h-3 w-3 mr-1" /> Featured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {displayFirm.tagline && (
                <p className="text-lg text-muted-foreground mb-6" data-testid="text-prop-firm-tagline">
                  {displayFirm.tagline}
                </p>
              )}

              {displayFirm.highlights && displayFirm.highlights.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" /> At a Glance
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {displayFirm.highlights.slice(0, 4).map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`hero-highlight-${index}`}>
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {displayFirm.bestFor && (
                <div className="mb-6">
                  <span className="text-sm font-medium text-muted-foreground">Best For: </span>
                  <span className="text-sm text-foreground" data-testid="text-best-for">{displayFirm.bestFor}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 w-full lg:w-72">
              <Button size="lg" asChild className="w-full" data-testid="button-visit-prop-firm" onClick={() => trackAffiliateClick({
                broker_name: displayFirm.name,
                broker_type: 'prop_firm',
                page_location: 'prop_firm_review',
                placement_type: 'hero_cta',
                rating: displayFirm.rating,
                affiliate_link: displayFirm.link
              })}>
                <a href={displayFirm.link} target="_blank" rel="noopener noreferrer">
                  Get Funded Now <ExternalLink className="ml-2 h-4 w-4" />
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
              {displayFirm.bonusOffer && (
                <div className="relative">
                  <ArrowUp className="h-4 w-4 text-blue-500 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Badge className="w-full text-center justify-center py-2.5 bg-blue-500/10 text-blue-500 border-blue-500/20 cursor-help text-base" data-testid="badge-bonus">
                            🎁 {displayFirm.bonusOffer} <Info className="h-3.5 w-3.5 ml-1 inline" />
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-center">
                        <p className="text-xs">Use code ENTRYLAB20 at checkout</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats Bar */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mx-auto mb-2">
                <Percent className="h-6 w-6 text-primary" />
              </div>
              <div className="font-bold text-foreground">90%</div>
              <div className="text-xs text-muted-foreground">Profit Split</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 mx-auto mb-2">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="font-bold text-foreground">From $89</div>
              <div className="text-xs text-muted-foreground">Challenge Fee</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 mx-auto mb-2">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div className="font-bold text-foreground">24 hours</div>
              <div className="text-xs text-muted-foreground">Payout Time</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10 mx-auto mb-2">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
              <div className="font-bold text-foreground">2-Step</div>
              <div className="text-xs text-muted-foreground">Evaluation</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-500/10 mx-auto mb-2">
                <TrendingUp className="h-6 w-6 text-amber-500" />
              </div>
              <div className="font-bold text-foreground">45%</div>
              <div className="text-xs text-muted-foreground">Pass Rate</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 mx-auto mb-2">
                <BarChart3 className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="font-bold text-foreground">$200K</div>
              <div className="text-xs text-muted-foreground">Max Capital</div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1fr_350px] gap-8">
            <div className="space-y-8">
              
              {/* Funding Programs */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Funding Programs</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fundingPrograms.map((program, index) => (
                    <Card key={index} className={`relative p-6 ${program.popular ? 'border-primary border-2' : ''}`}>
                      {program.popular && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                          Most Popular
                        </Badge>
                      )}
                      <div className="text-center mb-4">
                        <h3 className="text-3xl font-bold text-primary">{program.size}</h3>
                        <p className="text-sm text-muted-foreground mt-1">Account Size</p>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Challenge Fee:</span>
                          <span className="font-semibold">{program.fee}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Profit Target:</span>
                          <span className="font-semibold text-emerald-500">{program.profitTarget}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Max Daily Loss:</span>
                          <span className="font-semibold text-destructive">{program.dailyLoss}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Max Total Loss:</span>
                          <span className="font-semibold text-destructive">{program.totalLoss}</span>
                        </div>
                      </div>
                      <Button className="w-full" variant={program.popular ? "default" : "outline"}>
                        Select {program.size}
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Challenge Phases */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Challenge Phases</h2>
                <div className="space-y-4">
                  {challengePhases.map((phase) => (
                    <div key={phase.phase} className="relative pl-8">
                      <div className="absolute left-0 top-1 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                        {phase.phase}
                      </div>
                      <div className="pb-4 border-b last:border-0">
                        <h3 className="font-bold mb-3">{phase.name}</h3>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Profit Target:</span>
                            <span className="ml-2 font-semibold text-emerald-500">{phase.target}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min Days:</span>
                            <span className="ml-2 font-semibold">{phase.minDays}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Days:</span>
                            <span className="ml-2 font-semibold">{phase.maxDays}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Daily Loss:</span>
                            <span className="ml-2 font-semibold text-destructive">{phase.dailyLoss}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Loss:</span>
                            <span className="ml-2 font-semibold text-destructive">{phase.totalLoss}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Trading Rules */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Trading Rules</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tradingRules.map((rule, index) => {
                    const Icon = rule.icon;
                    const colorClasses = rule.color === 'destructive' ? 'text-destructive bg-destructive/10' :
                                        rule.color === 'emerald' ? 'text-emerald-500 bg-emerald-500/10' :
                                        rule.color === 'blue' ? 'text-blue-500 bg-blue-500/10' : '';
                    return (
                      <Card key={index} className="p-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colorClasses} mb-3`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold mb-1">{rule.title}</h3>
                        <p className="text-2xl font-bold mb-2">{rule.value}</p>
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Profit Splits & Scaling */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Profit Splits & Scaling</h2>
                <div className="space-y-4">
                  {profitSplits.map((split, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <h3 className="font-bold mb-1">{split.phase}</h3>
                        <p className="text-sm text-muted-foreground">{split.notes}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{split.split}</div>
                        <div className="text-xs text-muted-foreground">{split.withdrawal}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Scale className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Scaling Plan</h4>
                      <p className="text-sm text-muted-foreground">
                        Increase your account size by 20% after every 3 consecutive profitable payouts, up to a maximum of $2 million in total capital.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Pros & Cons - Market Chart Style */}
              {(displayFirm.pros.length > 0 || displayFirm.cons && displayFirm.cons.length > 0) && (
                <Card className="relative overflow-hidden p-6">
                  <h2 className="text-2xl font-bold mb-6">Pros & Cons</h2>
                  
                  <div className="absolute inset-0 opacity-5">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                      <path d="M0,50 Q250,30 500,50 T1000,50" stroke="currentColor" fill="none" strokeWidth="1" className="text-primary"/>
                      <path d="M0,80 Q250,60 500,80 T1000,80" stroke="currentColor" fill="none" strokeWidth="1" className="text-primary"/>
                    </svg>
                  </div>

                  <div className="relative mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold text-muted-foreground">Overall Rating</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-emerald-500">{displayFirm.pros.length} Pros</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-destructive">{displayFirm.cons?.length || 0} Cons</span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all"
                        style={{ width: `${(displayFirm.pros.length / (displayFirm.pros.length + (displayFirm.cons?.length || 0))) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="relative space-y-6">
                    {displayFirm.pros.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Check className="h-4 w-4 text-emerald-500" />
                          <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wide">Strengths</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {displayFirm.pros.map((pro, index) => (
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

                    {displayFirm.cons && displayFirm.cons.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <X className="h-4 w-4 text-destructive" />
                          <h3 className="text-sm font-bold text-destructive uppercase tracking-wide">Limitations</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {displayFirm.cons.map((con, index) => (
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

              {/* Comparison Table */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">How We Compare</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-semibold">Firm</th>
                        <th className="text-center py-3 px-2 font-semibold">Profit Split</th>
                        <th className="text-center py-3 px-2 font-semibold">Challenge Fee</th>
                        <th className="text-center py-3 px-2 font-semibold">Evaluation</th>
                        <th className="text-center py-3 px-2 font-semibold">Payout Time</th>
                        <th className="text-center py-3 px-2 font-semibold">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitorComparison.map((comp, index) => (
                        <tr key={index} className={`border-b ${comp.popular ? 'bg-primary/5' : ''}`}>
                          <td className="py-3 px-2 font-medium">
                            {comp.firm}
                            {comp.popular && (
                              <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 text-xs">You're Here</Badge>
                            )}
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={comp.profitSplit === "90%" ? "text-emerald-500 font-bold" : ""}>
                              {comp.profitSplit}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">{comp.challenge}</td>
                          <td className="text-center py-3 px-2">{comp.evaluation}</td>
                          <td className="text-center py-3 px-2">
                            <span className={comp.payoutTime === "24h" ? "text-emerald-500 font-bold" : ""}>
                              {comp.payoutTime}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                              <span>{comp.rating}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Success Metrics */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="p-6 text-center">
                  <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">45%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                  <p className="text-xs text-muted-foreground mt-2">Above industry avg of 10-15%</p>
                </Card>
                <Card className="p-6 text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">2,340</div>
                  <div className="text-sm text-muted-foreground">Active Traders</div>
                  <p className="text-xs text-muted-foreground mt-2">Join our growing community</p>
                </Card>
                <Card className="p-6 text-center">
                  <DollarSign className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">$12M+</div>
                  <div className="text-sm text-muted-foreground">Total Payouts</div>
                  <p className="text-xs text-muted-foreground mt-2">Paid to successful traders</p>
                </Card>
              </div>

              {/* FAQ Section */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>

              {/* Full Review Content */}
              {displayFirm.content && (
                <Card className="p-6">
                  <div 
                    className="prose prose-slate dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: displayFirm.content }}
                    data-testid="content-review"
                  />
                </Card>
              )}

              {/* Bottom CTA */}
              <Card className="p-8 text-center bg-gradient-to-br from-primary/10 to-transparent">
                <h3 className="text-2xl font-bold mb-3">Ready to Get Funded?</h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of funded traders with {stripHtml(displayFirm.name)}
                </p>
                <Button size="lg" asChild data-testid="button-visit-prop-firm-bottom">
                  <a href={displayFirm.link} target="_blank" rel="noopener noreferrer">
                    Start Your Challenge <ChevronRight className="ml-2 h-4 w-4" />
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
                  {displayFirm.headquarters && (
                    <div className="flex justify-between gap-3" data-testid="info-headquarters">
                      <span className="text-muted-foreground flex-shrink-0">Headquarters:</span>
                      <span className="font-medium text-right">{displayFirm.headquarters}</span>
                    </div>
                  )}
                  {displayFirm.totalUsers && (
                    <div className="flex justify-between" data-testid="info-popularity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground flex items-center gap-1 cursor-help">
                              Popularity: <Info className="h-3 w-3 text-blue-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-center">
                            <p className="text-xs">Based on website traffic, social engagement, and community size</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="font-medium">{displayFirm.totalUsers}</span>
                    </div>
                  )}
                  {displayFirm.trustScore && (
                    <div className="flex justify-between" data-testid="info-trust-score">
                      <span className="text-muted-foreground">Trust Score:</span>
                      <span className="font-medium">{displayFirm.trustScore}/100</span>
                    </div>
                  )}
                  {displayFirm.yearFounded && (
                    <div className="flex justify-between" data-testid="info-founded">
                      <span className="text-muted-foreground">Founded:</span>
                      <span className="font-medium">{displayFirm.yearFounded}</span>
                    </div>
                  )}
                </div>

                {displayFirm.awards && displayFirm.awards.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-500" /> Awards
                    </h4>
                    <ul className="space-y-2">
                      {displayFirm.awards.map((award, index) => (
                        <li key={index} className="text-sm text-muted-foreground" data-testid={`award-${index}`}>
                          • {award}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Payout Proof</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm p-2 rounded bg-emerald-500/10">
                      <span className="text-muted-foreground">Last Payout:</span>
                      <span className="font-semibold text-emerald-500">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm p-2 rounded bg-emerald-500/10">
                      <span className="text-muted-foreground">Avg Time:</span>
                      <span className="font-semibold text-emerald-500">18 hours</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-6" size="lg">
                  Get 20% Discount
                </Button>
              </Card>

              {/* Trust Badges */}
              <Card className="p-6">
                <h4 className="font-semibold mb-4">Trust & Security</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm">Verified Payouts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm">SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm">24/7 Support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm">Refundable Fee</span>
                  </div>
                </div>
              </Card>

              {/* User Reviews Summary */}
              {reviews && reviews.length > 0 && (
                <Card className="p-6">
                  <h4 className="font-semibold mb-4">User Reviews ({reviews.length})</h4>
                  <div className="space-y-4">
                    {reviews.slice(0, 2).map((review, index) => (
                      <div key={index} className="pb-4 border-b last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < Math.floor(review.acf?.rating || 0) ? 'fill-emerald-500 text-emerald-500' : 'text-muted'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-3">{review.acf?.review_text || review.content?.rendered?.replace(/<[^>]*>/g, '')}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      {isReviewModalOpen && (
        <ReviewModal 
          isOpen={isReviewModalOpen} 
          onClose={() => setIsReviewModalOpen(false)} 
          brokerName={displayFirm.name}
          brokerId={wpPropFirm?.id?.toString()}
        />
      )}

      {displayFirm.slug && (
        <BrokerAlertPopup 
          brokerName={displayFirm.name}
          brokerSlug={displayFirm.slug}
          scrollThreshold={60}
        />
      )}
    </div>
  );
}
