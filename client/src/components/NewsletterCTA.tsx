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
        body: JSON.stringify({ email, source: "Home Page" }),
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
    { icon: TrendingUp, text: "Breaking news about your favourite brokers and prop firms", color: "text-primary" },
    { icon: Gift, text: "Discounts, competitions and bonuses", color: "text-amber-500 dark:text-amber-400" },
  ];

  return (
    <section className="bg-background border-y">
      <div className="max-w-7xl mx-auto px-8 md:px-12 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground" data-testid="text-newsletter-title">
                Never Miss Out
              </h2>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                Free
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground mb-10">
              Join thousands of traders getting exclusive promos, bonuses, and breaking news from the forex & prop firm industry
            </p>
            <div className="space-y-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex items-start gap-3" data-testid={`text-benefit-${index}`}>
                    <div className={`rounded-lg p-2.5 bg-muted/50 ${benefit.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-base text-foreground leading-relaxed flex-1 pt-1">{benefit.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-card/50 rounded-2xl p-8 md:p-10 border border-border/50">
            <form onSubmit={handleSubscribe} className="space-y-6">
              <div>
                <label htmlFor="newsletter-email" className="block text-sm font-medium text-foreground mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="newsletter-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-background border-border text-base"
                    required
                    data-testid="input-newsletter-email"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base" 
                disabled={isSubmitting} 
                data-testid="button-subscribe"
              >
                {isSubmitting ? "Subscribing..." : "Subscribe Now"}
              </Button>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-sm font-medium text-foreground">12,000+ Subscribers</span>
                <span className="text-sm text-muted-foreground">•</span>
                <p className="text-sm text-muted-foreground">
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
