import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Subscribed!",
      description: "You'll receive the latest forex news and updates.",
    });
    setEmail("");
  };

  const benefits = [
    "Daily market analysis and insights",
    "Exclusive broker and prop firm reviews",
    "Breaking news alerts",
    "Trading tips and strategies",
  ];

  return (
    <section className="bg-card border-y">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-newsletter-title">
              Stay Up To Date
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              From broker and prop firm news to in-depth reviews, we keep our subscribers up to date on everything
            </p>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3" data-testid={`text-benefit-${index}`}>
                  <CheckCircle2 className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
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
                    className="pl-10"
                    required
                    data-testid="input-newsletter-email"
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full" data-testid="button-subscribe">
                Subscribe Now
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
