import { Check, TrendingUp, Users, Award, Shield, Zap, Clock, Target, ArrowRight, Star, ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

export default function SignalsLanding() {
  const stats = [
    { label: "Win Rate", value: "87.5%", icon: TrendingUp },
    { label: "Active Members", value: "4,821", icon: Users },
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
      title: "Daily Premium Signals",
      description: "3-5 high-probability trade setups delivered daily with precise entry, stop loss, and take profit levels"
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Every signal includes position sizing recommendations and risk-reward ratios to protect your capital"
    },
    {
      icon: Zap,
      title: "Real-time Alerts",
      description: "Instant notifications via Telegram so you never miss a profitable opportunity"
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Professional analysts available around the clock to answer questions and provide market insights"
    }
  ];

  const recentWins = [
    { pair: "EUR/USD", entry: "1.0850", exit: "1.0920", pips: "+70", profit: "+$1,400", date: "2 hours ago" },
    { pair: "GBP/JPY", entry: "188.50", exit: "189.80", pips: "+130", profit: "+$2,600", date: "5 hours ago" },
    { pair: "GOLD", entry: "2,625", exit: "2,645", pips: "+200", profit: "+$4,000", date: "Yesterday" },
    { pair: "EUR/GBP", entry: "0.8520", exit: "0.8580", pips: "+60", profit: "+$1,200", date: "Yesterday" }
  ];

  const pricingTiers = [
    {
      name: "Starter",
      price: "$0",
      period: "7-day trial",
      description: "Try our signals risk-free",
      features: [
        "2-3 signals per week",
        "Basic trade setups",
        "Telegram group access",
        "Educational resources"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Premium",
      price: "$97",
      period: "per month",
      description: "Best for serious traders",
      features: [
        "3-5 daily signals",
        "Full trade analysis",
        "Priority support",
        "Risk management guide",
        "Market updates",
        "Performance dashboard"
      ],
      cta: "Get Premium",
      popular: true
    },
    {
      name: "VIP",
      price: "$197",
      period: "per month",
      description: "For professional traders",
      features: [
        "Everything in Premium",
        "5-8 daily signals",
        "1-on-1 analyst sessions",
        "Custom trade plans",
        "Priority signal delivery",
        "Private VIP group",
        "Lifetime access"
      ],
      cta: "Join VIP",
      popular: false
    }
  ];

  const faqs = [
    {
      question: "How accurate are your signals?",
      answer: "Our signals maintain an 87.5% win rate over the past 12 months. We provide full transparency with detailed performance reports available to all members."
    },
    {
      question: "What pairs do you trade?",
      answer: "We cover major forex pairs (EUR/USD, GBP/USD, USD/JPY), commodities (Gold, Silver, Oil), and select crypto pairs. Each signal includes complete trade setup details."
    },
    {
      question: "Do I need trading experience?",
      answer: "No! We provide clear instructions with every signal. Our educational resources and support team help beginners learn while earning."
    },
    {
      question: "How are signals delivered?",
      answer: "Signals are sent instantly via Telegram with push notifications. You'll receive entry price, stop loss, take profit targets, and risk management guidance."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Absolutely. No contracts or commitments. You can cancel your subscription at any time with one click."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Premium Forex Signals - 87.5% Win Rate | EntryLab Signals</title>
        <meta name="description" content="Join 4,821+ traders profiting with our premium forex signals. 87.5% win rate, daily setups, risk management included. Start your 7-day free trial today!" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center space-y-8">
              <Badge className="mx-auto w-fit" variant="outline" data-testid="badge-live">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                4,821 Active Members Trading Live
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent leading-tight" data-testid="text-hero-title">
                Stop Guessing.<br />Start Winning.
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-hero-subtitle">
                Join elite traders receiving <span className="text-primary font-semibold">87.5% accurate</span> forex signals with complete trade setups delivered daily to your phone
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="text-lg px-8 py-6 hover:scale-105 transition-transform" data-testid="button-cta-primary">
                  Start Free 7-Day Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" data-testid="button-view-signals">
                  View Recent Wins
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                No credit card required • Cancel anytime • Join 4,821+ profitable traders
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
                {stats.map((stat, index) => (
                  <Card key={index} className="bg-card/50 border-primary/20" data-testid={`stat-${index}`}>
                    <CardContent className="p-6 text-center">
                      <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                      <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full" />
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
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                      {testimonial.profit} profit
                    </Badge>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" data-testid="text-features-title">Everything You Need to Succeed</h2>
              <p className="text-xl text-muted-foreground">Professional trading signals with complete support</p>
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

        {/* Recent Wins */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="outline">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live Results
              </Badge>
              <h2 className="text-4xl font-bold mb-4" data-testid="text-wins-title">Recent Winning Signals</h2>
              <p className="text-xl text-muted-foreground">Real trades, real profits</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {recentWins.map((trade, index) => (
                <Card key={index} className="bg-card/80" data-testid={`win-${index}`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-2xl font-bold">{trade.pair}</CardTitle>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
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
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" data-testid="text-pricing-title">Choose Your Plan</h2>
              <p className="text-xl text-muted-foreground">Start free, upgrade when ready</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {pricingTiers.map((tier, index) => (
                <Card key={index} className={`relative ${tier.popular ? 'border-primary shadow-lg shadow-primary/20' : ''}`} data-testid={`pricing-${index}`}>
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground ml-2">{tier.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant={tier.popular ? "default" : "outline"} size="lg" data-testid={`button-pricing-${tier.name.toLowerCase()}`}>
                      {tier.cta}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" data-testid="text-faq-title">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} data-testid={`faq-${index}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-primary/20 to-background border-primary/30 text-center p-12">
              <CardHeader>
                <CardTitle className="text-4xl mb-4">Ready to Transform Your Trading?</CardTitle>
                <CardDescription className="text-lg">
                  Join 4,821+ traders already profiting with our signals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                  ))}
                  <span className="ml-2 text-muted-foreground">(4.9/5 from 1,200+ reviews)</span>
                </div>
                <Button size="lg" className="text-lg px-12 py-6 hover:scale-105 transition-transform" data-testid="button-cta-final">
                  Start Free 7-Day Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Instant access</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="h-4 w-4 text-primary" />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-primary" />
                    <span>Cancel anytime</span>
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
