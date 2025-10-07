import { Gift, TrendingUp, Trophy, Mail, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { trackNewsletterSignup } from "@/lib/gtm";

export function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Subscription failed");
      }

      trackNewsletterSignup(email, 'newsletter_cta');

      toast({
        title: "Subscribed!",
        description: "You'll receive the latest forex news and updates.",
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Subscription Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: Gift, text: "Exclusive deposit bonuses & promotions", color: "text-amber-500" },
    { icon: Trophy, text: "Free funded challenge giveaways", color: "text-amber-500" },
    { icon: Rocket, text: "Prop firm discount codes & launches", color: "text-primary" },
    { icon: TrendingUp, text: "Broker reviews & industry insights", color: "text-chart-2" },
  ];

  return (
    <section className="bg-card border-y">
      <div className="max-w-7xl mx-auto px-8 md:px-12 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground" data-testid="text-newsletter-title">
                Never Miss Out
              </h2>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hidden md:inline-flex">
                Free
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of traders getting exclusive promos, bonuses, and breaking news from the forex & prop firm industry
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex items-start gap-3" data-testid={`text-benefit-${index}`}>
                    <div className={`rounded-lg p-2 bg-muted/50 ${benefit.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-foreground leading-relaxed flex-1">{benefit.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-muted/30 rounded-xl p-6 md:p-8 border">
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <label htmlFor="newsletter-email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="newsletter-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background"
                    required
                    data-testid="input-newsletter-email"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="w-full relative animate-pulse-glow" 
                disabled={isSubmitting} 
                data-testid="button-subscribe"
              >
                {isSubmitting ? "Subscribing..." : "Subscribe Now"}
              </Button>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Badge variant="secondary" className="text-xs">
                  12,000+ Subscribers
                </Badge>
                <span className="text-xs text-muted-foreground">•</span>
                <p className="text-xs text-muted-foreground">
                  Unsubscribe anytime
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
