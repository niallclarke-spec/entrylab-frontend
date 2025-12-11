import { useState, useEffect } from "react";
import { ArrowRight, TrendingUp, Shield, BarChart3, Target, Clock, Users, ChevronDown, ChevronUp, Mail, MessageCircle, Check, Zap, ChevronLeft, Pin, Bell, Star, Play, Quote } from "lucide-react";
import { SiTelegram, SiX } from "react-icons/si";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { getStoredUTMParams, clearUTMParams } from "@/lib/utm";

const stats = [
  { value: "87%", label: "Win Rate" },
  { value: "4.8k+", label: "Active Traders" },
  { value: "2,400+", label: "Signals Delivered" },
  { value: "$2.1M+", label: "Profits Generated" },
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

// Extended testimonials for scrolling rows
const scrollingTestimonials = {
  topRow: [
    { quote: "The analysis quality is institutional-grade. Finally, signals I can trust with my capital.", author: "Marcus R.", role: "@marcus_trades", avatar: "M" },
    { quote: "82% win rate over 3 months. These signals literally changed my trading career.", author: "James T.", role: "@james_fx", avatar: "J" },
    { quote: "Crystal clear entries and exits. No more second-guessing. Pure execution.", author: "Anna K.", role: "@anna_invest", avatar: "A" },
    { quote: "Went from losing trader to consistently profitable. The methodology is everything.", author: "Michael P.", role: "@mike_pips", avatar: "M" },
    { quote: "Best signal service I've used in 8 years of trading. Period.", author: "Robert L.", role: "@rob_trades", avatar: "R" },
    { quote: "The risk management alone is worth 10x the subscription. My account thanks you.", author: "Elena S.", role: "@elena_fx", avatar: "E" },
  ],
  bottomRow: [
    { quote: "From struggling to profitable in 90 days. These signals are the real deal.", author: "Sarah C.", role: "@sarah_capital", avatar: "S" },
    { quote: "I've tried many signal services. This is the only one with verifiable results.", author: "David T.", role: "@david_trades", avatar: "D" },
    { quote: "The Telegram alerts are instant. Never miss an entry. Game changer.", author: "Chris B.", role: "@chris_pips", avatar: "C" },
    { quote: "Professional grade analysis at a fraction of institutional costs. Incredible value.", author: "Linda M.", role: "@linda_fx", avatar: "L" },
    { quote: "Clear TP and SL levels every time. No ambiguity. Just profits.", author: "Kevin H.", role: "@kevin_gold", avatar: "K" },
    { quote: "The win rate speaks for itself. 47 trades, 39 winners. Do the math.", author: "Patricia W.", role: "@pat_trades", avatar: "P" },
  ],
};

const faqs = [
  {
    question: "What is included in the free Telegram channel?",
    answer: "Our free channel gives you full visibility of our VIP Channels win rate and weekly recaps",
  },
  {
    question: "How are signals delivered?",
    answer: "All signals are delivered instantly to our VIP Telegram channel ( EntryLab VIP ) with clear entry price, stop-loss, and take-profit levels.",
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
    <div className={`signals-faq-item ${isOpen ? 'signals-faq-item-active' : ''}`}>
      <button
        className="signals-faq-question w-full text-left"
        onClick={onClick}
        data-testid={`faq-${question.substring(0, 20).replace(/\s+/g, '-').toLowerCase()}`}
      >
        <span className="flex-1 text-lg md:text-2xl">{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 flex-shrink-0 text-[#2bb32a]" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
      </button>
      {isOpen && <p className="signals-faq-answer">{answer}</p>}
    </div>
  );
}

function EmailCaptureForm({ 
  testIdSuffix = "",
  buttonText = "Get Free Access",
  showIcon = true,
  centered = false
}: { 
  testIdSuffix?: string;
  buttonText?: string;
  showIcon?: boolean;
  centered?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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
      // Get UTM params from localStorage (captured on page load)
      const storedUtm = getStoredUTMParams();
      // Also check URL params as fallback
      const urlParams = new URLSearchParams(window.location.search);
      
      await apiRequest('POST', '/api/capture-email', {
        email,
        source: 'signals_landing',
        utm_source: storedUtm.utm_source || urlParams.get('utm_source'),
        utm_medium: storedUtm.utm_medium || urlParams.get('utm_medium'),
        utm_campaign: storedUtm.utm_campaign || urlParams.get('utm_campaign'),
        utm_content: storedUtm.utm_content || urlParams.get('utm_content'),
        utm_term: storedUtm.utm_term || urlParams.get('utm_term'),
      });
      
      // Clear UTM params after successful signup
      clearUTMParams();
      
      // Redirect to confirmation page on success
      setLocation('/free-access');
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 w-full max-w-xl ${centered ? 'mx-auto' : ''}`}>
      <div className="flex-1 relative">
        <SiTelegram className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#229ED9]" />
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-[#273028] border border-[#2bb32a]/50 rounded-full text-white placeholder:text-[#adb2b1] focus:outline-none focus:border-[#2bb32a] focus:shadow-[0_0_40px_rgba(43,179,42,0.6),0_0_20px_rgba(43,179,42,0.4)] transition-all shadow-[0_0_35px_rgba(43,179,42,0.4),0_0_15px_rgba(43,179,42,0.3)]"
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

function TradeDistribution() {
  const winRate = 82.03;
  const loseRate = 17.97;
  const circumference = 2 * Math.PI * 45;
  const winOffset = circumference * (1 - winRate / 100);
  
  return (
    <div className="trade-distribution-card-lg" data-testid="trade-distribution">
      <h4 className="text-white font-semibold text-lg mb-6">Trade distribution (last 90 days)</h4>
      <div className="flex items-center gap-8">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#3d3d3d" strokeWidth="6" />
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="#c9a227" 
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={winOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[#c9a227] font-bold text-lg">{winRate}%</span>
          </div>
        </div>
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-4">
            <span className="w-3 h-3 rounded-full bg-[#2bb32a]" />
            <span className="text-[#adb2b1]">Winning trades</span>
            <span className="text-white font-semibold ml-auto">{winRate}%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[#adb2b1]">Losing trades</span>
            <span className="text-white font-semibold ml-auto">{loseRate}%</span>
          </div>
        </div>
      </div>
      <p className="text-sm mt-6 text-[#858ea1]">Based on a XAU/USD Portfolio following every signal with 1% risk.</p>
    </div>
  );
}

function SignalCard({ signal, index }: { signal: typeof sampleSignals[0]; index: number }) {
  const isActive = signal.status === "Active";
  return (
    <div 
      className={`signal-card-new ${isActive ? 'signal-card-active' : ''}`}
      style={{ animationDelay: `${index * 0.1}s` }}
      data-testid={`signal-card-${index}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-white">{signal.pair}</span>
          <span className={`px-2.5 py-1 rounded text-xs font-bold ${signal.direction === 'BUY' ? 'bg-[#2bb32a] text-white' : 'bg-red-500 text-white'}`}>
            {signal.direction}
          </span>
        </div>
        <span className={`text-sm font-medium flex items-center gap-2 ${isActive ? 'text-[#2bb32a]' : 'text-[#adb2b1]'}`}>
          {isActive && <span className="w-2 h-2 bg-[#2bb32a] rounded-full animate-pulse" />}
          {signal.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm mb-5">
        <div>
          <p className="text-[#6b7280] text-xs mb-1">Entry</p>
          <p className="text-white font-mono font-medium">{signal.entry}</p>
        </div>
        <div>
          <p className="text-[#6b7280] text-xs mb-1">Stop Loss</p>
          <p className="text-red-400 font-mono font-medium">{signal.sl}</p>
        </div>
        <div>
          <p className="text-[#6b7280] text-xs mb-1">Take Profit</p>
          <p className="text-[#2bb32a] font-mono font-medium">{signal.tp}</p>
        </div>
      </div>
      {!isActive && (
        <div className="pt-4 border-t border-[#2a2e2c]">
          <p className="text-[#6b7280] text-xs mb-1">Result</p>
          <p className="text-[#2bb32a] font-mono font-bold text-lg">{signal.profit}</p>
        </div>
      )}
    </div>
  );
}

const telegramMessages = [
  { type: "signal", direction: "BUY", pair: "XAU/USD", entry: "2,645.50", sl: "2,638.00", tp: "2,668.00", time: "09:15", reactions: ["🔥", "12"] },
  { type: "update", text: "Take Profit 1 HIT!! Moving SL to breakeven", time: "10:42", reactions: ["🎯", "8"] },
  { type: "update", text: "Take Profit 2 HIT!! Letting runners ride", time: "11:28", reactions: ["💰", "15"] },
  { type: "signal", direction: "SELL", pair: "XAU/USD", entry: "2,672.25", sl: "2,680.00", tp: "2,652.00", time: "14:05" },
  { type: "update", text: "Take Profit 1 HIT!!", time: "15:18", reactions: ["✅", "6"] },
  { type: "recap", time: "18:00", reactions: ["🚀", "24"] },
  { type: "signal", direction: "BUY", pair: "XAU/USD", entry: "2,618.80", sl: "2,612.00", tp: "2,635.00", time: "08:30" },
  { type: "analysis", text: "Strong support forming at 2,615. Watching for continuation.", time: "09:45" },
];

function TelegramMessage({ message, index }: { message: typeof telegramMessages[0]; index: number }) {
  const ReadReceipt = () => (
    <span className="inline-flex items-center text-[#34B7F1] ml-1">
      <Check className="w-3 h-3" />
      <Check className="w-3 h-3 -ml-1.5" />
    </span>
  );

  const Reactions = ({ reactions }: { reactions?: string[] }) => {
    if (!reactions || reactions.length === 0) return null;
    return (
      <div className="flex items-center gap-1 mt-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#232e3c] text-[11px]">
          <span>{reactions[0]}</span>
          <span className="text-[#8b9a8c]">{reactions[1]}</span>
        </span>
      </div>
    );
  };

  // Weekly recap message
  if (message.type === "recap") {
    return (
      <div className="mb-3">
        <div className="bg-[#182533] rounded-2xl rounded-tl-sm p-3 max-w-[95%] shadow-sm">
          <p className="text-white font-bold text-[13px] mb-2">Weekly Recap:</p>
          <div className="space-y-1 text-[12px] font-mono">
            <p className="text-white">Monday - <span className="text-[#2bb32a]">+90 Pips</span> <span className="text-[#2bb32a]">&#10003;</span></p>
            <p className="text-white">Tuesday - <span className="text-[#2bb32a]">+44 Pips</span> <span className="text-[#2bb32a]">&#10003;</span></p>
            <p className="text-white">Wednesday - <span className="text-[#e53935]">-28 Pips</span> <span className="text-[#e53935]">&#10007;</span></p>
            <p className="text-white">Thursday - <span className="text-[#2bb32a]">+67 Pips</span> <span className="text-[#2bb32a]">&#10003;</span></p>
            <p className="text-white">Friday - <span className="text-[#2bb32a]">+112 Pips</span> <span className="text-[#2bb32a]">&#10003;</span></p>
          </div>
          <p className="text-[#2bb32a] font-bold text-[13px] mt-2 pt-2 border-t border-[#2d3d4d]">Total: +285 Pips</p>
          <div className="flex items-center justify-between mt-2">
            <Reactions reactions={message.reactions} />
            <div className="flex items-center gap-1">
              <span className="text-[#8b9a8c] text-[10px]">{message.time}</span>
              <ReadReceipt />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "signal") {
    return (
      <div className="mb-3">
        <div className="bg-[#182533] rounded-2xl rounded-tl-sm p-3 max-w-[95%] shadow-sm">
          {/* Signal header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white font-bold text-[13px]">{message.pair}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${message.direction === 'BUY' ? 'bg-[#2bb32a] text-white' : 'bg-[#e53935] text-white'}`}>
              {message.direction}
            </span>
          </div>
          {/* Signal details */}
          <div className="grid grid-cols-3 gap-3 text-[11px] mb-2">
            <div>
              <p className="text-[#8b9a8c] text-[10px]">Entry</p>
              <p className="text-white font-mono font-medium">{message.entry}</p>
            </div>
            <div>
              <p className="text-[#8b9a8c] text-[10px]">Stop Loss</p>
              <p className="text-[#e53935] font-mono font-medium">{message.sl}</p>
            </div>
            <div>
              <p className="text-[#8b9a8c] text-[10px]">Take Profit</p>
              <p className="text-[#2bb32a] font-mono font-medium">{message.tp}</p>
            </div>
          </div>
          {/* Reactions and timestamp */}
          <div className="flex items-center justify-between mt-1">
            <Reactions reactions={message.reactions} />
            <div className="flex items-center gap-1">
              <span className="text-[#8b9a8c] text-[10px]">{message.time}</span>
              <ReadReceipt />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Update messages (TP hits, etc)
  if (message.type === "update") {
    return (
      <div className="mb-3">
        <div className="bg-[#182533] rounded-2xl rounded-tl-sm p-3 max-w-[95%] shadow-sm">
          <p className="text-[#2bb32a] font-bold text-[13px]">{message.text}</p>
          <div className="flex items-center justify-between mt-2">
            <Reactions reactions={message.reactions} />
            <div className="flex items-center gap-1">
              <span className="text-[#8b9a8c] text-[10px]">{message.time}</span>
              <ReadReceipt />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-3">
      <div className="bg-[#1e2a36] rounded-2xl rounded-tl-sm p-3 max-w-[95%] shadow-sm">
        <p className="text-white text-[13px]">{message.text}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[#8b9a8c] text-[10px]">{message.time}</span>
          <ReadReceipt />
        </div>
      </div>
    </div>
  );
}

const floatingNotifications = [
  { type: "signal", text: "New signal posted!", icon: "arrow", delay: 0 },
  { type: "profit", text: "TP2 Hit!", icon: "check", delay: 3 },
  { type: "members", text: "12 traders online", icon: "users", delay: 6 },
  { type: "signal", text: "TP1 Hit!", icon: "target", delay: 9 },
];

function FloatingNotification({ notification, index }: { notification: typeof floatingNotifications[0]; index: number }) {
  const positions = [
    { top: "15%", right: "-80px" },
    { top: "40%", left: "-90px" },
    { top: "65%", right: "-75px" },
    { top: "calc(85% - 15px)", left: "-85px" },
  ];
  
  const pos = positions[index % positions.length];
  
  return (
    <div 
      className="absolute hidden xl:flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a2420]/90 backdrop-blur-sm border border-[#2bb32a]/30 shadow-lg animate-float-notification"
      style={{ 
        ...pos,
        animationDelay: `${notification.delay}s`,
      }}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
        notification.type === 'profit' ? 'bg-[#2bb32a]' : 
        notification.type === 'signal' ? 'bg-[#2bb32a]/20' : 
        'bg-[#3d544d]'
      }`}>
        {notification.icon === 'check' && <Check className="w-4 h-4 text-white" />}
        {notification.icon === 'arrow' && <ArrowRight className="w-4 h-4 text-[#2bb32a]" />}
        {notification.icon === 'users' && <Users className="w-4 h-4 text-[#2bb32a]" />}
        {notification.icon === 'target' && <Target className="w-4 h-4 text-[#2bb32a]" />}
      </div>
      <span className={`text-sm font-medium whitespace-nowrap ${
        notification.type === 'profit' ? 'text-[#2bb32a]' : 'text-white'
      }`}>
        {notification.text}
      </span>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: "380px", height: "720px" }}>
      {/* Glow effect behind phone */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2bb32a]/30 to-transparent rounded-[3rem] blur-2xl scale-110" />
      
      {/* Phone frame */}
      <div className="relative w-full h-full bg-[#1a1a1a] rounded-[3rem] border-[12px] border-[#333] shadow-2xl overflow-hidden">
        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-full z-20" />
        
        {/* Screen content */}
        <div className="absolute inset-0 bg-[#0e1621] flex flex-col overflow-hidden">
          {/* Status bar area */}
          <div className="h-12 flex-shrink-0" />
          
          {/* Telegram header */}
          <div className="px-3 py-2 bg-[#17212b] flex items-center gap-2 flex-shrink-0 border-b border-[#0e1621]">
            <ChevronLeft className="w-6 h-6 text-[#6ab2f2]" />
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2bb32a] to-[#1a8c1a] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-[14px] truncate">EntryLab VIP Signals</p>
              <p className="text-[#6d7f8f] text-[11px]">4,823 subscribers</p>
            </div>
            <Bell className="w-5 h-5 text-[#6d7f8f]" />
          </div>
          
          {/* Pinned message */}
          <div className="px-3 py-2 bg-[#1b2735] flex items-center gap-2 flex-shrink-0 border-l-2 border-[#6ab2f2]">
            <Pin className="w-4 h-4 text-[#6ab2f2] rotate-45" />
            <div className="flex-1 min-w-0">
              <p className="text-[#6ab2f2] text-[11px] font-medium">Pinned Message</p>
              <p className="text-[#6d7f8f] text-[11px] truncate">Active: XAU/USD BUY @ 2,645.50</p>
            </div>
          </div>
          
          {/* Messages container with animation */}
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#0e1621] to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0e1621] to-transparent z-10" />
            
            {/* Scrolling messages */}
            <div className="animate-telegram-scroll px-3 pt-3">
              {[...telegramMessages, ...telegramMessages].map((msg, i) => (
                <TelegramMessage key={i} message={msg} index={i} />
              ))}
            </div>
          </div>
          
          {/* Input bar */}
          <div className="px-3 py-2 bg-[#17212b] flex items-center gap-2 flex-shrink-0">
            <div className="flex-1 bg-[#242f3d] rounded-full px-4 py-2 flex items-center">
              <span className="text-[#6d7f8f] text-[13px]">Message...</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#5288c1] flex items-center justify-center flex-shrink-0">
              <SiTelegram className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* Home indicator area */}
          <div className="h-6 flex-shrink-0 flex items-center justify-center">
            <div className="w-28 h-1 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
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
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
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
                {[
                  { initial: 'M', bg: 'bg-[#2bb32a]' },
                  { initial: 'S', bg: 'bg-[#229ED9]' },
                  { initial: 'D', bg: 'bg-[#f59e0b]' },
                  { initial: 'J', bg: 'bg-[#ec4899]' },
                ].map((avatar, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full ${avatar.bg} border-2 border-[#1a1e1c] flex items-center justify-center`}>
                    <span className="text-sm font-medium text-white">{avatar.initial}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white font-semibold">4,800+</p>
                <p className="text-[#adb2b1] text-sm">Active traders worldwide</p>
              </div>
            </div>
          </div>

          {/* Hero Visual - iPhone Mockup with Telegram */}
          {/* Desktop version - full phone */}
          <div className="relative hidden lg:flex justify-center">
            {/* Decorative green rings */}
            <div className="absolute w-[500px] h-[500px] rounded-full border border-[#2bb32a]/10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute w-[600px] h-[600px] rounded-full border border-[#2bb32a]/5 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            
            {/* Floating notifications */}
            {floatingNotifications.map((notification, i) => (
              <FloatingNotification key={i} notification={notification} index={i} />
            ))}
            
            {/* Social proof badge - top right */}
            <div className="absolute -top-4 right-0 xl:right-8 hidden xl:flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a2420]/80 backdrop-blur-sm border border-[#3d544d]">
              <div className="w-2 h-2 rounded-full bg-[#2bb32a] animate-pulse" />
              <span className="text-white text-sm font-medium">4.8k traders online</span>
            </div>
            
            {/* Win rate badge - bottom left */}
            <div className="absolute -bottom-4 left-0 xl:-left-[3px] hidden xl:flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1a2420]/80 backdrop-blur-sm border border-[#2bb32a]/30">
              <div className="w-10 h-10 rounded-full bg-[#2bb32a]/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#2bb32a]" />
              </div>
              <div>
                <p className="text-[#2bb32a] font-bold text-lg">87%</p>
                <p className="text-[#8b9a8c] text-xs">Win Rate</p>
              </div>
            </div>
            
            <PhoneMockup />
          </div>

          {/* Mobile version - phone with stats card below */}
          <div className="relative lg:hidden mt-8 flex flex-col items-center overflow-visible">
            {/* Phone mockup - larger size */}
            <div className="relative w-[85vw] max-w-[340px]" style={{ height: "520px" }}>
              <div className="absolute inset-0 bg-[#1a1a1a] rounded-[2.5rem] border-[10px] border-[#333] shadow-2xl overflow-hidden">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20" />
                <div className="absolute inset-0 bg-[#0e1621] flex flex-col overflow-hidden">
                  <div className="h-10 flex-shrink-0" />
                  <div className="px-3 py-2 bg-[#17212b] flex items-center gap-2 flex-shrink-0 border-b border-[#0e1621]">
                    <ChevronLeft className="w-5 h-5 text-[#6ab2f2]" />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2bb32a] to-[#1a8c1a] flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-[13px] truncate">EntryLab VIP Signals</p>
                      <p className="text-[#6d7f8f] text-[10px]">4,823 subscribers</p>
                    </div>
                    <Bell className="w-4 h-4 text-[#6d7f8f]" />
                  </div>
                  <div className="px-3 py-1.5 bg-[#1b2735] flex items-center gap-2 flex-shrink-0 border-l-2 border-[#6ab2f2]">
                    <Pin className="w-3 h-3 text-[#6ab2f2] rotate-45" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#6ab2f2] text-[10px] font-medium">Pinned Message</p>
                      <p className="text-[#6d7f8f] text-[10px] truncate">Active: XAU/USD BUY @ 2,645.50</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                    <div className="animate-telegram-scroll px-3 pt-2">
                      {[...telegramMessages, ...telegramMessages].map((msg, i) => (
                        <TelegramMessage key={i} message={msg} index={i} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats card below phone - overlapping slightly */}
            <div className="relative -mt-8 w-[98vw] max-w-[400px] z-10">
              <div className="bg-[#1a2420]/90 backdrop-blur-xl border border-[#2bb32a]/35 rounded-2xl py-6 px-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="text-center">
                    <p className="text-white text-3xl font-bold">87%</p>
                    <p className="text-[#7ba686] text-sm mt-1">Win Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-3xl font-bold">4.8k+</p>
                    <p className="text-[#7ba686] text-sm mt-1">Active Traders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-3xl font-bold">2,400+</p>
                    <p className="text-[#7ba686] text-sm mt-1">Signals Delivered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-3xl font-bold">$2.1M+</p>
                    <p className="text-[#7ba686] text-sm mt-1">Profits Generated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Stats Bar - hidden on mobile since it's in the phone overlay */}
      <section className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 -mt-8 hidden lg:block">
        <div className="signals-stats-bar">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <p className="signals-stat-value text-[38px]" data-testid={`stat-value-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>{stat.value}</p>
                <p className="signals-stat-label mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* How It Works - Data Flow Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 overflow-hidden">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It <span className="signals-gradient-text">Works</span>
          </h2>
          <p className="text-[#adb2b1] text-lg max-w-2xl mx-auto">
            Our signals are crafted through a comprehensive analysis pipeline, combining multiple data sources with expert human review
          </p>
        </div>

        {/* Desktop Flow Diagram */}
        <div className="hidden lg:block relative">
          <div className="relative grid grid-cols-[200px_1fr_144px_1fr_200px] items-center gap-4" style={{ minHeight: "280px" }}>
            {/* SVG Connection Lines - Responsive */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-0" 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(43, 179, 42, 0.2)" />
                  <stop offset="50%" stopColor="rgba(43, 179, 42, 0.8)" />
                  <stop offset="100%" stopColor="rgba(43, 179, 42, 0.4)" />
                </linearGradient>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(34, 158, 217, 0.4)" />
                  <stop offset="50%" stopColor="rgba(34, 158, 217, 1)" />
                  <stop offset="100%" stopColor="rgba(34, 158, 217, 0.6)" />
                </linearGradient>
                <filter id="glowBlue" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {/* Green lines from sources to center */}
              <path d="M 18 25 Q 32 25 40 50" stroke="url(#greenGradient)" strokeWidth="0.5" fill="none" className="animated-path" filter="url(#glowGreen)" style={{ animationDelay: "0s" }} />
              <path d="M 18 50 L 40 50" stroke="url(#greenGradient)" strokeWidth="0.5" fill="none" className="animated-path" filter="url(#glowGreen)" style={{ animationDelay: "0.5s" }} />
              <path d="M 18 75 Q 32 75 40 50" stroke="url(#greenGradient)" strokeWidth="0.5" fill="none" className="animated-path" filter="url(#glowGreen)" style={{ animationDelay: "1s" }} />
              {/* Blue line from center to Telegram */}
              <line x1="57" y1="50" x2="83" y2="50" stroke="#229ED9" strokeWidth="0.6" filter="url(#glowBlue)" className="animated-path" style={{ animationDelay: "1.5s" }} />
            </svg>

            {/* Left Column - Data Sources */}
            <div className="flex flex-col gap-5 z-10">
              <div className="data-flow-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                  <SiX className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">X / Twitter API</p>
                  <p className="text-[#8b9a8c] text-xs">Sentiment Data</p>
                </div>
              </div>
              
              <div className="data-flow-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2bb32a]/20 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-[#2bb32a]" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Market Data</p>
                  <p className="text-[#8b9a8c] text-xs">Price Action</p>
                </div>
              </div>
              
              <div className="data-flow-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-[#f59e0b]" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Fundamentals</p>
                  <p className="text-[#8b9a8c] text-xs">Economic Data</p>
                </div>
              </div>
            </div>

            {/* Spacer for grid */}
            <div />

            {/* Center - Analysis Hub */}
            <div className="relative flex justify-center z-10">
              <div className="absolute inset-0 bg-[#2bb32a]/20 rounded-full blur-3xl scale-150 glow-pulse" />
              <div className="data-flow-center w-36 h-36 flex flex-col items-center justify-center relative z-10">
                <div className="w-12 h-12 rounded-full bg-[#2bb32a]/30 flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-[#2bb32a]" />
                </div>
                <p className="text-white font-semibold text-sm">Analysis</p>
                <p className="text-[#8b9a8c] text-xs">Team</p>
              </div>
            </div>

            {/* Blue line connector with traveling orb */}
            <div className="flex items-center justify-center">
              <div className="w-full h-0.5 bg-gradient-to-r from-[#2bb32a]/30 via-[#229ED9]/60 to-[#229ED9]/80 relative overflow-visible">
                {/* Static glow */}
                <div className="absolute inset-0 shadow-[0_0_8px_#229ED9]" />
                {/* Traveling orb */}
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#229ED9] shadow-[0_0_12px_#229ED9,0_0_24px_#229ED9,0_0_36px_rgba(34,158,217,0.5)] animate-travel-orb" />
              </div>
            </div>

            {/* Right - Telegram Output */}
            <div className="z-10">
              <div className="data-flow-card flex items-center gap-3 border-[#229ED9]/30 hover:border-[#229ED9]/60 hover:shadow-[0_0_30px_rgba(34,158,217,0.2)]">
                <div className="w-12 h-12 rounded-xl bg-[#229ED9] flex items-center justify-center flex-shrink-0">
                  <SiTelegram className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Telegram</p>
                  <p className="text-[#8b9a8c] text-xs">EntryLab VIP</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Flow Diagram */}
        <div className="lg:hidden space-y-4">
          {/* Data Sources */}
          <div className="grid grid-cols-3 gap-3">
            <div className="data-flow-card flex flex-col items-center text-center p-4">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center mb-2">
                <SiX className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-medium text-xs">X API</p>
            </div>
            <div className="data-flow-card flex flex-col items-center text-center p-4">
              <div className="w-10 h-10 rounded-xl bg-[#2bb32a]/20 flex items-center justify-center mb-2">
                <BarChart3 className="w-5 h-5 text-[#2bb32a]" />
              </div>
              <p className="text-white font-medium text-xs">Markets</p>
            </div>
            <div className="data-flow-card flex flex-col items-center text-center p-4">
              <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/20 flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <p className="text-white font-medium text-xs">Fundamentals</p>
            </div>
          </div>

          {/* Flow Arrow Down */}
          <div className="flex justify-center py-2">
            <div className="w-0.5 h-8 bg-gradient-to-b from-[#2bb32a] to-[#2bb32a]/30 relative">
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-[#2bb32a]/30" />
            </div>
          </div>

          {/* Analysis Hub */}
          <div className="flex justify-center">
            <div className="data-flow-card flex items-center gap-4 px-6">
              <div className="w-12 h-12 rounded-full bg-[#2bb32a]/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#2bb32a]" />
              </div>
              <div>
                <p className="text-white font-semibold">Analysis Team</p>
                <p className="text-[#8b9a8c] text-xs">Expert Review</p>
              </div>
            </div>
          </div>

          {/* Flow Arrow Down - Blue for Telegram */}
          <div className="flex justify-center py-2">
            <div className="relative">
              <div className="w-1 h-10 bg-gradient-to-b from-[#229ED9]/60 to-[#229ED9] rounded-full shadow-[0_0_12px_rgba(34,158,217,0.6)]" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#229ED9]" style={{ filter: "drop-shadow(0 0 6px rgba(34, 158, 217, 0.8))" }} />
            </div>
          </div>

          {/* Telegram Output */}
          <div className="flex justify-center">
            <div className="data-flow-card flex items-center gap-4 px-6 border-[#229ED9]/30">
              <div className="w-12 h-12 rounded-xl bg-[#229ED9] flex items-center justify-center">
                <SiTelegram className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Telegram</p>
                <p className="text-[#8b9a8c] text-xs">EntryLab VIP</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section - Proof Grid */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
        {/* Section Header - Left Aligned */}
        <div className="mb-12">
          <p className="text-[#2bb32a] font-medium tracking-wide uppercase text-sm mb-3">Core Signal Advantages</p>
          <h2 className="md:text-3xl font-semibold text-white mb-4 text-[36px]">
            Why traders choose EntryLab signals
          </h2>
          <p className="text-[#adb2b1] max-w-xl">
            Every signal is backed by quantifiable data, strict risk parameters, and verified track records.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Feature Card 1 */}
          <div className="feature-card" data-testid="card-precision-entries">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#2bb32a]/10 border border-[#2bb32a]/20">
                <Target className="w-5 h-5 text-[#2bb32a]" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Precision Entries</h3>
                <p className="text-[#adb2b1] text-sm leading-relaxed">Exact price levels with tight spreads. No vague "around this area" calls.</p>
              </div>
            </div>
          </div>

          {/* Feature Card 2 */}
          <div className="feature-card" data-testid="card-risk-management">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#2bb32a]/10 border border-[#2bb32a]/20">
                <Shield className="w-5 h-5 text-[#2bb32a]" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Defined Risk</h3>
                <p className="text-[#adb2b1] text-sm leading-relaxed">Every signal includes SL/TP levels. 1:2 minimum risk-reward ratio.</p>
              </div>
            </div>
          </div>

          {/* Feature Card 3 */}
          <div className="feature-card" data-testid="card-real-time-alerts">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#2bb32a]/10 border border-[#2bb32a]/20">
                <Zap className="w-5 h-5 text-[#2bb32a]" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Instant Delivery</h3>
                <p className="text-[#adb2b1] text-sm leading-relaxed">Telegram push notifications. Execute within seconds of signal release.</p>
              </div>
            </div>
          </div>

          {/* Feature Card 4 */}
          <div className="feature-card" data-testid="card-verified-results">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#2bb32a]/10 border border-[#2bb32a]/20">
                <TrendingUp className="w-5 h-5 text-[#2bb32a]" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Verified Track Record</h3>
                <p className="text-[#adb2b1] text-sm leading-relaxed">Public performance history. No cherry-picked screenshots.</p>
              </div>
            </div>
          </div>

          {/* Feature Card 5 */}
          <div className="feature-card" data-testid="card-market-coverage">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#2bb32a]/10 border border-[#2bb32a]/20">
                <Clock className="w-5 h-5 text-[#2bb32a]" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">24/5 Market Coverage</h3>
                <p className="text-[#adb2b1] text-sm leading-relaxed">Active during all major sessions. London, NY, and Asian overlap.</p>
              </div>
            </div>
          </div>

          {/* Feature Card 6 */}
          <div className="feature-card" data-testid="card-expert-analysis">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#2bb32a]/10 border border-[#2bb32a]/20">
                <BarChart3 className="w-5 h-5 text-[#2bb32a]" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Technical Rationale</h3>
                <p className="text-[#adb2b1] text-sm leading-relaxed">Learn the "why" behind each trade. SMC, liquidity, structure analysis.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Signal Preview Section */}
      <section id="signals" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Trade Distribution Widget */}
          <div className="order-1 lg:order-1">
            <TradeDistribution />
          </div>
          
          {/* Right Column - Text */}
          <div className="space-y-6 order-2 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              See Our Signals in Action
            </h2>
            <p className="text-[#adb2b1] text-lg leading-relaxed">
              Every signal includes precise entry, stop-loss, and take-profit levels. 
              Our methodology combines technical analysis with market structure 
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
                <span className="text-white">Verified 82% win rate</span>
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
        </div>
      </section>
      {/* Mid-page CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-20 md:py-28">
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
          <EmailCaptureForm testIdSuffix="mid" buttonText="Join Free" centered />
        </div>
      </section>
      {/* Video Testimonial Section - Modern Conversion-Optimized Design */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-20 md:py-28">
        {/* Section header with transformation angle */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#ffd700] to-[#ffd700]" />
            <span className="text-[#ffd700] text-sm font-semibold uppercase tracking-widest">Success Story</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent via-[#ffd700] to-[#ffd700]" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            From Struggling to <span className="text-[#2bb32a]">Profitable</span>
          </h2>
          <p className="text-[#adb2b1] text-lg max-w-2xl mx-auto">Watch how our premium signals transformed this Jamies results</p>
        </div>

        {/* Main video container with floating elements */}
        <div className="relative">
          {/* Ambient glow effects */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#2bb32a]/30 via-[#ffd700]/20 to-[#2bb32a]/30 rounded-3xl blur-2xl opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2bb32a]/10 to-transparent rounded-3xl blur-xl" />
          
          {/* Floating stats cards - Left side */}
          <div className="hidden lg:block absolute -left-20 top-1/4 z-20">
            <div className="bg-[#1a1e1c]/90 backdrop-blur-xl border border-[#2bb32a]/40 rounded-xl p-4 shadow-2xl shadow-[#2bb32a]/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2bb32a]/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#2bb32a]" />
                </div>
                <div>
                  <div className="text-[#2bb32a] font-bold text-xl">+847 pips</div>
                  <div className="text-[#adb2b1] text-xs">Monthly profit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating stats cards - Right side */}
          <div className="hidden lg:block absolute -right-20 top-1/3 z-20">
            <div className="bg-[#1a1e1c]/90 backdrop-blur-xl border border-[#ffd700]/40 rounded-xl p-4 shadow-2xl shadow-[#ffd700]/20 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ffd700]/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#ffd700]" />
                </div>
                <div>
                  <div className="text-[#ffd700] font-bold text-xl">82%</div>
                  <div className="text-[#adb2b1] text-xs">Win rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom floating stat */}
          <div className="hidden lg:block absolute -right-16 bottom-12 z-20">
            <div className="bg-[#1a1e1c]/90 backdrop-blur-xl border border-[#2bb32a]/40 rounded-xl p-4 shadow-2xl shadow-[#2bb32a]/20 transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2bb32a]/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#2bb32a]" />
                </div>
                <div>
                  <div className="text-white font-bold text-xl">3 Weeks</div>
                  <div className="text-[#adb2b1] text-xs">To profitability</div>
                </div>
              </div>
            </div>
          </div>

          {/* Video player container */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#1B261D] to-[#1a1e1c] border-2 border-[#2bb32a]/30 shadow-2xl">
            {/* Premium accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2bb32a] via-[#ffd700] to-[#2bb32a] z-10" />
            
            {/* Verified badge - top right */}
            <div className="absolute top-4 right-4 z-20">
              <div className="flex items-center gap-2 bg-[#ffd700] text-[#1a1e1c] px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                <Star className="w-4 h-4 fill-current" />
                <span>Verified Trader</span>
              </div>
            </div>

            <video
              className="w-full aspect-video"
              controls
              preload="metadata"
              data-testid="video-testimonial"
            >
              <source src="/assets/testimonial-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Quote callout below video */}
          <div className="relative mt-8 p-6 md:p-8 bg-gradient-to-r from-[#1B261D] to-[#1a1e1c] rounded-2xl border border-[#2bb32a]/20">
            <Quote className="absolute -top-4 left-6 w-8 h-8 text-[#ffd700] fill-[#ffd700]/20" />
            <p className="text-white text-lg md:text-xl italic leading-relaxed pl-4">
              "I went from losing trades to consistently profitable in just 3 months. The signals are incredibly accurate and the risk management guidance saved my account."
            </p>
            <div className="flex items-center gap-4 mt-6 pl-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2bb32a] to-[#1a1e1c] flex items-center justify-center border-2 border-[#2bb32a]/50">
                <span className="text-white font-bold">JT</span>
              </div>
              <div>
                <p className="text-white font-semibold">James Thompson</p>
                <p className="text-[#adb2b1] text-sm">Premium Member since November 2025</p>
              </div>
              <div className="ml-auto hidden sm:flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#ffd700] fill-[#ffd700]" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trust indicators - mobile stats */}
        <div className="grid grid-cols-3 gap-4 mt-8 lg:hidden">
          <div className="bg-[#1B261D]/80 backdrop-blur rounded-xl p-4 text-center border border-[#2bb32a]/20">
            <div className="text-[#2bb32a] font-bold text-lg">+847</div>
            <div className="text-[#adb2b1] text-xs">Pips/month</div>
          </div>
          <div className="bg-[#1B261D]/80 backdrop-blur rounded-xl p-4 text-center border border-[#ffd700]/20">
            <div className="text-[#ffd700] font-bold text-lg">82%</div>
            <div className="text-[#adb2b1] text-xs">Win rate</div>
          </div>
          <div className="bg-[#1B261D]/80 backdrop-blur rounded-xl p-4 text-center border border-[#2bb32a]/20">
            <div className="text-white font-bold text-lg">3 mo</div>
            <div className="text-[#adb2b1] text-xs">To profit</div>
          </div>
        </div>

        {/* Social proof strip */}
        <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm">
          <div className="flex items-center gap-2 text-[#adb2b1]">
            <div className="w-5 h-5 rounded-full bg-[#2bb32a] flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span>Real subscriber video</span>
          </div>
          <div className="flex items-center gap-2 text-[#adb2b1]">
            <div className="w-5 h-5 rounded-full bg-[#2bb32a] flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span>Unscripted testimonial</span>
          </div>
          <div className="flex items-center gap-2 text-[#adb2b1]">
            <div className="w-5 h-5 rounded-full bg-[#2bb32a] flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span>Verified trading results</span>
          </div>
        </div>
      </section>
      {/* Testimonials - Scrolling Rows */}
      <section id="testimonials" className="relative z-10 py-20 md:py-28 overflow-hidden">
        {/* Bottom gradient fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-16 md:h-32 bg-gradient-to-t from-[#1a1e1c] via-[#1a1e1c]/60 to-transparent pointer-events-none z-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Reviews from our Clients
          </h2>
          <p className="text-[#adb2b1] text-center max-w-2xl mx-auto">
            Real traders sharing their experience with EntryLab signals. Verified results, honest feedback.
          </p>
        </div>
        
        {/* Top row - scrolls right */}
        <div className="relative mb-6 overflow-hidden">
          <div className="flex gap-6 animate-scroll-right" style={{ width: 'max-content' }}>
            {[...scrollingTestimonials.topRow, ...scrollingTestimonials.topRow].map((testimonial, i) => {
              const avatarColors = ['#2bb32a', '#3b82f6', '#f97316', '#ec4899'];
              const colorIndex = i % avatarColors.length;
              return (
                <div 
                  key={i} 
                  className="flex-shrink-0 w-[300px] md:w-[480px] bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl p-4 md:p-6 hover:border-[#3a3a3e] transition-colors"
                  data-testid={`testimonial-top-${i}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: avatarColors[colorIndex] }}
                    >
                      <span className="text-white font-medium text-sm">{testimonial.avatar}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{testimonial.author}</p>
                      <p className="text-[#6b7280] text-sm">{testimonial.role}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star key={starIdx} className="w-4 h-4 text-[#00b67a] fill-[#00b67a]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[#e5e7eb] leading-relaxed">
                    I love <span className="text-[#2bb32a]">EntryLab signals</span> {testimonial.quote.toLowerCase()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Bottom row - scrolls left */}
        <div className="relative overflow-hidden">
          <div className="flex gap-6 animate-scroll-left" style={{ width: 'max-content' }}>
            {[...scrollingTestimonials.bottomRow, ...scrollingTestimonials.bottomRow].map((testimonial, i) => {
              const avatarColors = ['#f97316', '#ec4899', '#2bb32a', '#3b82f6'];
              const colorIndex = i % avatarColors.length;
              return (
                <div 
                  key={i} 
                  className="flex-shrink-0 w-[300px] md:w-[480px] bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl p-4 md:p-6 hover:border-[#3a3a3e] transition-colors"
                  data-testid={`testimonial-bottom-${i}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: avatarColors[colorIndex] }}
                    >
                      <span className="text-white font-medium text-sm">{testimonial.avatar}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{testimonial.author}</p>
                      <p className="text-[#6b7280] text-sm">{testimonial.role}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star key={starIdx} className="w-4 h-4 text-[#00b67a] fill-[#00b67a]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[#e5e7eb] leading-relaxed">
                    I love <span className="text-[#2bb32a]">EntryLab signals</span> {testimonial.quote.toLowerCase()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Fade edges - responsive: narrow on mobile, wider on desktop */}
        <div className="absolute left-0 top-0 bottom-0 w-12 md:w-48 bg-gradient-to-r from-[#1a1e1c] via-[#1a1e1c]/80 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-12 md:w-48 bg-gradient-to-l from-[#1a1e1c] via-[#1a1e1c]/80 to-transparent pointer-events-none z-10" />
      </section>

      {/* Mid-page CTA - Free Channel */}
      <section className="relative z-10 py-16 md:py-24 bg-dot-pattern border-y border-[#2bb32a]/30">
        {/* Top gradient stroke */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2bb32a]/60 to-transparent" />
        {/* Bottom gradient stroke */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2bb32a]/60 to-transparent" />
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Get a Taste of Our Signals
          </h2>
          <p className="text-[#adb2b1] text-lg mb-8 max-w-xl mx-auto">
            Join our free Telegram channel and see our analysis in action. Get 2-3 signals weekly to experience the quality before upgrading.
          </p>
          <EmailCaptureForm testIdSuffix="mid-cta" buttonText="Get Free Access" centered />
          <p className="text-[#6b7280] text-sm mt-4">
            No credit card required. Instant Telegram access.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-20 md:py-28">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
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
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Start Trading Smarter Today
            </h2>
            <p className="text-[#adb2b1] text-lg max-w-md">
              Join our free Telegram channel and see why thousands of traders trust EntryLab for XAU/USD signals.
            </p>
            <EmailCaptureForm testIdSuffix="footer" centered />
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
