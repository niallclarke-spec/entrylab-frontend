import { useState, useEffect } from "react";
import { Check, TrendingUp, Users, Award, Shield, Zap, Clock, Target, ArrowRight, Star, Mail, Sparkles, Lock, ChevronDown, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "wouter";
import { SiTelegram } from "react-icons/si";

export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'lifetime'>('lifetime');
  const { toast } = useToast();

  // Stripe price IDs with hardcoded fallbacks for VPS deployment
  const weeklyPriceId = import.meta.env.VITE_STRIPE_PRICE_WEEKLY || 'price_1SXsUsQfYsmULFjZ8j30ywSj';
  const monthlyPriceId = import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_1SXsTHQfYsmULFjZV0BcgYBu';
  const lifetimePriceId = import.meta.env.VITE_STRIPE_PRICE_LIFETIME || 'price_1SXsUBQfYsmULFjZxUgeTg5m';

  const pricingTiers = [
    {
      id: 'weekly',
      name: "7 Day VIP",
      price: "$39",
      period: "per week",
      priceId: weeklyPriceId || '',
      description: "Perfect to test our signals",
      billingType: "recurring",
      tryNow: true,
      features: [
        "3-5 daily premium signals",
        "Full trade analysis with entry/exit",
        "Stop loss & take profit levels",
        "Risk management guidance",
        "Real-time Telegram notifications",
        "Private VIP channel access",
        "24/7 analyst support"
      ],
      popular: false
    },
    {
      id: 'monthly',
      name: "Monthly VIP",
      price: "$59",
      period: "per month",
      priceId: monthlyPriceId || '',
      description: "Most flexible option",
      billingType: "recurring",
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
      id: 'lifetime',
      name: "Lifetime VIP",
      price: "$339",
      period: "one-time",
      priceId: lifetimePriceId || '',
      description: "Best value - pay once, access forever!",
      billingType: "one_time",
      savings: "Save $369+",
      savingsNote: "vs 6 months of monthly",
      features: [
        "Everything in Monthly plan",
        "Pay once, access forever",
        "Priority signal delivery",
        "Exclusive market reports",
        "Advanced technical analysis",
        "1-on-1 strategy sessions",
        "Never pay again guarantee",
        "Trading psychology course",
        "Custom trade plan assistance"
      ],
      popular: true
    }
  ];

  const comparisonFeatures = [
    { name: "Daily Premium Signals", weekly: "3-5 signals", monthly: "3-5 signals", lifetime: "3-5 signals" },
    { name: "Trade Analysis", weekly: "Full", monthly: "Full", lifetime: "Full + Priority" },
    { name: "Risk Management", weekly: "✅", monthly: "✅", lifetime: "✅" },
    { name: "Telegram Alerts", weekly: "Private VIP", monthly: "Private VIP", lifetime: "Private VIP + Priority" },
    { name: "Analyst Support", weekly: "24/7", monthly: "24/7", lifetime: "24/7 + 1-on-1 Sessions" },
    { name: "Performance Dashboard", weekly: "✅", monthly: "✅", lifetime: "✅ + Advanced" },
    { name: "Market Reports", weekly: "Weekly", monthly: "Weekly", lifetime: "Daily + Exclusive" },
    { name: "Billing", weekly: "$39/week", monthly: "$59/month", lifetime: "$339 once" },
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
      question: "What's the difference between the plans?",
      answer: "The 7 Day plan ($39/week) is perfect for trying our signals. The Monthly plan ($59/month) offers flexibility with full features. The Lifetime plan ($339 one-time) is the best value - pay once and get access forever with premium perks like priority delivery and 1-on-1 sessions."
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
    <div className="signals-page relative overflow-hidden">
      <Helmet>
        <title>Premium VIP Signals - Subscribe Now | EntryLab</title>
        <meta name="description" content="Get premium XAU/USD signals with 87.5% win rate. $39/week trial or lifetime access at $339. Join 4,821+ profitable traders today!" />
      </Helmet>

      {/* Background Orbs */}
      <div className="signals-bg-orb signals-bg-orb-1" />
      <div className="signals-bg-orb signals-bg-orb-2" />
      <div className="signals-bg-orb signals-bg-orb-3" />

      {/* Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" data-testid="link-home">
            <div className="w-8 h-8 bg-[#2bb32a] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">EntryLab</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[#adb2b1]">
            <Link href="/signals" className="hover:text-white transition-colors" data-testid="link-nav-signals">Free Signals</Link>
            <a href="#pricing" className="hover:text-white transition-colors" data-testid="link-nav-pricing">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors" data-testid="link-nav-faq">FAQ</a>
          </div>
          <Link href="/signals" className="signals-btn-outline hidden sm:inline-flex" data-testid="link-free-signals">
            Free Channel
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 md:pt-16 md:pb-24">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2bb32a]/10 border border-[#2bb32a]/30">
            <Sparkles className="w-4 h-4 text-[#2bb32a]" />
            <span className="text-[#2bb32a] text-sm font-medium">VIP Premium Signals</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight" data-testid="text-hero-title">
            Unlock{" "}
            <span className="signals-gradient-text">Premium</span>{" "}
            Trading Signals
          </h1>

          <p className="text-lg md:text-xl text-[#adb2b1] max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
            Join <span className="text-[#2bb32a] font-semibold">4,821+ traders</span> receiving institutional-grade signals with <span className="text-[#2bb32a] font-semibold">87.5% accuracy</span>
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="signals-glass-card p-4 text-center" data-testid={`stat-${index}`}>
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-[#2bb32a]" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-[#adb2b1] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 Day Trial CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="signals-glass-card-solid p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-[#2bb32a]/20 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-[#2bb32a]" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-2">Not Sure? Try Us for 7 Days!</h3>
              <p className="text-[#adb2b1] mb-3">
                Start with our 7 Day VIP plan for just <span className="text-[#2bb32a] font-semibold">$39</span>. 
                Experience our premium signals, see real results, and decide if we're right for you.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                <div className="flex items-center gap-1 text-white">
                  <Check className="h-4 w-4 text-[#2bb32a]" />
                  <span>Full VIP access</span>
                </div>
                <div className="flex items-center gap-1 text-white">
                  <Check className="h-4 w-4 text-[#2bb32a]" />
                  <span>3-5 daily signals</span>
                </div>
                <div className="flex items-center gap-1 text-white">
                  <Check className="h-4 w-4 text-[#2bb32a]" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button 
                className="signals-btn-primary"
                onClick={() => {
                  setSelectedPlan('weekly');
                  document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                data-testid="button-try-7day"
              >
                Try 7 Days - $39
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Bento Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2bb32a]/10 border border-[#2bb32a]/30 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#2bb32a]" />
            <span className="text-[#2bb32a] text-sm font-medium">How It Works</span>
            <span className="w-2 h-2 rounded-full bg-[#2bb32a]" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-how-it-works-title">
            Get VIP Access in Minutes
          </h2>
          <p className="text-lg text-[#adb2b1] max-w-2xl mx-auto">
            Everything you need to start receiving premium signals — all in one dashboard.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Step 1 - Choose Your Plan */}
          <div className="signals-glass-card overflow-hidden group" data-testid="step-choose-plan">
            <div className="bg-[#0d0f0e] p-6 min-h-[180px] flex items-center justify-center border-b border-[#2a3830]">
              <div className="flex gap-3">
                <div className="bg-[#1a2420] rounded-lg p-4 border border-[#3d544d] w-20 text-center">
                  <div className="text-xs text-[#adb2b1] mb-1">7 Day</div>
                  <div className="text-lg font-bold text-white">$39</div>
                </div>
                <div className="bg-[#1a2420] rounded-lg p-4 border border-[#3d544d] w-20 text-center">
                  <div className="text-xs text-[#adb2b1] mb-1">Monthly</div>
                  <div className="text-lg font-bold text-white">$59</div>
                </div>
                <div className="bg-[#2bb32a]/20 rounded-lg p-4 border border-[#2bb32a] w-20 text-center relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#2bb32a] rounded text-[8px] font-medium text-white">BEST</div>
                  <div className="text-xs text-[#2bb32a] mb-1">Lifetime</div>
                  <div className="text-lg font-bold text-white">$339</div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#2bb32a]/20 flex items-center justify-center text-[#2bb32a] font-bold text-sm">1</div>
                <h3 className="text-xl font-bold text-white">Choose Your Plan</h3>
              </div>
              <p className="text-[#adb2b1] leading-relaxed">
                Select from 7-day trial, monthly subscription, or lifetime access. Each plan includes full VIP channel access and premium signals.
              </p>
            </div>
          </div>

          {/* Step 2 - Complete Checkout */}
          <div className="signals-glass-card overflow-hidden group" data-testid="step-checkout">
            <div className="bg-[#0d0f0e] p-6 min-h-[180px] flex items-center justify-center border-b border-[#2a3830]">
              <div className="bg-[#1a2420] rounded-lg p-5 border border-[#3d544d] w-64">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-[#2bb32a]" />
                  <span className="text-xs text-[#adb2b1]">Secured by Stripe</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-[#2a3830] rounded w-full" />
                  <div className="flex gap-2">
                    <div className="h-3 bg-[#2a3830] rounded w-1/2" />
                    <div className="h-3 bg-[#2a3830] rounded w-1/2" />
                  </div>
                </div>
                <div className="mt-4 bg-[#2bb32a] rounded py-2 text-center">
                  <span className="text-white text-xs font-medium">Pay Securely</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#2bb32a]/20 flex items-center justify-center text-[#2bb32a] font-bold text-sm">2</div>
                <h3 className="text-xl font-bold text-white">Complete Checkout</h3>
              </div>
              <p className="text-[#adb2b1] leading-relaxed">
                Secure payment via Stripe. All major cards accepted. Your payment information is encrypted and never stored on our servers.
              </p>
            </div>
          </div>

          {/* Step 3 - Check Your Email */}
          <div className="signals-glass-card overflow-hidden group" data-testid="step-email">
            <div className="bg-[#0d0f0e] p-6 min-h-[180px] flex items-center justify-center border-b border-[#2a3830]">
              <div className="bg-[#1a2420] rounded-lg p-4 border border-[#3d544d] w-72">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#2bb32a]/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#2bb32a]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">EntryLab VIP Access</div>
                    <div className="text-xs text-[#adb2b1]">Just now</div>
                  </div>
                </div>
                <div className="text-xs text-[#adb2b1] leading-relaxed">
                  Welcome to EntryLab VIP! Click below to join your exclusive Telegram channel...
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="bg-[#229ED9]/20 rounded px-2 py-1 flex items-center gap-1">
                    <SiTelegram className="w-3 h-3 text-[#229ED9]" />
                    <span className="text-[10px] text-[#229ED9]">Join Channel</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#2bb32a]/20 flex items-center justify-center text-[#2bb32a] font-bold text-sm">3</div>
                <h3 className="text-xl font-bold text-white">Check Your Email</h3>
              </div>
              <p className="text-[#adb2b1] leading-relaxed">
                Receive your unique Telegram invite link instantly. Your welcome email includes everything you need to get started.
              </p>
            </div>
          </div>

          {/* Step 4 - Join VIP Channel */}
          <div className="signals-glass-card overflow-hidden group" data-testid="step-join">
            <div className="bg-[#0d0f0e] p-6 min-h-[180px] flex items-center justify-center border-b border-[#2a3830]">
              <div className="relative">
                <div className="bg-[#229ED9]/10 rounded-full p-6 border border-[#229ED9]/30">
                  <SiTelegram className="w-12 h-12 text-[#229ED9]" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#2bb32a] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs text-[#229ED9] font-medium bg-[#229ED9]/10 px-2 py-1 rounded">EntryLab VIP</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#2bb32a]/20 flex items-center justify-center text-[#2bb32a] font-bold text-sm">4</div>
                <h3 className="text-xl font-bold text-white">Join VIP Channel</h3>
              </div>
              <p className="text-[#adb2b1] leading-relaxed">
                Click the link, join the private channel, and start receiving premium XAU/USD signals with full trade analysis and support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section id="pricing" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-pricing-title">Choose Your Plan</h2>
          <p className="text-lg text-[#adb2b1]">Cancel anytime • 7-day money-back guarantee</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pricingTiers.map((tier) => (
            <div 
              key={tier.id} 
              className={`relative signals-glass-card p-6 cursor-pointer transition-all hover:border-[#2bb32a]/50 ${
                tier.popular ? 'border-[#2bb32a] md:scale-105 shadow-lg shadow-[#2bb32a]/20' : ''
              } ${tier.tryNow ? 'border-[#2bb32a]/50' : ''} ${
                selectedPlan === tier.id ? 'ring-2 ring-[#2bb32a]' : ''
              }`}
              onClick={() => setSelectedPlan(tier.id as 'weekly' | 'monthly' | 'lifetime')}
              data-testid={`pricing-${tier.id}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#2bb32a] text-white text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    Best Value
                  </span>
                </div>
              )}
              {tier.tryNow && !tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#2bb32a]/80 text-white text-xs font-medium">
                    <Zap className="h-3 w-3" />
                    Try Now
                  </span>
                </div>
              )}

              <div className="absolute top-4 right-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === tier.id ? 'border-[#2bb32a] bg-[#2bb32a]' : 'border-[#3d544d]'
                }`}>
                  {selectedPlan === tier.id && <Check className="h-4 w-4 text-white" />}
                </div>
              </div>

              <div className="pt-4 mb-4">
                <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                <p className="text-sm text-[#adb2b1]">{tier.description}</p>
                <div className="mt-4 space-y-2">
                  <div>
                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                    <span className="text-[#adb2b1] ml-2 text-base">{tier.period}</span>
                  </div>
                  {tier.savings && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex px-2 py-1 rounded bg-[#2bb32a]/20 text-[#2bb32a] text-xs font-medium border border-[#2bb32a]/30">
                        {tier.savings}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-2">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#2bb32a] flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-[#adb2b1]">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Checkout Form */}
        <div id="checkout-form" className="signals-glass-card-solid max-w-2xl mx-auto mt-12 p-6 md:p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white">Complete Your Subscription</h3>
            <p className="text-[#adb2b1] mt-1">
              {pricingTiers.find(t => t.id === selectedPlan)?.name} Plan Selected
            </p>
          </div>
          
          <form onSubmit={handleCheckout} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8b9a8c]" />
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 h-12 text-base bg-[#1a2420] border border-[#3d544d] rounded-lg text-white placeholder:text-[#5c6e60] focus:outline-none focus:ring-2 focus:ring-[#2bb32a] focus:border-transparent"
                  disabled={isSubmitting}
                  required
                  data-testid="input-email"
                />
              </div>
              <p className="text-xs text-[#8b9a8c]">
                You'll receive channel access instructions at this email
              </p>
            </div>

            <div className="bg-[#1a2420] rounded-lg p-4 space-y-2 border border-[#3d544d]">
              <div className="flex justify-between text-sm">
                <span className="text-[#adb2b1]">Plan</span>
                <span className="font-medium text-white">{pricingTiers.find(t => t.id === selectedPlan)?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#adb2b1]">Billing</span>
                <span className="font-medium text-white">{pricingTiers.find(t => t.id === selectedPlan)?.period}</span>
              </div>
              {pricingTiers.find(t => t.id === selectedPlan)?.savings && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#2bb32a]">Savings</span>
                  <span className="font-medium text-[#2bb32a]">{pricingTiers.find(t => t.id === selectedPlan)?.savings}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#3d544d] flex justify-between items-center">
                <span className="font-semibold text-white">Total</span>
                <span className="text-2xl font-bold text-[#2bb32a]">{pricingTiers.find(t => t.id === selectedPlan)?.price}</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="signals-btn-primary w-full justify-center text-lg py-4"
              disabled={isSubmitting}
              data-testid="button-checkout"
            >
              {isSubmitting ? "Redirecting to Checkout..." : "Proceed to Secure Checkout"}
              <Lock className="ml-2 h-5 w-5" />
            </button>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#adb2b1]">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-[#2bb32a]" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-[#2bb32a]" />
                <span>Instant Access</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-[#2bb32a]" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-comparison-title">Compare Plans</h2>
          <p className="text-lg text-[#adb2b1]">See what's included in each tier</p>
        </div>

        <div className="signals-glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#3d544d]">
                  <th className="text-left p-4 font-semibold text-white">Feature</th>
                  <th className="text-center p-4 font-semibold text-white">7 Day</th>
                  <th className="text-center p-4 font-semibold text-white">Monthly</th>
                  <th className="text-center p-4 font-semibold text-white bg-[#2bb32a]/10">Lifetime</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className="border-b border-[#3d544d]/50 last:border-b-0">
                    <td className="p-4 text-sm font-medium text-white">{feature.name}</td>
                    <td className="p-4 text-center text-sm text-[#adb2b1]">{feature.weekly}</td>
                    <td className="p-4 text-center text-sm text-[#adb2b1]">{feature.monthly}</td>
                    <td className="p-4 text-center text-sm bg-[#2bb32a]/10 font-medium text-[#2bb32a]">{feature.lifetime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-faq-title">Frequently Asked Questions</h2>
          <p className="text-lg text-[#adb2b1]">Everything you need to know</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="signals-glass-card" data-testid={`faq-${index}`}>
              <Accordion type="single" collapsible>
                <AccordionItem value={`item-${index}`} className="border-none">
                  <AccordionTrigger className="text-left font-semibold text-white hover:no-underline px-6 py-4 [&>svg]:text-[#adb2b1]">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4" style={{ color: '#adb2b1' }}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 pb-24">
        <div className="signals-glass-card-solid text-center p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Trading?</h2>
          <p className="text-lg text-[#adb2b1] mb-6">
            Join 4,821+ traders profiting with our signals
          </p>
          
          <div className="flex justify-center gap-2 flex-wrap mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-[#2bb32a] text-[#2bb32a]" />
            ))}
            <span className="ml-2 text-[#adb2b1]">(4.9/5 from 1,200+ reviews)</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button 
              onClick={() => document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="signals-btn-primary text-lg px-12"
              data-testid="button-cta-final"
            >
              Get Premium Signals Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-[#8b9a8c]">
            7-day money-back guarantee • Cancel anytime • Instant access
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#3d544d] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-[#2bb32a] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">EntryLab</span>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-[#adb2b1] mb-4">
            <Link href="/terms" className="hover:text-white transition-colors" data-testid="link-terms">Terms & Conditions</Link>
            <a href="mailto:support@entrylab.io" className="hover:text-white transition-colors" data-testid="link-contact">Contact</a>
          </div>
          <p className="text-[#8b9a8c] text-sm">
            Professional XAU/USD Trading Signals • Trusted by 4,800+ traders worldwide
          </p>
          <p className="text-[#5c6e60] text-xs mt-4">
            © {new Date().getFullYear()} EntryLab. All rights reserved. Trading involves risk.
          </p>
        </div>
      </footer>
    </div>
  );
}
