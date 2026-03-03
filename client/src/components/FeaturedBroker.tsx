import { CheckCircle2, TrendingUp, Shield, Zap, DollarSign, Globe, Star, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      className="py-10 md:py-14"
      style={{
        borderTop: "1px solid #e8edea",
        borderBottom: "1px solid #e8edea",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Section label */}
        <div className="flex items-center gap-2 mb-5">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9ca3af" }}>
            Featured Broker of the Week
          </p>
        </div>

        {/* Glass banner — single horizontal row */}
        <div
          className="flex flex-col md:flex-row md:items-center gap-6 p-6 md:p-7 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.75)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
          data-testid="featured-broker-banner"
        >
          {/* Segment 1 — Logo + Identity */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div
              className="flex items-center justify-center p-3 flex-shrink-0"
              style={{
                width: "72px",
                height: "72px",
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: "16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              <img
                src={logo}
                alt={name}
                loading="lazy"
                width="56"
                height="56"
                className="w-full h-full object-contain rounded-xl"
                data-testid="img-featured-logo"
              />
            </div>
            <div>
              <h3
                className="text-lg font-bold leading-tight"
                style={{ color: "#111827" }}
                data-testid="text-featured-name"
              >
                {name}
              </h3>
              {tagline && (
                <p className="text-xs mt-0.5 mb-1.5" style={{ color: "#6b7280" }}>
                  {tagline}
                </p>
              )}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.floor(rating) ? "text-amber-500 fill-amber-500" : "text-gray-200 fill-gray-100"}`}
                  />
                ))}
                <span className="text-xs font-semibold ml-1" style={{ color: "#374151" }}>
                  {rating}/5
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            className="hidden md:block flex-shrink-0 self-stretch"
            style={{ width: "1px", background: "rgba(0,0,0,0.08)", minHeight: "60px" }}
          />

          {/* Segment 2 — Highlights as pills */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9ca3af" }}>
              Why traders choose {name}
            </p>
            <div className="flex flex-wrap gap-2">
              {highlights.slice(0, 4).map((h, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{
                    background: "rgba(43,179,42,0.08)",
                    color: "#186818",
                    border: "1px solid rgba(43,179,42,0.18)",
                  }}
                  data-testid={`highlight-${i}`}
                >
                  <CheckCircle2 className="h-3 w-3 flex-shrink-0" style={{ color: "#2bb32a" }} />
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div
            className="hidden md:block flex-shrink-0 self-stretch"
            style={{ width: "1px", background: "rgba(0,0,0,0.08)", minHeight: "60px" }}
          />

          {/* Segment 3 — Bonus + CTAs */}
          <div className="flex flex-col gap-2.5 flex-shrink-0 min-w-[180px]">
            {bonusOffer && bonusOffer.trim() && (
              <div
                className="text-center px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{
                  background: "rgba(43,179,42,0.08)",
                  border: "1px dashed rgba(43,179,42,0.30)",
                  color: "#186818",
                }}
                data-testid="badge-bonus"
              >
                {bonusOffer}
              </div>
            )}
            <Button
              asChild
              className="w-full"
              style={{ background: "#2bb32a", color: "#fff", border: "none" }}
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
                Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
              </a>
            </Button>
            {reviewLink && (
              <Button
                asChild
                variant="ghost"
                className="w-full"
                data-testid="button-read-review"
              >
                <Link href={reviewLink}>
                  <FileText className="mr-1.5 h-4 w-4" />
                  Read Review
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
