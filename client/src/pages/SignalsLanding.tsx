import { useState } from "react";
import { Check, TrendingUp, Users, Award, Shield, Zap, Clock, Target, ArrowRight, Star, Mail, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SignalsLanding() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const stats = [
    { label: "Win Rate", value: "87.5%", icon: TrendingUp },
    { label: "Active Traders", value: "4,821", icon: Users },
    { label: "Signals Sent", value: "12,450+", icon: Target },
    { label: "Avg Monthly Pips", value: "+1,250", icon: Award }
  ];

  const testimonials = [
    {
      name: "Marcus Rodriguez",
      role: "Full-time Trader",
      image: "https://ui-avatars.com/api/?name=Marcus+Rodriguez&background=8b5cf6&color=fff&size=80",
      content: "I went from losing trades to consistent profits. The signals are incredibly accurate and the risk management advice is gold.",
      rating: 5,
      profit: "+$12,450"
    },
    {
      name: "Sarah Chen",
      role: "Part-time Trader",
      image: "https://ui-avatars.com/api/?name=Sarah+Chen&background=8b5cf6&color=fff&size=80",
      content: "Best investment I've made. Even with my full-time job, I can follow the signals and make consistent profits.",
      rating: 5,
      profit: "+$8,200"
    },
    {
      name: "David Thompson",
      role: "Beginner Trader",
      image: "https://ui-avatars.com/api/?name=David+Thompson&background=8b5cf6&color=fff&size=80",
      content: "Started with zero experience. The team's guidance and clear signals helped me make my first $5k in 2 months!",
      rating: 5,
      profit: "+$5,100"
    }
  ];

  const features = [
    {
      icon: Target,
      title: "Daily Market Analysis",
      description: "Receive expert analysis on XAU/USD (Gold) with clear market insights and trade opportunities"
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Learn proper position sizing and risk-reward strategies to protect your trading capital"
    },
    {
      icon: Zap,
      title: "Instant Telegram Access",
      description: "Join our free public channel and get real-time market updates delivered straight to your phone"
    },
    {
      icon: Clock,
      title: "Educational Resources",
      description: "Access trading guides, video tutorials, and educational content to improve your skills"
    }
  ];

  const recentWins = [
    { pair: "XAU/USD", entry: "2,625", exit: "2,645", pips: "+200", profit: "+$4,000", date: "2 hours ago" },
    { pair: "XAU/USD", entry: "2,610", exit: "2,635", pips: "+250", profit: "+$5,000", date: "Yesterday" },
    { pair: "XAU/USD", entry: "2,595", exit: "2,615", pips: "+200", profit: "+$4,000", date: "2 days ago" },
    { pair: "XAU/USD", entry: "2,580", exit: "2,605", pips: "+250", profit: "+$5,000", date: "3 days ago" }
  ];

  const handleEmailSubmit = async (e: React.FormEvent) => {
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
        title: "Success!",
        description: response.message || "Check your email for next steps",
      });

      window.open(response.redirect_url, '_blank');

      setEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Free Forex Signals - Join 4,821+ Traders | EntryLab</title>
        <meta name="description" content="Get free daily XAU/USD (Gold) market analysis and trading insights. Join 4,821+ traders in our Telegram channel. Plus upgrade to premium signals with 87.5% win rate!" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section with Email Capture */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent glow-effect" />
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center space-y-8">
              <Badge className="mx-auto w-fit glow-badge" variant="outline" data-testid="badge-live">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                4,821 Active Traders • Join FREE
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent leading-tight animate-glow" data-testid="text-hero-title">
                Daily Gold Signals<br />Straight to Your Phone
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-hero-subtitle">
                Join our <span className="text-primary font-semibold">FREE</span> Telegram channel for daily XAU/USD analysis. No credit card required.
              </p>

              {/* Email Capture Form */}
              <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-primary/30 glow-card">
                <CardContent className="p-8">
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                          data-testid="input-email"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="h-12 px-8 hover:scale-105 transition-transform"
                        disabled={isSubmitting}
                        data-testid="button-submit-email"
                      >
                        {isSubmitting ? "Joining..." : "Get Free Access"}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground text-left">
                      Join our free Telegram channel instantly. Plus get educational resources and market updates.
                    </p>
                  </form>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <a href="/subscribe" className="inline-block">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6" data-testid="button-upgrade-premium">
                    Upgrade to Premium Signals
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
                {stats.map((stat, index) => (
                  <Card key={index} className="bg-card/50 border-primary/20 hover-elevate" data-testid={`stat-${index}`}>
                    <CardContent className="p-6 text-center">
                      <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="text-3xl font-bold text-foreground counter-animation">{stat.value}</div>
                      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Recent Wins */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="outline">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live Results
              </Badge>
              <h2 className="text-4xl font-bold mb-4" data-testid="text-wins-title">Recent Winning Signals</h2>
              <p className="text-xl text-muted-foreground">Real trades from our premium channel</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {recentWins.map((trade, index) => (
                <Card key={index} className="bg-card/80 hover-elevate" data-testid={`win-${index}`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 gap-4">
                    <CardTitle className="text-2xl font-bold">{trade.pair}</CardTitle>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 no-default-hover-elevate">
                      {trade.pips}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Entry</p>
                        <p className="text-lg font-semibold">{trade.entry}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Exit</p>
                        <p className="text-lg font-semibold text-emerald-500">{trade.exit}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{trade.date}</span>
                      <span className="font-bold text-emerald-500 text-lg">{trade.profit}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <a href="/subscribe">
                <Button size="lg" data-testid="button-get-premium">
                  Get Premium Signals
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" data-testid="text-features-title">What You Get For Free</h2>
              <p className="text-xl text-muted-foreground">Everything you need to start your trading journey</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover-elevate text-center" data-testid={`feature-${index}`}>
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof - Testimonials */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" data-testid="text-testimonials-title">Trusted by Traders Worldwide</h2>
              <p className="text-xl text-muted-foreground">See what our members are saying</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="hover-elevate" data-testid={`testimonial-${index}`}>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-md" />
                      <div>
                        <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                        <CardDescription>{testimonial.role}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                  </CardContent>
                  <CardFooter>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 no-default-hover-elevate">
                      {testimonial.profit} profit
                    </Badge>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Premium Pricing Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="outline">
                <Award className="h-3 w-3 mr-1" />
                Premium Plans
              </Badge>
              <h2 className="text-4xl font-bold mb-4" data-testid="text-pricing-title">Upgrade to Premium Signals</h2>
              <p className="text-xl text-muted-foreground">Get 3-5 daily premium signals with 87.5% win rate</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* 7 Day Plan */}
              <Card className="relative hover-elevate" data-testid="pricing-weekly">
                <CardHeader className="pt-6">
                  <CardTitle className="text-2xl">7 Day VIP</CardTitle>
                  <CardDescription>Try our signals for a week</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$39</span>
                    <span className="text-muted-foreground ml-2">per week</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {["3-5 daily premium signals", "Full trade analysis", "Stop loss & take profit", "Private VIP channel", "24/7 support"].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <a href="/subscribe" className="w-full">
                    <Button variant="outline" className="w-full">Get Started</Button>
                  </a>
                </CardFooter>
              </Card>

              {/* Monthly Plan */}
              <Card className="relative hover-elevate" data-testid="pricing-monthly">
                <CardHeader className="pt-6">
                  <CardTitle className="text-2xl">Monthly VIP</CardTitle>
                  <CardDescription>Most flexible option</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$59</span>
                    <span className="text-muted-foreground ml-2">per month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {["3-5 daily premium signals", "Full trade analysis", "Stop loss & take profit", "Position sizing advice", "Private VIP channel", "Performance dashboard"].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <a href="/subscribe" className="w-full">
                    <Button variant="outline" className="w-full">Get Started</Button>
                  </a>
                </CardFooter>
              </Card>

              {/* Lifetime Plan */}
              <Card className="relative border-primary shadow-lg shadow-primary/20 hover-elevate" data-testid="pricing-lifetime">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground no-default-hover-elevate">
                    <Star className="h-3 w-3 mr-1" />
                    Best Value
                  </Badge>
                </div>
                <CardHeader className="pt-8">
                  <CardTitle className="text-2xl">Lifetime VIP</CardTitle>
                  <CardDescription>Pay once, access forever</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$339</span>
                    <span className="text-muted-foreground ml-2">one-time</span>
                  </div>
                  <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-500 border-emerald-500/30 no-default-hover-elevate mt-2">
                    Save $369+
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {["Everything in Monthly", "Pay once, access forever", "Priority signal delivery", "1-on-1 strategy sessions", "Exclusive market reports", "Trading psychology course"].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <a href="/subscribe" className="w-full">
                    <Button className="w-full">Get Lifetime Access</Button>
                  </a>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-primary/20 to-background border-primary/30 text-center p-8 md:p-12 glow-card">
              <CardHeader>
                <CardTitle className="text-3xl md:text-4xl mb-4">Ready to Start Trading Gold?</CardTitle>
                <CardDescription className="text-base md:text-lg">
                  Join 4,821+ traders getting free daily analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center gap-2 flex-wrap">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                  ))}
                  <span className="ml-2 text-muted-foreground">(4.9/5 from 1,200+ reviews)</span>
                </div>
                
                <form onSubmit={handleEmailSubmit} className="max-w-lg mx-auto">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 text-base"
                        disabled={isSubmitting}
                        required
                        data-testid="input-email-footer"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="h-12 px-8"
                      disabled={isSubmitting}
                      data-testid="button-submit-email-footer"
                    >
                      Get Free Access
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </form>

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
                    <Target className="h-4 w-4 text-primary" />
                    <span>Free forever</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
