import { Check, TrendingUp, Mail, ExternalLink, Sparkles, ArrowRight, MessageCircle, Users, Zap } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

const FREE_CHANNEL_LINK = "https://t.me/entrylabs";

const benefits = [
  {
    icon: MessageCircle,
    title: "Market Analysis",
    description: "Daily insights on XAU/USD movements"
  },
  {
    icon: Users,
    title: "Trading Community",
    description: "Connect with fellow traders"
  },
  {
    icon: Zap,
    title: "Educational Content",
    description: "Learn our proven methodology"
  }
];

const nextSteps = [
  {
    icon: SiTelegram,
    title: "Join Our Free Telegram Channel",
    description: "Click the button below to join our community of traders. Get market insights, educational content, and trade ideas.",
    action: {
      label: "Join Free Channel",
      url: FREE_CHANNEL_LINK,
      external: true
    }
  },
  {
    icon: Mail,
    title: "Check Your Email",
    description: "We've sent you a welcome email with your channel invite link. Check your spam folder if you don't see it.",
    action: null
  },
  {
    icon: Sparkles,
    title: "Upgrade to Premium",
    description: "Ready for real-time signals with 87% win rate? Upgrade anytime for full access to our private VIP channel.",
    action: {
      label: "View Premium Plans",
      url: "/subscribe",
      external: false
    }
  }
];

export default function FreeAccess() {
  return (
    <div className="signals-page relative overflow-hidden">
      <Helmet>
        <title>Welcome to EntryLab | Free Telegram Channel Access</title>
        <meta name="description" content="You're in! Join our free Telegram channel for market analysis, educational content, and trade ideas." />
      </Helmet>

      <div className="signals-bg-orb signals-bg-orb-1" />
      <div className="signals-bg-orb signals-bg-orb-2" />
      <div className="signals-bg-orb signals-bg-orb-3" />

      <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" data-testid="link-home">
            <div className="w-8 h-8 bg-[#2bb32a] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">EntryLab</span>
          </Link>
        </div>
      </nav>

      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#2bb32a]/20 rounded-full border-4 border-[#2bb32a]/40 animate-pulse">
            <Check className="w-12 h-12 text-[#2bb32a]" />
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2bb32a]/10 border border-[#2bb32a]/30">
              <Sparkles className="w-4 h-4 text-[#2bb32a]" />
              <span className="text-[#2bb32a] text-sm font-medium" data-testid="badge-success">You're In!</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight" data-testid="text-hero-title">
              Welcome to{" "}
              <span className="signals-gradient-text">EntryLab!</span>
            </h1>

            <p className="text-lg md:text-xl text-[#adb2b1] max-w-2xl mx-auto" data-testid="text-hero-subtitle">
              Join our free Telegram channel and start learning from professional XAU/USD traders
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="signals-glass-card p-6 text-center" data-testid={`benefit-${index}`}>
                <div className="mx-auto w-12 h-12 bg-[#2bb32a]/20 rounded-full flex items-center justify-center mb-3">
                  <benefit.icon className="h-6 w-6 text-[#2bb32a]" />
                </div>
                <h3 className="font-semibold text-white">{benefit.title}</h3>
                <p className="text-sm text-[#adb2b1] mt-1">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-steps-title">Next Steps</h2>
          <p className="text-lg text-[#adb2b1]">Here's what to do next</p>
        </div>

        <div className="space-y-6">
          {nextSteps.map((step, index) => (
            <div key={index} className="signals-glass-card p-6" data-testid={`step-${index}`}>
              <div className="flex flex-col md:flex-row items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#2bb32a]/20 rounded-full flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-[#2bb32a]" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex px-2 py-1 rounded bg-[#2bb32a]/20 text-[#2bb32a] text-xs font-medium border border-[#2bb32a]/30">
                      Step {index + 1}
                    </span>
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  </div>
                  <p className="text-[#adb2b1]">{step.description}</p>
                </div>
              </div>
              
              {step.action && (
                <div className="mt-4 pl-0 md:pl-16">
                  {step.action.external ? (
                    <a 
                      href={step.action.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full md:w-auto"
                    >
                      <button className="signals-btn-primary w-full md:w-auto" data-testid={`button-step-${index}`}>
                        <SiTelegram className="mr-2 h-5 w-5" />
                        {step.action.label}
                        <ExternalLink className="ml-2 h-5 w-5" />
                      </button>
                    </a>
                  ) : (
                    <Link href={step.action.url} className="block w-full md:w-auto">
                      <button className="signals-btn-secondary w-full md:w-auto" data-testid={`button-step-${index}`}>
                        {step.action.label}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        <div className="signals-glass-card-solid text-center p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-cta-title">Ready to Join?</h2>
          <p className="text-lg text-[#adb2b1] mb-8">
            Click the button below to join our free Telegram channel
          </p>

          <a 
            href={FREE_CHANNEL_LINK} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block"
          >
            <button className="signals-btn-primary text-lg px-10 py-5" data-testid="button-join-channel">
              <SiTelegram className="mr-3 h-6 w-6" />
              Join Free Telegram Channel
              <ExternalLink className="ml-3 h-5 w-5" />
            </button>
          </a>

          <p className="text-sm text-[#8b9a8c] mt-6">
            We've also sent you an email with the channel link for safekeeping
          </p>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[#3d544d] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-[#2bb32a] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">EntryLab</span>
          </div>
          <p className="text-[#8b9a8c] text-sm">
            Professional XAU/USD Trading Signals • Trusted by 4,800+ traders worldwide
          </p>
          <p className="text-[#5c6e60] text-xs mt-4">
            © 2024 EntryLab. All rights reserved. Trading involves risk.
          </p>
        </div>
      </footer>
    </div>
  );
}
