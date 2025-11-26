import { useState, useEffect } from "react";
import { Check, TrendingUp, Users, Award, Shield, Zap, Clock, Target, ArrowRight, Star, Mail, Sparkles, Lock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const { toast } = useToast();

  // Validate Stripe price IDs are configured
  const monthlyPriceId = import.meta.env.VITE_STRIPE_PRICE_MONTHLY;
  const yearlyPriceId = import.meta.env.VITE_STRIPE_PRICE_YEARLY;

  if (!monthlyPriceId || !yearlyPriceId) {
    console.error('Stripe price IDs not configured. Check VITE_STRIPE_PRICE_MONTHLY and VITE_STRIPE_PRICE_YEARLY environment variables.');
  }

  const pricingTiers = [
    {
      id: 'monthly',
      name: "Monthly",
      price: "$49",
      period: "per month",
      priceId: monthlyPriceId || '',
      description: "Perfect for testing our premium signals",
      totalPerYear: "$588",
      savings: null,
      features: [
        "3-5 daily premium signals",
        "Full trade analysis with entry/exit",
        "Stop loss & take profit levels",
        "Risk management guidance",
        "Position sizing recommendations",
        "Real-time Telegram notifications",
        "Private VIP channel access",
        "24/7 analyst support",
        "Performance tracking dashboard"
      ],
      popular: false
    },
    {
      id: 'yearly',
      name: "Yearly",
      price: "$319",
      period: "per year",
      priceId: yearlyPriceId || '',
      description: "Best value - save $269 per year!",
      totalPerYear: "$319",
      savings: "$269",
      savingsPercentage: "46%",
      features: [
        "Everything in Monthly plan",
        "Save $269 per year (46% off)",
        "Priority signal delivery",
        "Exclusive market reports",
        "Advanced technical analysis",
        "1-on-1 strategy sessions (quarterly)",
        "Lifetime price lock guarantee",
        "Trading psychology course",
        "Custom trade plan assistance"
      ],
      popular: true
    }
  ];

  const comparisonFeatures = [
    { name: "Daily Premium Signals", free: "❌", monthly: "3-5 signals", yearly: "3-5 signals" },
    { name: "Trade Analysis", free: "Basic", monthly: "✅ Full", yearly: "✅ Full + Priority" },
    { name: "Risk Management", free: "❌", monthly: "✅", yearly: "✅" },
    { name: "Telegram Alerts", free: "Public channel", monthly: "Private VIP", yearly: "Private VIP + Priority" },
    { name: "Analyst Support", free: "❌", monthly: "24/7", yearly: "24/7 + 1-on-1 Sessions" },
    { name: "Performance Dashboard", free: "❌", monthly: "✅", yearly: "✅ + Advanced Analytics" },
    { name: "Market Reports", free: "❌", monthly: "Weekly", yearly: "Daily + Exclusive" },
    { name: "Price Per Month", free: "$0", monthly: "$49", yearly: "$26.58" },
  ];

  const faqs = [
    {
      question: "How do I receive the signals?",
      answer: "After subscribing, you'll receive an email with instructions to join our private Telegram channel. All signals are delivered instantly via Telegram notifications, so you never miss a trade opportunity."
    },
    {
      question: "What's your win rate?",
      answer: "Our signals maintain an 87.5% win rate over the past 12 months. We provide full transparency with monthly performance reports and real-time trade tracking for all members."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Absolutely! You can cancel at any time with no penalties or commitments. If you cancel, you'll continue to have access until the end of your current billing period."
    },
    {
      question: "What pairs do you trade?",
      answer: "We primarily focus on XAU/USD (Gold) for our premium signals. Our analysis includes multiple timeframes, key support/resistance levels, and clear entry/exit strategies for every signal."
    },
    {
      question: "Do I need experience to follow your signals?",
      answer: "No! Each signal includes complete instructions with entry price, stop loss, take profit targets, and risk management guidance. Our support team is available 24/7 to help beginners learn as they trade."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit and debit cards through Stripe, our secure payment processor. Your payment information is encrypted and never stored on our servers."
    },
    {
      question: "Is there a refund policy?",
      answer: "Yes! We offer a 7-day money-back guarantee. If you're not satisfied with our signals within the first 7 days, contact support for a full refund, no questions asked."
    },
    {
      question: "What's the difference between monthly and yearly?",
      answer: "The yearly plan saves you $269 (46% off) and includes priority signal delivery, exclusive market reports, quarterly 1-on-1 strategy sessions, and a lifetime price lock guarantee."
    }
  ];

  const stats = [
    { label: "Win Rate", value: "87.5%", icon: TrendingUp },
    { label: "Active Members", value: "4,821", icon: Users },
    { label: "Avg Monthly ROI", value: "18.5%", icon: Award },
    { label: "Signals Sent", value: "12,450+", icon: Target }
  ];

  const handleCheckout = async (e: React.FormEvent) => {
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

    const selectedTier = pricingTiers.find(t => t.id === selectedPlan);
    if (!selectedTier) {
      toast({
        title: "Error",
        description: "Please select a pricing plan",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Validate price ID is configured
    if (!selectedTier.priceId) {
      toast({
        title: "Configuration Error",
        description: "Stripe pricing is not configured. Please contact support.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      console.error('Stripe price ID missing for plan:', selectedPlan);
      return;
    }

    try {
      const res = await apiRequest(
        'POST',
        '/api/create-checkout-session',
        {
          email,
          priceId: selectedTier.priceId
        }
      );

      const response = await res.json() as { checkout_url: string };

      console.log('Checkout URL received:', response.checkout_url);

      if (!response.checkout_url) {
        throw new Error('No checkout URL received from server');
      }

      // Redirect to Stripe checkout
      console.log('Redirecting to Stripe checkout...');
      window.location.href = response.checkout_url;

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Premium Forex Signals - Subscribe Now | EntryLab</title>
        <meta name="description" content="Get premium XAU/USD signals with 87.5% win rate. $49/month or save 46% with yearly plan at $319/year. Join 4,821+ profitable traders today!" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent glow-effect" />
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center space-y-6 mb-12">
              <Badge className="mx-auto w-fit glow-badge" variant="outline" data-testid="badge-premium">
                <Sparkles className="w-3 h-3 mr-2" />
                Premium Forex Signals
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent leading-tight animate-glow" data-testid="text-hero-title">
                Trade Like a Pro<br />Win Like a Champion
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-hero-subtitle">
                Join <span className="text-primary font-semibold">4,821+ traders</span> receiving daily premium signals with <span className="text-primary font-semibold">87.5% accuracy</span>
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto">
                {stats.map((stat, index) => (
                  <Card key={index} className="bg-card/50 border-primary/20 hover-elevate" data-testid={`stat-${index}`}>
                    <CardContent className="p-4 text-center">
                      <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold text-foreground counter-animation">{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" data-testid="text-pricing-title">Choose Your Plan</h2>
              <p className="text-xl text-muted-foreground">Cancel anytime • 7-day money-back guarantee</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {pricingTiers.map((tier) => (
                <Card 
                  key={tier.id} 
                  className={`relative ${tier.popular ? 'border-primary shadow-lg shadow-primary/20 scale-105' : ''} hover-elevate cursor-pointer transition-all`}
                  onClick={() => setSelectedPlan(tier.id as 'monthly' | 'yearly')}
                  data-testid={`pricing-${tier.id}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground glow-badge no-default-hover-elevate">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Best Value - Save {tier.savingsPercentage}
                      </Badge>
                    </div>
                  )}

                  <div className="absolute top-4 right-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === tier.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                      {selectedPlan === tier.id && <Check className="h-4 w-4 text-primary-foreground" />}
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-3xl">{tier.name}</CardTitle>
                    <CardDescription className="text-base">{tier.description}</CardDescription>
                    <div className="mt-6 space-y-2">
                      <div>
                        <span className="text-5xl font-bold">{tier.price}</span>
                        <span className="text-muted-foreground ml-2 text-lg">{tier.period}</span>
                      </div>
                      {tier.savings && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 no-default-hover-elevate">
                            Save {tier.savings}
                          </Badge>
                          <span className="text-sm text-muted-foreground">vs monthly billing</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Checkout Form */}
            <Card className="max-w-2xl mx-auto mt-12 bg-card/80 backdrop-blur-sm border-primary/30 glow-card">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Complete Your Subscription</CardTitle>
                <CardDescription className="text-center">
                  {pricingTiers.find(t => t.id === selectedPlan)?.name} Plan Selected
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCheckout} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 text-base"
                        disabled={isSubmitting}
                        required
                        data-testid="input-email"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You'll receive channel access instructions at this email
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-md p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">{pricingTiers.find(t => t.id === selectedPlan)?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Billing</span>
                      <span className="font-medium">{pricingTiers.find(t => t.id === selectedPlan)?.period}</span>
                    </div>
                    {pricingTiers.find(t => t.id === selectedPlan)?.savings && (
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-500">Savings</span>
                        <span className="font-medium text-emerald-500">{pricingTiers.find(t => t.id === selectedPlan)?.savings}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-primary">{pricingTiers.find(t => t.id === selectedPlan)?.price}</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full h-14 text-lg hover:scale-105 transition-transform"
                    disabled={isSubmitting}
                    data-testid="button-checkout"
                  >
                    {isSubmitting ? "Redirecting to Checkout..." : "Proceed to Secure Checkout"}
                    <Lock className="ml-2 h-5 w-5" />
                  </Button>

                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-primary" />
                      <span>Instant Access</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4 text-primary" />
                      <span>Cancel Anytime</span>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" data-testid="text-comparison-title">Compare Plans</h2>
              <p className="text-xl text-muted-foreground">See what's included in each tier</p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-semibold">Feature</th>
                        <th className="text-center p-4 font-semibold">Free</th>
                        <th className="text-center p-4 font-semibold">Monthly</th>
                        <th className="text-center p-4 font-semibold bg-primary/5">Yearly</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonFeatures.map((feature, index) => (
                        <tr key={index} className="border-b border-border last:border-b-0">
                          <td className="p-4 text-sm font-medium">{feature.name}</td>
                          <td className="p-4 text-center text-sm text-muted-foreground">{feature.free}</td>
                          <td className="p-4 text-center text-sm">{feature.monthly}</td>
                          <td className="p-4 text-center text-sm bg-primary/5 font-medium">{feature.yearly}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" data-testid="text-faq-title">Frequently Asked Questions</h2>
              <p className="text-xl text-muted-foreground">Everything you need to know</p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-md px-6 bg-card" data-testid={`faq-${index}`}>
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-primary/20 to-background border-primary/30 text-center p-8 md:p-12 glow-card">
              <CardHeader>
                <CardTitle className="text-3xl md:text-4xl mb-4">Ready to Transform Your Trading?</CardTitle>
                <CardDescription className="text-base md:text-lg">
                  Join 4,821+ traders profiting with our signals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center gap-2 flex-wrap">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                  ))}
                  <span className="ml-2 text-muted-foreground">(4.9/5 from 1,200+ reviews)</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="#pricing" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <Button size="lg" className="text-lg px-12 py-6 hover:scale-105 transition-transform" data-testid="button-cta-final">
                      Get Premium Signals Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </a>
                </div>

                <p className="text-sm text-muted-foreground">
                  7-day money-back guarantee • Cancel anytime • Instant access
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
