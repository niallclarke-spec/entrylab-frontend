import { useEffect, useState } from "react";
import { Check, Sparkles, TrendingUp, Target, Shield, Zap, ExternalLink, ChevronRight, Mail, ArrowRight, Loader2, Copy, CheckCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface InviteLinkResponse {
  success: boolean;
  inviteLink: string | null;
  emailSent: boolean;
}

export default function Success() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    setSessionId(sid);

    if (!sid) {
      setTimeout(() => {
        setLocation('/subscribe');
      }, 3000);
    }
  }, [setLocation]);

  const { data: inviteData, isLoading: isLoadingLink } = useQuery<InviteLinkResponse>({
    queryKey: ['/api/invite-link', sessionId],
    enabled: !!sessionId,
    refetchInterval: (query) => {
      if (!query.state.data?.inviteLink) {
        return 2000;
      }
      return false;
    },
    retry: 5,
    retryDelay: 1000,
  });

  const inviteLink = inviteData?.inviteLink;

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nextSteps = [
    {
      icon: Sparkles,
      title: "Join Private VIP Channel",
      description: inviteLink 
        ? "Your exclusive invite link is ready! Click the button below to join the private signals channel."
        : "Your exclusive invite link is being generated...",
      action: inviteLink ? {
        label: "Join Telegram Channel",
        url: inviteLink,
        external: true
      } : null
    },
    {
      icon: Mail,
      title: "Check Your Email",
      description: "We've also sent your invite link to your email for safekeeping. Check your spam folder if you don't see it.",
      action: null
    },
    {
      icon: Target,
      title: "Start Trading",
      description: "You'll receive 3-5 premium signals daily with complete analysis, entry/exit points, and risk management.",
      action: null
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "87.5% Win Rate",
      description: "Proven track record over 12 months"
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Every signal includes stop loss & position sizing"
    },
    {
      icon: Zap,
      title: "Real-time Alerts",
      description: "Instant notifications for all new signals"
    }
  ];

  if (!sessionId) {
    return (
      <div className="signals-page min-h-screen flex items-center justify-center p-4">
        <div className="signals-bg-orb signals-bg-orb-1" />
        <div className="signals-bg-orb signals-bg-orb-2" />
        <div className="signals-glass-card-solid p-8 max-w-md text-center relative z-10">
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Session</h2>
          <p className="text-[#adb2b1]">Redirecting to subscription page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="signals-page relative overflow-hidden">
      <Helmet>
        <title>Welcome to Premium Signals | EntryLab</title>
        <meta name="description" content="Your subscription is confirmed! Access your private Telegram channel and start receiving premium signals." />
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
        </div>
      </nav>

      {/* Hero Success Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="text-center space-y-8">
          {/* Success Animation */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#2bb32a]/20 rounded-full border-4 border-[#2bb32a]/40 animate-pulse">
            <Check className="w-12 h-12 text-[#2bb32a]" />
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2bb32a]/10 border border-[#2bb32a]/30">
              <Sparkles className="w-4 h-4 text-[#2bb32a]" />
              <span className="text-[#2bb32a] text-sm font-medium" data-testid="badge-success">Subscription Confirmed</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight" data-testid="text-hero-title">
              Welcome to{" "}
              <span className="signals-gradient-text">Premium Signals!</span>
            </h1>

            <p className="text-lg md:text-xl text-[#adb2b1] max-w-2xl mx-auto" data-testid="text-hero-subtitle">
              You're now part of an elite community of <span className="text-[#2bb32a] font-semibold">4,821+ profitable traders</span>
            </p>
          </div>

          {/* Benefits Grid */}
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

      {/* Next Steps */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-steps-title">Next Steps</h2>
          <p className="text-lg text-[#adb2b1]">Get started in 3 simple steps</p>
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
              
              {index === 0 && (
                <div className="mt-4 pl-0 md:pl-16">
                  {isLoadingLink ? (
                    <button className="signals-btn-primary opacity-70 cursor-not-allowed w-full md:w-auto" disabled data-testid={`button-step-${index}`}>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading your invite link...
                    </button>
                  ) : step.action ? (
                    <a 
                      href={step.action.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full md:w-auto"
                    >
                      <button className="signals-btn-primary w-full md:w-auto" data-testid={`button-step-${index}`}>
                        {step.action.label}
                        <ExternalLink className="ml-2 h-5 w-5" />
                      </button>
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Important Information */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="signals-glass-card-solid p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-[#2bb32a]" />
            Important Information
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Check className="h-5 w-5 text-[#2bb32a]" />
                Your Subscription Details
              </h3>
              <p className="text-sm text-[#adb2b1] pl-7">
                Your payment has been processed successfully. You'll receive a confirmation email with your receipt and billing details.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Check className="h-5 w-5 text-[#2bb32a]" />
                Channel Access
              </h3>
              <p className="text-sm text-[#adb2b1] pl-7">
                The private Telegram channel invite link has been sent to your email. Access is granted immediately and remains active as long as your subscription is valid.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Check className="h-5 w-5 text-[#2bb32a]" />
                Signal Delivery
              </h3>
              <p className="text-sm text-[#adb2b1] pl-7">
                You'll receive 3-5 premium signals daily via Telegram. Each signal includes entry price, stop loss, take profit targets, position sizing, and risk management guidance.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Check className="h-5 w-5 text-[#2bb32a]" />
                Support & Questions
              </h3>
              <p className="text-sm text-[#adb2b1] pl-7">
                Our analyst team is available 24/7 in the private channel to answer questions, provide market insights, and help you maximize your trading results.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Check className="h-5 w-5 text-[#2bb32a]" />
                Money-Back Guarantee
              </h3>
              <p className="text-sm text-[#adb2b1] pl-7">
                Not satisfied? Request a full refund within 7 days, no questions asked. Just contact our support team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        <div className="signals-glass-card-solid text-center p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Trading?</h2>
          <p className="text-lg text-[#adb2b1] mb-8">
            Join the private channel now and start receiving signals
          </p>

          {isLoadingLink ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 text-[#2bb32a] animate-spin" />
              <p className="text-lg font-medium text-white">
                Generating your exclusive invite link...
              </p>
            </div>
          ) : inviteLink ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-md">
                <div className="flex items-center gap-2 p-3 bg-[#1a2420] rounded-lg border border-[#3d544d]">
                  <code className="flex-1 text-sm font-mono truncate text-[#adb2b1]" data-testid="text-invite-link">
                    {inviteLink}
                  </code>
                  <button 
                    onClick={handleCopyLink}
                    className="p-2 hover:bg-[#3d544d] rounded transition-colors"
                    data-testid="button-copy-link"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-[#2bb32a]" />
                    ) : (
                      <Copy className="h-4 w-4 text-[#adb2b1]" />
                    )}
                  </button>
                </div>
              </div>
              <a 
                href={inviteLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full max-w-md"
              >
                <button className="signals-btn-primary w-full justify-center text-lg" data-testid="button-join-channel">
                  Join Private VIP Channel Now
                  <ExternalLink className="ml-2 h-5 w-5" />
                </button>
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-[#2bb32a]/20 rounded-full p-4">
                <Mail className="h-8 w-8 text-[#2bb32a]" />
              </div>
              <p className="text-lg font-medium text-white">
                Your unique invite link will appear here shortly
              </p>
              <p className="text-sm text-[#adb2b1]">
                We've also sent it to your email
              </p>
            </div>
          )}

          <p className="text-sm text-[#8b9a8c] mt-6">
            Can't find the email? Check your spam folder or contact support at support@entrylab.io
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
