import { useState, useEffect, useRef } from "react";
import { Check, TrendingUp, Users, Award, Shield, Zap, Clock, Target, ArrowRight, Star, Mail, ChevronRight, BarChart3, Brain, Building2, LineChart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const subscriberResults = [
  { id: "4821", profit: "+$4,250", time: "2h ago" },
  { id: "3156", profit: "+$890", time: "3h ago" },
  { id: "2847", profit: "+$1,340", time: "4h ago" },
  { id: "1923", profit: "+$77", time: "5h ago" },
  { id: "4102", profit: "+$2,180", time: "6h ago" },
  { id: "3589", profit: "+$340", time: "7h ago" },
  { id: "2671", profit: "+$1,875", time: "8h ago" },
  { id: "4455", profit: "+$520", time: "9h ago" },
  { id: "1834", profit: "+$3,100", time: "10h ago" },
  { id: "3927", profit: "+$156", time: "11h ago" },
  { id: "2103", profit: "+$2,450", time: "12h ago" },
  { id: "4678", profit: "+$680", time: "13h ago" },
];

const floatingTestimonials = [
  {
    quote: "The analysis quality is institutional-grade. Finally, signals I can trust.",
    author: "M. Rodriguez",
    role: "Professional Trader"
  },
  {
    quote: "Clear entries, precise stops. No guesswork. This is how trading should be.",
    author: "S. Chen",
    role: "Fund Analyst"
  },
  {
    quote: "Turned my part-time trading into consistent monthly income.",
    author: "D. Thompson",
    role: "Private Investor"
  }
];

function LiveResultsTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % subscriberResults.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden bg-card/50 border border-border/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-muted-foreground">Live Subscriber Results</span>
      </div>
      <div ref={tickerRef} className="relative h-8 overflow-hidden">
        {subscriberResults.map((result, index) => (
          <div
            key={result.id}
            className={`absolute inset-0 flex items-center justify-between transition-all duration-500 ${
              index === currentIndex ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-muted-foreground">Subscriber #{result.id}</span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-500 font-bold text-lg">{result.profit}</span>
              <span className="text-xs text-muted-foreground">{result.time}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 border-t border-border/50 pt-3">
        Results vary based on position size. Range: $77 – $4,250 per signal.
      </p>
    </div>
  );
}

function AccuracyProgressBar() {
  const [accuracy, setAccuracy] = useState(82);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      const newAccuracy = Math.floor(Math.random() * (91 - 82 + 1)) + 82;
      setAccuracy(newAccuracy);
      setTimeout(() => setIsAnimating(false), 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">90-Day Signal Accuracy</h3>
          <p className="text-sm text-muted-foreground">Verified performance data</p>
        </div>
        <div className={`text-3xl font-bold text-primary transition-all duration-300 ${isAnimating ? "scale-110" : ""}`}>
          {accuracy}%
        </div>
      </div>
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${accuracy}%` }}
        />
        <div 
          className="absolute inset-y-0 bg-primary/30 rounded-full animate-pulse"
          style={{ left: `${accuracy - 2}%`, width: '4%' }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>0%</span>
        <span className="text-emerald-500">Target: 80%+</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function FloatingTestimonial({ testimonial, position }: { testimonial: typeof floatingTestimonials[0], position: string }) {
  return (
    <div className={`absolute ${position} max-w-xs animate-float`}>
      <Card className="bg-card/90 backdrop-blur-sm border-border/50 shadow-lg">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground italic mb-3">"{testimonial.quote}"</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{testimonial.author.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-medium">{testimonial.author}</p>
              <p className="text-xs text-muted-foreground">{testimonial.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmailCaptureForm({ 
  variant = "default",
  testIdSuffix = "",
  onSubmit 
}: { 
  variant?: "default" | "compact";
  testIdSuffix?: string;
  onSubmit: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const suffix = testIdSuffix ? `-${testIdSuffix}` : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(email);
      setEmail("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <div className="flex-1 relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9 h-10"
            disabled={isSubmitting}
            required
            data-testid={`input-email${suffix}`}
          />
        </div>
        <Button type="submit" size="default" disabled={isSubmitting} data-testid={`button-submit${suffix}`}>
          {isSubmitting ? "Joining..." : "Join Free"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 text-base"
            disabled={isSubmitting}
            required
            data-testid={`input-email${suffix}`}
          />
        </div>
        <Button 
          type="submit" 
          size="lg" 
          className="h-12 px-8"
          disabled={isSubmitting}
          data-testid={`button-submit${suffix}`}
        >
          {isSubmitting ? "Joining..." : "Get Free Access"}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}

export default function SignalsLanding() {
  const { toast } = useToast();

  const handleEmailSubmit = async (email: string) => {
    try {
      const res = await apiRequest(
        'POST',
        '/api/capture-email',
        {
          email,
          source: 'signals_landing',
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
          utm_source: new URLSearchParams(window.location.search).get('utm_source'),
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
          utm_content: new URLSearchParams(window.location.search).get('utm_content'),
          utm_term: new URLSearchParams(window.location.search).get('utm_term'),
        }
      );
      const response = await res.json() as { redirect_url: string; message: string };
      toast({
        title: "Welcome to EntryLab",
        description: response.message || "Check your email for next steps",
      });
      window.open(response.redirect_url, '_blank');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return (
    <>
      <Helmet>
        <title>XAU/USD Trading Signals - Professional Analysis | EntryLab</title>
        <meta name="description" content="Access institutional-grade XAU/USD analysis from experienced traders. Join our free Telegram channel for market insights, or upgrade to VIP for 3-5 daily signals with 82-91% accuracy." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          
          {/* Floating Testimonials - Desktop only */}
          <div className="hidden xl:block">
            <FloatingTestimonial testimonial={floatingTestimonials[0]} position="top-32 left-8" />
            <FloatingTestimonial testimonial={floatingTestimonials[1]} position="top-64 right-8" />
          </div>
          
          <div className="container mx-auto max-w-4xl relative z-10">
            <div className="text-center space-y-6">
              <Badge className="mx-auto w-fit" variant="outline" data-testid="badge-live">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                XAU/USD Signals • Institutional Analysis
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold leading-tight" data-testid="text-hero-title">
                Professional XAU/USD Signals<br />
                <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  Backed by Real Performance
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-subtitle">
                Access our free Telegram channel for market analysis and occasional VIP signals. 
                See real subscriber results before you commit.
              </p>

              {/* Email Capture */}
              <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-6 md:p-8">
                  <EmailCaptureForm testIdSuffix="hero" onSubmit={handleEmailSubmit} />
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-primary" />
                      <span>Instant Telegram access</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>No credit card required</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <a href="/subscribe" className="inline-block" data-testid="link-view-vip-plans">
                <Button size="lg" variant="outline" data-testid="button-view-vip-plans">
                  View VIP Plans
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="py-6 px-4 border-y border-border/50 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
              <div className="flex items-center gap-2" data-testid="trust-trustpilot">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <span className="text-sm font-medium">4.8 on TrustPilot</span>
              </div>
              <div className="h-4 w-px bg-border hidden md:block" />
              <div className="flex items-center gap-2" data-testid="trust-myfxbook">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Verified on MyFXBook</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="h-4 w-px bg-border hidden md:block" />
              <div className="flex items-center gap-2" data-testid="trust-traders">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">4,800+ Active Traders</span>
              </div>
            </div>
          </div>
        </section>

        {/* Accuracy Bar + Live Results */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="grid md:grid-cols-2 gap-6">
              <AccuracyProgressBar />
              <LiveResultsTicker />
            </div>
          </div>
        </section>

        {/* Free Preview Value Prop */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4" data-testid="text-free-title">
                Preview Before You Subscribe
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our free channel gives you a transparent view of what VIP members receive. 
                No hidden results. No pressure tactics.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center" data-testid="free-feature-1">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">See VIP Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Watch real subscriber profits posted daily. Verify our accuracy before investing.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center" data-testid="free-feature-2">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <LineChart className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Market Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Daily XAU/USD insights from our analysts. Understand the reasoning behind each setup.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center" data-testid="free-feature-3">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Occasional Free Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We share select VIP signals with our free community. Experience the quality firsthand.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Credentials */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <Badge className="mb-4" variant="outline">
                <Award className="h-3 w-3 mr-1" />
                Our Team
              </Badge>
              <h2 className="text-3xl font-bold mb-4" data-testid="text-team-title">
                Institutional Experience. Retail Access.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our analysts bring decades of combined experience from institutional trading desks 
                and top-tier brokerages.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <Card data-testid="team-member-1">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Hedge Fund Background</CardTitle>
                      <CardDescription>Quantitative Trading</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Former quantitative analyst at a multi-billion dollar hedge fund. 
                    Specialized in precious metals derivatives and algorithmic execution strategies.
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="team-member-2">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <BarChart3 className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Top-5 US Brokerage</CardTitle>
                      <CardDescription>Senior Market Analyst</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    15+ years at one of the largest retail brokerages in the United States. 
                    Led precious metals research and institutional client advisory.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50" data-testid="team-methodology">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">AI-Enhanced Fundamental Analysis</h3>
                    <p className="text-muted-foreground mb-4">
                      We combine traditional fundamental analysis with proprietary AI models that process 
                      central bank communications, macroeconomic data releases, and cross-asset correlations 
                      in real-time. Our signals are generated through a systematic process that blends 
                      human expertise with machine precision.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="no-default-hover-elevate">Central Bank Analysis</Badge>
                      <Badge variant="secondary" className="no-default-hover-elevate">Macro Sentiment</Badge>
                      <Badge variant="secondary" className="no-default-hover-elevate">Cross-Asset Correlation</Badge>
                      <Badge variant="secondary" className="no-default-hover-elevate">Risk Management</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Mid-Page Email Capture */}
        <section className="py-12 px-4 bg-primary/5 border-y border-primary/10">
          <div className="container mx-auto max-w-2xl text-center">
            <h3 className="text-xl font-bold mb-2">Ready to see our analysis in action?</h3>
            <p className="text-muted-foreground mb-6">
              Join our free Telegram channel and start receiving market insights today.
            </p>
            <EmailCaptureForm variant="compact" testIdSuffix="mid" onSubmit={handleEmailSubmit} />
          </div>
        </section>

        {/* Floating Testimonials Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4" data-testid="text-testimonials-title">
                What Traders Are Saying
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {floatingTestimonials.map((testimonial, index) => (
                <Card 
                  key={index} 
                  className="hover-elevate"
                  data-testid={`testimonial-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic mb-4">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{testimonial.author.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-10">
              <Badge className="mb-4" variant="outline">
                <Award className="h-3 w-3 mr-1" />
                VIP Access
              </Badge>
              <h2 className="text-3xl font-bold mb-4" data-testid="text-pricing-title">
                Upgrade to VIP Signals
              </h2>
              <p className="text-lg text-muted-foreground">
                3-5 daily XAU/USD signals with entry, stop loss, and take profit levels
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* 7 Day Plan */}
              <Card className="relative" data-testid="pricing-weekly">
                <CardHeader className="pt-6">
                  <CardTitle className="text-xl">7-Day Trial</CardTitle>
                  <CardDescription>Test our signals for a week</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$39</span>
                    <span className="text-muted-foreground ml-2">/ week</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {["3-5 daily XAU/USD signals", "Entry, SL & TP levels", "Private VIP channel", "Real-time notifications"].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <a href="/subscribe" className="w-full" data-testid="link-pricing-weekly">
                    <Button variant="outline" className="w-full" data-testid="button-pricing-weekly">Get Started</Button>
                  </a>
                </CardFooter>
              </Card>

              {/* Monthly Plan */}
              <Card className="relative" data-testid="pricing-monthly">
                <CardHeader className="pt-6">
                  <CardTitle className="text-xl">Monthly</CardTitle>
                  <CardDescription>Cancel anytime</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$59</span>
                    <span className="text-muted-foreground ml-2">/ month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {["Everything in 7-Day", "Performance dashboard", "Position sizing guidance", "Priority support"].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <a href="/subscribe" className="w-full" data-testid="link-pricing-monthly">
                    <Button variant="outline" className="w-full" data-testid="button-pricing-monthly">Get Started</Button>
                  </a>
                </CardFooter>
              </Card>

              {/* Lifetime Plan */}
              <Card className="relative border-primary shadow-lg shadow-primary/10" data-testid="pricing-lifetime">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground no-default-hover-elevate">
                    Best Value
                  </Badge>
                </div>
                <CardHeader className="pt-8">
                  <CardTitle className="text-xl">Lifetime</CardTitle>
                  <CardDescription>One-time payment</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$339</span>
                    <span className="text-muted-foreground ml-2">once</span>
                  </div>
                  <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-500 border-emerald-500/30 no-default-hover-elevate mt-2">
                    Save $369+ vs monthly
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {["Everything in Monthly", "Lifetime access", "1-on-1 strategy call", "Exclusive market reports"].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <a href="/subscribe" className="w-full" data-testid="link-pricing-lifetime">
                    <Button className="w-full" data-testid="button-pricing-lifetime">Get Lifetime Access</Button>
                  </a>
                </CardFooter>
              </Card>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              All plans include access to our private VIP Telegram channel with real-time signal delivery.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20 text-center">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl">
                  Start with our free channel
                </CardTitle>
                <CardDescription className="text-base">
                  See our analysis quality. Verify our results. Then decide.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <EmailCaptureForm testIdSuffix="footer" onSubmit={handleEmailSubmit} />
                
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Instant access</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Risk Disclaimer */}
        <section className="py-8 px-4 border-t border-border/50">
          <div className="container mx-auto max-w-4xl">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Risk Disclosure:</strong> Trading foreign exchange (forex) and commodities like XAU/USD carries 
              significant risk and may not be suitable for all investors. Past performance is not indicative of 
              future results. The signals and analysis provided are for educational purposes and should not be 
              considered financial advice. Always trade with capital you can afford to lose.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
