import { useState, useEffect } from "react";
import { ArrowRight, TrendingUp, Shield, BarChart3, Target, Clock, Users, ChevronDown, ChevronUp, Mail, MessageCircle, Check, Zap } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

const stats = [
  { value: "87%", label: "Win Rate" },
  { value: "4.8k+", label: "Active Traders" },
  { value: "2,400+", label: "Signals Delivered" },
  { value: "$2.1M+", label: "Profits Generated" },
];

const features = [
  {
    icon: Target,
    title: "Precision Entries",
    description: "AI-powered analysis identifies optimal XAU/USD entry points with institutional-grade accuracy.",
  },
  {
    icon: Shield,
    title: "Risk Management",
    description: "Every signal includes precise stop-loss and take-profit levels to protect your capital.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Alerts",
    description: "Instant Telegram notifications ensure you never miss a high-probability trading opportunity.",
  },
];

const testimonials = [
  {
    quote: "The analysis quality is institutional-grade. Finally, signals I can trust with my capital.",
    author: "Marcus R.",
    role: "Professional Trader",
    avatar: "M",
  },
  {
    quote: "Clear entries, precise stops. No guesswork. Turned my part-time trading into consistent income.",
    author: "Sarah C.",
    role: "Private Investor",
    avatar: "S",
  },
  {
    quote: "I've tried many signal services. This is the only one with verifiable results and real methodology.",
    author: "David T.",
    role: "Fund Analyst",
    avatar: "D",
  },
];

const faqs = [
  {
    question: "What is included in the free Telegram channel?",
    answer: "Our free channel gives you access to market analysis, educational content, and occasional trade ideas. You'll see the quality of our methodology before committing to premium signals.",
  },
  {
    question: "How are signals delivered?",
    answer: "All signals are delivered instantly via Telegram with clear entry price, stop-loss, and take-profit levels. Premium members receive real-time alerts as opportunities arise.",
  },
  {
    question: "What's your verified win rate?",
    answer: "Our 90-day rolling win rate averages 82-91% on XAU/USD signals, verified through MyFXBook. Past performance doesn't guarantee future results, but our methodology is consistent.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your premium subscription at any time. There are no long-term contracts or hidden fees. Your access continues until the end of your billing period.",
  },
  {
    question: "What trading experience do I need?",
    answer: "Our signals are suitable for traders of all levels. We provide clear instructions with each signal, and our methodology is transparent so you understand the reasoning behind each trade.",
  },
  {
    question: "How do I get started?",
    answer: "Simply enter your email to join our free Telegram channel. You'll get immediate access to our community and can upgrade to premium signals whenever you're ready.",
  },
];

const sampleSignals = [
  { pair: "XAU/USD", direction: "BUY", entry: "2,045.50", sl: "2,038.00", tp: "2,068.00", status: "Active", profit: "+$890" },
  { pair: "XAU/USD", direction: "SELL", entry: "2,072.25", sl: "2,080.00", tp: "2,052.00", status: "Closed", profit: "+$1,340" },
  { pair: "XAU/USD", direction: "BUY", entry: "2,018.80", sl: "2,012.00", tp: "2,035.00", status: "Closed", profit: "+$650" },
];

function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="signals-faq-item">
      <button
        className="signals-faq-question w-full text-left"
        onClick={onClick}
        data-testid={`faq-${question.substring(0, 20).replace(/\s+/g, '-').toLowerCase()}`}
      >
        <span className="flex-1 text-lg md:text-2xl">{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
      </button>
      {isOpen && <p className="signals-faq-answer">{answer}</p>}
    </div>
  );
}

function EmailCaptureForm({ 
  testIdSuffix = "",
  buttonText = "Get Free Access",
  showIcon = true 
}: { 
  testIdSuffix?: string;
  buttonText?: string;
  showIcon?: boolean;
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
      await apiRequest('POST', '/api/capture-email', {
        email,
        source: 'signals_landing',
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
      });
      toast({
        title: "Welcome to EntryLab!",
        description: "Check your email for your free Telegram channel invite.",
      });
      setEmail("");
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
      <div className="flex-1 relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#adb2b1]" />
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-[#273028] border border-[#3d544d] rounded-full text-white placeholder:text-[#adb2b1] focus:outline-none focus:border-[#2bb32a] transition-colors"
          disabled={isSubmitting}
          required
          data-testid={`input-email${suffix}`}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="signals-btn-primary whitespace-nowrap"
        data-testid={`button-submit${suffix}`}
      >
        {isSubmitting ? "Joining..." : buttonText}
        {showIcon && <ArrowRight className="w-5 h-5" />}
      </button>
    </form>
  );
}

function FlowingLine() {
  return (
    <div className="signals-flowing-line hidden lg:block">
      <svg 
        viewBox="0 0 100 3000" 
        className="w-full h-full" 
        preserveAspectRatio="xMidYMin slice"
        fill="none"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2bb32a" stopOpacity="0" />
            <stop offset="10%" stopColor="#2bb32a" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#2bb32a" stopOpacity="0.6" />
            <stop offset="90%" stopColor="#2bb32a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2bb32a" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Main flowing line - like a price chart movement */}
        <path
          d="M 50 0 
             C 50 100, 80 150, 60 250
             S 20 400, 50 500
             S 90 650, 70 750
             S 30 900, 50 1000
             S 85 1150, 65 1250
             S 25 1400, 50 1500
             S 80 1650, 60 1750
             S 30 1900, 50 2000
             S 85 2150, 65 2250
             S 25 2400, 50 2500
             S 80 2650, 60 2750
             S 40 2900, 50 3000"
          stroke="url(#lineGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          filter="url(#glow)"
        />
        {/* Small accent dots along the line - like price points */}
        <circle cx="60" cy="250" r="3" fill="#2bb32a" opacity="0.5" />
        <circle cx="50" cy="500" r="3" fill="#2bb32a" opacity="0.6" />
        <circle cx="70" cy="750" r="3" fill="#2bb32a" opacity="0.4" />
        <circle cx="50" cy="1000" r="3" fill="#2bb32a" opacity="0.5" />
        <circle cx="65" cy="1250" r="3" fill="#2bb32a" opacity="0.6" />
        <circle cx="50" cy="1500" r="3" fill="#2bb32a" opacity="0.4" />
        <circle cx="60" cy="1750" r="3" fill="#2bb32a" opacity="0.5" />
        <circle cx="50" cy="2000" r="3" fill="#2bb32a" opacity="0.6" />
        <circle cx="65" cy="2250" r="3" fill="#2bb32a" opacity="0.4" />
        <circle cx="50" cy="2500" r="3" fill="#2bb32a" opacity="0.5" />
      </svg>
    </div>
  );
}

function SignalCard({ signal, index }: { signal: typeof sampleSignals[0]; index: number }) {
  const isActive = signal.status === "Active";
  return (
    <div 
      className={`signals-signal-card p-4 md:p-6 ${isActive ? 'animate-pulse-glow' : ''}`}
      style={{ animationDelay: `${index * 0.2}s` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">{signal.pair}</span>
          <span className={`px-2 py-1 rounded text-xs font-bold ${signal.direction === 'BUY' ? 'bg-[#2bb32a]/20 text-[#2bb32a]' : 'bg-red-500/20 text-red-400'}`}>
            {signal.direction}
          </span>
        </div>
        <span className={`text-sm font-medium ${isActive ? 'text-[#2bb32a]' : 'text-[#adb2b1]'}`}>
          {isActive && <span className="inline-block w-2 h-2 bg-[#2bb32a] rounded-full mr-2 animate-pulse" />}
          {signal.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
        <div>
          <p className="text-[#adb2b1] mb-1">Entry</p>
          <p className="text-white font-mono">{signal.entry}</p>
        </div>
        <div>
          <p className="text-[#adb2b1] mb-1">Stop Loss</p>
          <p className="text-red-400 font-mono">{signal.sl}</p>
        </div>
        <div>
          <p className="text-[#adb2b1] mb-1">Take Profit</p>
          <p className="text-[#2bb32a] font-mono">{signal.tp}</p>
        </div>
      </div>
      {!isActive && (
        <div className="pt-4 border-t border-[#3d544d]">
          <p className="text-[#adb2b1] text-sm">Result</p>
          <p className="text-[#2bb32a] text-xl font-bold">{signal.profit}</p>
        </div>
      )}
    </div>
  );
}

export default function SignalsLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [accuracy, setAccuracy] = useState(87);

  useEffect(() => {
    const interval = setInterval(() => {
      const newAccuracy = Math.floor(Math.random() * (91 - 82 + 1)) + 82;
      setAccuracy(newAccuracy);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="signals-page relative overflow-hidden">
      <Helmet>
        <title>XAU/USD Trading Signals | EntryLab - Professional Gold Analysis</title>
        <meta name="description" content="Join 4,800+ traders receiving institutional-grade XAU/USD signals. 87% win rate, verified results, instant Telegram delivery. Start free today." />
        <meta property="og:title" content="XAU/USD Trading Signals | EntryLab" />
        <meta property="og:description" content="Professional gold trading signals with 87% win rate. Join our free Telegram channel." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://entrylab.io/signals" />
      </Helmet>

      {/* Background Orbs */}
      <div className="signals-bg-orb signals-bg-orb-1" />
      <div className="signals-bg-orb signals-bg-orb-2" />
      <div className="signals-bg-orb signals-bg-orb-3" />

      {/* Flowing Decorative Line */}
      <FlowingLine />

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
            <a href="#features" className="hover:text-white transition-colors" data-testid="link-nav-features">Features</a>
            <a href="#signals" className="hover:text-white transition-colors" data-testid="link-nav-signals">Signals</a>
            <a href="#testimonials" className="hover:text-white transition-colors" data-testid="link-nav-reviews">Reviews</a>
            <a href="#faq" className="hover:text-white transition-colors" data-testid="link-nav-faq">FAQ</a>
          </div>
          <Link href="/subscribe" className="signals-btn-outline hidden sm:inline-flex" data-testid="link-subscribe-nav">
            Get Premium
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-24 md:pt-20 md:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              Professional{" "}
              <span className="signals-gradient-text">XAU/USD</span>{" "}
              Trading Signals
            </h1>
            <p className="text-lg md:text-xl text-[#adb2b1] max-w-xl leading-relaxed">
              Join thousands of traders receiving institutional-grade gold analysis. 
              Clear entries, precise risk management, verified results.
            </p>
            
            <EmailCaptureForm testIdSuffix="hero" />

            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {['M', 'S', 'D', 'J'].map((initial, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-[#3d544d] border-2 border-[#1a1e1c] flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{initial}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white font-semibold">4,800+</p>
                <p className="text-[#adb2b1] text-sm">Active traders worldwide</p>
              </div>
            </div>
          </div>

          {/* Hero Visual - Signal Preview Cards */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2bb32a]/20 to-transparent rounded-3xl blur-3xl" />
            <div className="relative space-y-4">
              {sampleSignals.slice(0, 2).map((signal, i) => (
                <SignalCard key={i} signal={signal} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 -mt-8">
        <div className="signals-stats-bar">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <p className="signals-stat-value" data-testid={`stat-value-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>{stat.value}</p>
                <p className="signals-stat-label mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          What do we offer?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="flex gap-6">
              <div className="signals-icon-box flex-shrink-0">
                <feature.icon className="w-8 h-8 text-[#2bb32a]" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-[#adb2b1] leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Signal Preview Section */}
      <section id="signals" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6 order-2 lg:order-1">
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              See Our Signals in Action
            </h2>
            <p className="text-[#adb2b1] text-lg leading-relaxed">
              Every signal includes precise entry, stop-loss, and take-profit levels. 
              Our methodology combines technical analysis with AI-powered market sentiment 
              to identify high-probability XAU/USD opportunities.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#2bb32a]/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#2bb32a]" />
                </div>
                <span className="text-white">Real-time Telegram delivery</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#2bb32a]/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#2bb32a]" />
                </div>
                <span className="text-white">Clear risk/reward ratios</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#2bb32a]/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#2bb32a]" />
                </div>
                <span className="text-white">Verified {accuracy}% win rate</span>
              </div>
            </div>
            <div className="pt-4">
              <Link href="/subscribe">
                <button className="signals-btn-primary" data-testid="button-view-pricing">
                  View Premium Plans
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
          <div className="space-y-4 order-1 lg:order-2">
            {sampleSignals.map((signal, i) => (
              <SignalCard key={i} signal={signal} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Mid-page CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="signals-glass-card-solid p-8 md:p-12 text-center">
          <div className="inline-flex items-center gap-2 bg-[#2bb32a]/20 px-4 py-2 rounded-full mb-6">
            <SiTelegram className="w-5 h-5 text-[#2bb32a]" />
            <span className="text-[#2bb32a] font-medium">Free Telegram Access</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to see our analysis in action?
          </h3>
          <p className="text-[#adb2b1] mb-8 max-w-xl mx-auto">
            Join our free Telegram channel and start receiving market insights today. 
            No credit card required.
          </p>
          <EmailCaptureForm testIdSuffix="mid" buttonText="Join Free" />
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          What traders are saying
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="signals-testimonial-card">
              <div className="signals-icon-box mb-8">
                <MessageCircle className="w-6 h-6 text-[#2bb32a]" />
              </div>
              <p className="text-white text-lg mb-8 leading-relaxed">"{testimonial.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#3d544d] flex items-center justify-center">
                  <span className="text-white font-medium">{testimonial.avatar}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{testimonial.author}</p>
                  <p className="text-[#adb2b1] text-sm">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-24 md:py-32">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFaq === i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Start Trading Smarter Today
            </h2>
            <p className="text-[#adb2b1] text-lg max-w-md">
              Join our free Telegram channel and see why thousands of traders trust EntryLab for XAU/USD signals.
            </p>
            <EmailCaptureForm testIdSuffix="footer" />
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-[#adb2b1]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#2bb32a]" />
                <span>Instant access</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2bb32a]" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2bb32a]" />
                <span>4,800+ traders</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2bb32a]/30 to-transparent rounded-3xl blur-2xl" />
              <div className="relative signals-glass-card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <SiTelegram className="w-10 h-10 text-[#2bb32a]" />
                  <div>
                    <p className="text-white font-semibold">EntryLab Signals</p>
                    <p className="text-[#adb2b1] text-sm">Free Channel</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-3 bg-[#1a1e1c]/50 rounded-lg">
                    <span className="text-[#adb2b1]">Daily Analysis</span>
                    <Check className="w-5 h-5 text-[#2bb32a]" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1a1e1c]/50 rounded-lg">
                    <span className="text-[#adb2b1]">Market Updates</span>
                    <Check className="w-5 h-5 text-[#2bb32a]" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1a1e1c]/50 rounded-lg">
                    <span className="text-[#adb2b1]">Education Content</span>
                    <Check className="w-5 h-5 text-[#2bb32a]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Disclaimer Footer */}
      <footer className="relative z-10 border-t border-[#3d544d]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <Link href="/" className="flex items-center gap-3" data-testid="link-footer-home">
              <div className="w-8 h-8 bg-[#2bb32a] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">EntryLab</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-[#adb2b1]">
              <Link href="/privacy" className="hover:text-white transition-colors" data-testid="link-privacy">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors" data-testid="link-terms">Terms of Service</Link>
              <a href="mailto:support@entrylab.io" className="hover:text-white transition-colors" data-testid="link-contact">Contact</a>
            </div>
          </div>
          <div className="text-center text-xs text-[#adb2b1]/70 max-w-4xl mx-auto leading-relaxed">
            <p className="mb-4">
              <strong className="text-[#adb2b1]">Risk Disclaimer:</strong> Trading forex and CFDs involves substantial risk of loss and is not suitable for all investors. 
              Past performance is not indicative of future results. The content provided is for educational purposes only and should not be considered investment advice.
            </p>
            <p>© {new Date().getFullYear()} EntryLab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
