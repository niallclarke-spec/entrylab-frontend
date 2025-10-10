import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BrokerAlertPopupProps {
  brokerId: string;
  brokerName: string;
  brokerType: "broker" | "prop-firm";
}

export function BrokerAlertPopup({ brokerId, brokerName, brokerType }: BrokerAlertPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  // Calculate dynamic trader count (72 + days since Oct 10, 2025 × 2)
  const getTraderCount = () => {
    const baseCount = 72;
    const dailyIncrease = 2;
    const launchDate = new Date('2025-10-10');
    const today = new Date();
    const daysSinceLaunch = Math.floor((today.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));
    return baseCount + (daysSinceLaunch * dailyIncrease);
  };

  const traderCount = getTraderCount();

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/broker-alerts/subscribe", {
        email,
        firstName,
        brokerId,
        brokerName,
      });
      return res.json();
    },
    onSuccess: () => {
      // Track GTM event
      if (window.dataLayer) {
        window.dataLayer.push({
          event: "broker_alert_signup",
          broker_name: brokerName,
          broker_type: brokerType,
          broker_id: brokerId,
        });
      }

      toast({
        title: "Success!",
        description: `You'll get exclusive ${brokerName} bonuses first!`,
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
    if (!firstName.trim() || !email.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your name and email",
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
    
    if (alreadySubscribed) {
      return;
    }

    // Check 24-hour cooldown
    if (dismissedAt) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        return;
      }
    }

    let scrollTriggered = false;
    let timeTriggered = false;

    // Scroll depth trigger (60%)
    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      if (scrollPercentage >= 60 && !scrollTriggered) {
        scrollTriggered = true;
        setIsVisible(true);
        
        // Track popup view
        if (window.dataLayer) {
          window.dataLayer.push({
            event: "broker_alert_popup_view",
            broker_name: brokerName,
            broker_type: brokerType,
            trigger: "scroll_60%",
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
  }, [brokerId, brokerName, brokerType]);

  if (!isVisible) return null;

  const popupContent = (
    <div className="fixed inset-0 z-[99999] flex items-end justify-end p-4 sm:p-6 pointer-events-none">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full sm:w-[400px] p-6 pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-close-alert-popup"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Never Miss Exclusive Bonuses from {brokerName}
            </h3>
            <p className="text-sm text-muted-foreground">
              Get notified when we uncover deposit bonuses or breaking news about {brokerName}
            </p>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-foreground">
              <span className="font-bold text-primary">{traderCount} traders</span> received exclusive bonuses worth up to 35% from {brokerName} through our alerts
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              data-testid="input-alert-firstname"
            />
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-alert-email"
            />
            <Button
              type="submit"
              className="w-full"
              disabled={subscribeMutation.isPending}
              data-testid="button-subscribe-alerts"
            >
              {subscribeMutation.isPending ? "Subscribing..." : "Get Exclusive Alerts"}
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
  );

  // Create portal for popup
  return createPortal(popupContent, document.body);
}
