import { CheckCircle2, TrendingUp, Shield, Zap, DollarSign, Globe, Star, ArrowRight, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackAffiliateClick } from "@/lib/gtm";
import { Link } from "wouter";

interface FeaturedBrokerProps {
  name: string;
  logo: string;
  tagline: string;
  rating: number;
  features: Array<{ icon: string; text: string }>;
  highlights: string[];
  bonusOffer?: string;
  link: string;
  reviewLink?: string;
}

const iconMap: Record<string, any> = {
  "trending": TrendingUp,
  "shield": Shield,
  "zap": Zap,
  "dollar": DollarSign,
  "globe": Globe,
  "star": Star,
};

export function FeaturedBroker({ name, logo, tagline, rating, features, highlights, bonusOffer, link, reviewLink }: FeaturedBrokerProps) {
  return (
    <section
      className="py-12 md:py-16"
      style={{
        borderTop: "1px solid #e8edea",
        borderBottom: "1px solid #e8edea",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-6">
          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-featured-title">
            Featured Broker of the Week
          </h2>
        </div>

        <Card className="overflow-hidden shadow-md" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
          <div className="grid md:grid-cols-[300px,1fr] gap-0">
            {/* Left Side */}
            <div
              className="p-8 flex flex-col items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(43,179,42,0.07) 0%, rgba(255,255,255,0.6) 100%)",
                borderRight: "1px solid #e8edea",
              }}
            >
              <div
                className="w-40 h-40 bg-white rounded-2xl flex items-center justify-center mb-4 p-6"
                style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <img src={logo} alt={name} loading="lazy" width="160" height="160" className="w-full h-full object-contain rounded-xl" data-testid="img-featured-logo" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center" data-testid="text-featured-name">{name}</h3>
              <p className="text-gray-500 text-center mb-4 text-sm">{tagline}</p>

              <div className="flex items-center gap-1.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.floor(rating) ? "text-amber-500 fill-amber-500" : "text-gray-200 fill-gray-200"}`}
                  />
                ))}
                <span className="text-base font-semibold text-gray-800 ml-0.5">{rating}/5</span>
              </div>

              {bonusOffer && bonusOffer.trim() && (
                <div
                  className="mb-4 text-center px-4 py-2 rounded-xl text-sm font-medium w-full"
                  style={{
                    background: "rgba(43,179,42,0.08)",
                    border: "1px dashed rgba(43,179,42,0.35)",
                    color: "#186818",
                  }}
                  data-testid="badge-bonus"
                >
                  {bonusOffer}
                </div>
              )}

              <div className="w-full space-y-3">
                <Button
                  asChild
                  size="lg"
                  className="w-full shadow-sm"
                  data-testid="button-featured-cta"
                  onClick={() => trackAffiliateClick({
                    broker_name: name,
                    broker_type: 'broker',
                    page_location: 'home',
                    placement_type: 'featured_widget',
                    rating: rating,
                    affiliate_link: link
                  })}
                >
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>

                {reviewLink && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full"
                    data-testid="button-read-review"
                  >
                    <Link href={reviewLink}>
                      <FileText className="mr-2 h-4 w-4" />
                      Read Review
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Right Side */}
            <div className="p-8 bg-white">
              <div className="mb-8">
                <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(43,179,42,0.10)" }}>
                    <Zap className="h-4 w-4" style={{ color: "#2bb32a" }} />
                  </div>
                  Key Features
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {features.map((feature, index) => {
                    const Icon = iconMap[feature.icon] || CheckCircle2;
                    return (
                      <div key={index} className="flex items-center gap-3" data-testid={`feature-${index}`}>
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: "rgba(43,179,42,0.08)" }}
                        >
                          <Icon className="h-5 w-5" style={{ color: "#2bb32a" }} />
                        </div>
                        <p className="text-gray-700 font-medium text-sm">{feature.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(43,179,42,0.10)" }}>
                    <CheckCircle2 className="h-4 w-4" style={{ color: "#2bb32a" }} />
                  </div>
                  Why Traders Choose {name}
                </h4>
                <div className="space-y-3">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-3" data-testid={`highlight-${index}`}>
                      <div
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(43,179,42,0.12)" }}
                      >
                        <CheckCircle2 className="h-3 w-3" style={{ color: "#2bb32a" }} />
                      </div>
                      <p className="text-gray-600 text-sm">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
