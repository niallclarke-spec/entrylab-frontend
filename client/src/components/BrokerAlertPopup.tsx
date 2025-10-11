import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Gift, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getBrandStats, getBrandMessage } from "@/lib/brandStats";

interface BrokerAlertPopupProps {
  brokerId: string;
  brokerName: string;
  brokerLogo: string;
  brokerType: "broker" | "prop-firm";
  scrollThreshold?: number; // Optional scroll percentage (default: 60)
}

// Helper function to normalize brand names for GTM event names
const normalizeEventName = (brandName: string): string => {
  return brandName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove all non-alphanumeric except spaces
    .replace(/\s+/g, '_')         // Replace spaces with underscores
    .replace(/^_+|_+$/g, '');     // Remove leading/trailing underscores
};

export function BrokerAlertPopup({ brokerId, brokerName, brokerLogo, brokerType, scrollThreshold = 60 }: BrokerAlertPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  // Get brand-specific stats
  const brandStats = getBrandStats(brokerName, brokerType);
  const traderCount = brandStats.traderCount;
  const dollarValue = brandStats.dollarValue;

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/broker-alerts/subscribe", {
        email,
        firstName: "",
        brokerId,
        brokerName,
      });
      return res.json();
    },
    onSuccess: () => {
      // Track brand-specific GTM event with sanitized event name
      const eventName = `${normalizeEventName(brokerName)}_popup_signup`;
      if (window.dataLayer) {
        window.dataLayer.push({
          event: eventName,
          broker_name: brokerName,
          broker_type: brokerType,
          broker_id: brokerId,
        });
      }

      toast({
        title: "🎉 VIP Access Activated!",
        description: `You'll get ${brokerName} bonuses & VIP competitions before anyone else!`,
      });

      // Mark as subscribed in localStorage
      localStorage.setItem(`broker-alert-subscribed-${brokerId}`, "true");
      setIsVisible(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your email",
        variant: "destructive",
      });
      return;
    }
    subscribeMutation.mutate();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Set 24-hour cooldown
    localStorage.setItem(`broker-alert-dismissed-${brokerId}`, Date.now().toString());

    // Track dismissal
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "broker_alert_dismissed",
        broker_name: brokerName,
        broker_type: brokerType,
      });
    }
  };

  useEffect(() => {
    // Check if already subscribed or recently dismissed
    const alreadySubscribed = localStorage.getItem(`broker-alert-subscribed-${brokerId}`);
    const dismissedAt = localStorage.getItem(`broker-alert-dismissed-${brokerId}`);
    
    console.log(`[BrokerAlertPopup] Initializing for ${brokerName} (ID: ${brokerId})`);
    console.log(`[BrokerAlertPopup] Scroll threshold: ${scrollThreshold}%`);
    console.log(`[BrokerAlertPopup] Already subscribed:`, alreadySubscribed);
    console.log(`[BrokerAlertPopup] Dismissed at:`, dismissedAt);
    
    if (alreadySubscribed) {
      console.log(`[BrokerAlertPopup] Blocked: Already subscribed`);
      return;
    }

    // Check 24-hour cooldown
    if (dismissedAt) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      console.log(`[BrokerAlertPopup] Hours since dismissed:`, hoursSinceDismissed);
      if (hoursSinceDismissed < 24) {
        console.log(`[BrokerAlertPopup] Blocked: 24-hour cooldown active`);
        return;
      }
    }

    let scrollTriggered = false;
    let timeTriggered = false;

    // Scroll depth trigger (customizable threshold)
    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      // Debug: Log scroll percentage every 10%
      if (scrollPercentage % 10 < 1) {
        console.log(`[BrokerAlertPopup] Scroll: ${scrollPercentage.toFixed(1)}% (threshold: ${scrollThreshold}%)`);
      }
      
      if (scrollPercentage >= scrollThreshold && !scrollTriggered) {
        scrollTriggered = true;
        console.log(`[BrokerAlertPopup] ✅ Scroll threshold reached! Showing popup`);
        setIsVisible(true);
        
        // Track popup view
        if (window.dataLayer) {
          window.dataLayer.push({
            event: "broker_alert_popup_view",
            broker_name: brokerName,
            broker_type: brokerType,
            trigger: `scroll_${scrollThreshold}%`,
          });
        }
      }
    };

    // Time-based trigger (45 seconds)
    const timeoutId = setTimeout(() => {
      if (!scrollTriggered && !timeTriggered) {
        timeTriggered = true;
        setIsVisible(true);

        // Track popup view
        if (window.dataLayer) {
          window.dataLayer.push({
            event: "broker_alert_popup_view",
            broker_name: brokerName,
            broker_type: brokerType,
            trigger: "45_seconds",
          });
        }
      }
    }, 45000); // 45 seconds

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [brokerId, brokerName, brokerType, scrollThreshold]);

  if (!isVisible) return null;

  const popupContent = (
    <>
      {/* Dark Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={handleDismiss}
      >
        {/* Popup Card */}
        <div 
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '450px',
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
          }}
          className="animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-close-alert-popup"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="space-y-5">
          {/* Logo and Header with Gradient Badge */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <img 
                src={brokerLogo} 
                alt={brokerName}
                className="w-20 h-20 object-contain rounded-xl bg-background p-3 border border-border"
              />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-primary/20 border border-amber-500/30 mb-2">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-amber-500">EXCLUSIVE ACCESS</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">
                {brokerType === "prop-firm" ? "Get VIP Discounts First" : "Get VIP Bonuses First"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Join {traderCount}+ traders getting early access to {brokerName} deals
              </p>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <Gift className="h-5 w-5 text-amber-500 mb-2" />
              {brokerType === "prop-firm" ? (
                <>
                  <p className="text-xs font-semibold text-foreground">Exclusive Discounts</p>
                  <p className="text-xs text-muted-foreground">Save on challenges</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-foreground">Deposit Bonuses</p>
                  <p className="text-xs text-muted-foreground">Up to 25% extra</p>
                </>
              )}
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3">
              <Trophy className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs font-semibold text-foreground">VIP Competitions</p>
              {brokerType === "prop-firm" ? (
                <p className="text-xs text-muted-foreground">Win funded accounts</p>
              ) : (
                <p className="text-xs text-muted-foreground">Win cash prizes</p>
              )}
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-center">
            <p className="text-sm text-foreground">
              <span className="font-bold text-primary">{traderCount} traders</span> {' '}
              {brokerType === "prop-firm" ? (
                <>we have saved up to <span className="font-bold text-amber-500">{dollarValue}</span> in challenge fees</>
              ) : (
                <>unlocked bonuses worth <span className="font-bold text-amber-500">{dollarValue}</span> through our alerts</>
              )}
              {brokerType === "prop-firm" ? ' 💰' : ' 🎁'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-alert-email"
              className="h-11"
            />
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
              disabled={subscribeMutation.isPending}
              data-testid="button-subscribe-alerts"
            >
              {subscribeMutation.isPending ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Activating VIP Access...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  {brokerType === "prop-firm" ? "Unlock VIP Discounts Now" : "Unlock VIP Bonuses Now"}
                </>
              )}
            </Button>
          </form>

          <button
            onClick={handleDismiss}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center"
            data-testid="button-dismiss-alert"
          >
            Maybe later
          </button>
        </div>
        </div>
      </div>
    </>
  );

  // Create portal for popup
  return createPortal(popupContent, document.body);
}
