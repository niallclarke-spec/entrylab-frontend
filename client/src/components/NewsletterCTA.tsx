import { Gift, TrendingUp, Mail } from "lucide-react";
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "Home Page" }),
      });

      if (!response.ok) throw new Error("Subscription failed");

      const trimmedEmail = email.trim();
      const emailDomain = trimmedEmail.includes("@")
        ? trimmedEmail.split("@")[1]
        : "unknown";

      if (window.dataLayer) {
        window.dataLayer.push({
          event: "homepage_newsletter_signup",
          email_domain: emailDomain,
          signup_location: "home_page",
        });
      }

      trackNewsletterSignup(trimmedEmail, "newsletter_cta");

      toast({
        title: "Subscribed!",
        description: "You'll receive the latest forex news and updates.",
      });
      setEmail("");
    } catch {
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
    {
      icon: TrendingUp,
      text: "Breaking news about your favourite brokers and prop firms",
    },
    {
      icon: Gift,
      text: "Discounts, competitions and bonuses",
    },
  ];

  return (
    <section className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2
                className="text-3xl md:text-4xl font-bold text-gray-900"
                data-testid="text-newsletter-title"
              >
                Never Miss Out
              </h2>
              <Badge
                className="text-xs font-semibold text-white border-0"
                style={{ background: "#2bb32a" }}
              >
                Free
              </Badge>
            </div>
            <p className="text-lg text-gray-500 mb-10">
              Join thousands of traders getting exclusive promos, bonuses, and
              breaking news from the forex & prop firm industry
            </p>
            <div className="space-y-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3"
                    data-testid={`text-benefit-${index}`}
                  >
                    <div
                      className="rounded-lg p-2.5 flex-shrink-0"
                      style={{ background: "rgba(43,179,42,0.10)" }}
                    >
                      <Icon className="h-5 w-5" style={{ color: "#2bb32a" }} />
                    </div>
                    <span className="text-base text-gray-700 leading-relaxed flex-1 pt-1">
                      {benefit.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — form card */}
          <div
            className="rounded-2xl p-8 md:p-10"
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}
          >
            <form onSubmit={handleSubscribe} className="space-y-5">
              <div>
                <label
                  htmlFor="newsletter-email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="newsletter-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg text-sm bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all"
                    style={{ focusRingColor: "#2bb32a" } as React.CSSProperties}
                    required
                    data-testid="input-newsletter-email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg font-semibold text-white text-sm transition-all"
                style={{ background: isSubmitting ? "#6b7280" : "#2bb32a" }}
                onMouseEnter={(e) => {
                  if (!isSubmitting)
                    (e.currentTarget as HTMLButtonElement).style.background = "#239122";
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting)
                    (e.currentTarget as HTMLButtonElement).style.background = "#2bb32a";
                }}
                data-testid="button-subscribe"
              >
                {isSubmitting ? "Subscribing…" : "Subscribe Now"}
              </button>

              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-sm font-medium text-gray-800">
                  12,000+ Subscribers
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-400">Unsubscribe anytime</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
