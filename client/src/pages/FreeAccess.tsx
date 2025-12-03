import { useState } from "react";
import { TrendingUp, ExternalLink, Copy, CheckCircle, Zap, Target, Shield, ArrowRight } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

const FREE_CHANNEL_LINK = "https://t.me/entrylabs";

const premiumBenefits = [
  "87% verified win rate on XAU/USD",
  "3-5 real-time signals daily",
  "Precise entry, stop-loss & take-profit levels",
  "24/7 analyst support in private channel",
];

export default function FreeAccess() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(FREE_CHANNEL_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="signals-page relative overflow-hidden min-h-screen">
      <Helmet>
        <title>Welcome to EntryLab | Free Telegram Channel Access</title>
        <meta name="description" content="You're in! Join our free Telegram channel for market analysis, educational content, and trade ideas." />
      </Helmet>

      <div className="signals-bg-orb signals-bg-orb-1" />
      <div className="signals-bg-orb signals-bg-orb-2" />

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

      <section className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-16">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#2bb32a] rounded-full">
            <SiTelegram className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight" data-testid="text-hero-title">
              You're In!
            </h1>
            <p className="text-lg text-[#adb2b1]" data-testid="text-hero-subtitle">
              Join our free Telegram channel to get started
            </p>
          </div>
        </div>

        <div className="mt-10 signals-glass-card p-6 md:p-8">
          <p className="text-sm text-[#adb2b1] mb-3 text-center">Your channel invite link:</p>
          
          <div className="flex items-center gap-2 p-3 bg-[#1a2420] rounded-lg border border-[#3d544d]">
            <code className="flex-1 text-sm md:text-base font-mono text-[#2bb32a] truncate" data-testid="text-channel-link">
              {FREE_CHANNEL_LINK}
            </code>
            <button 
              onClick={handleCopy}
              className="flex-shrink-0 p-2 hover:bg-[#3d544d] rounded-md transition-colors"
              data-testid="button-copy-link"
            >
              {copied ? (
                <CheckCircle className="h-5 w-5 text-[#2bb32a]" />
              ) : (
                <Copy className="h-5 w-5 text-[#adb2b1]" />
              )}
            </button>
          </div>

          <a 
            href={FREE_CHANNEL_LINK} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block mt-6"
          >
            <button className="signals-btn-primary w-full justify-center text-lg py-4" data-testid="button-join-channel">
              <SiTelegram className="mr-2 h-5 w-5" />
              Join Free Channel
              <ExternalLink className="ml-2 h-5 w-5" />
            </button>
          </a>

          <p className="text-xs text-[#8b9a8c] mt-4 text-center">
            We've also sent this link to your email
          </p>
        </div>
      </section>

      <section className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pb-24">
        <div className="signals-glass-card-solid p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#2bb32a]/20 rounded-full flex items-center justify-center">
              <Zap className="h-5 w-5 text-[#2bb32a]" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white" data-testid="text-upgrade-title">
              Want Real-Time Trading Signals?
            </h2>
          </div>

          <p className="text-[#adb2b1] mb-6">
            Upgrade to Premium for direct access to our private VIP channel with institutional-grade XAU/USD signals.
          </p>

          <ul className="space-y-3 mb-8">
            {premiumBenefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-[#2bb32a]/20 rounded-full flex items-center justify-center mt-0.5">
                  <Target className="h-3 w-3 text-[#2bb32a]" />
                </div>
                <span className="text-white text-sm md:text-base">{benefit}</span>
              </li>
            ))}
          </ul>

          <Link href="/subscribe" className="block">
            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-transparent border-2 border-[#2bb32a] text-[#2bb32a] rounded-full font-semibold hover:bg-[#2bb32a]/10 transition-colors" data-testid="button-upgrade-premium">
              View Premium Plans
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
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
            Professional XAU/USD Trading Signals
          </p>
          <p className="text-[#5c6e60] text-xs mt-4">
            © 2024 EntryLab. All rights reserved. Trading involves risk.
          </p>
        </div>
      </footer>
    </div>
  );
}
