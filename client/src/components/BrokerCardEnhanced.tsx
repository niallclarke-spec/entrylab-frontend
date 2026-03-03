import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, TrendingUp, Shield, Zap, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { trackAffiliateClick } from "@/lib/gtm";

interface BrokerCardEnhancedProps {
  name: string;
  logo: string;
  verified: boolean;
  rating: number;
  pros: string[];
  highlights?: string[];
  link: string;
  featured?: boolean;
  slug?: string;
  type?: "broker" | "prop-firm";
  pageLocation?: 'home' | 'brokers' | 'prop_firms' | 'broker_review' | 'prop_firm_review' | 'article' | 'archive';
  placementType?: 'featured_widget' | 'top_rated_card' | 'broker_list_card' | 'inline_card' | 'hero_cta' | 'quick_stats_cta' | 'bottom_cta';
  position?: number;
}

export function BrokerCardEnhanced({
  name,
  logo,
  verified,
  rating,
  pros,
  highlights,
  link,
  featured,
  slug,
  type = "broker",
  pageLocation = 'home',
  placementType = 'broker_list_card',
  position
}: BrokerCardEnhancedProps) {
  const icons = [TrendingUp, Shield, Zap];
  const reviewPath = slug ? `/${type}/${slug}` : null;

  return (
    <div
      className="hover-elevate transition-all h-full flex flex-col"
      style={{
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: featured ? "1px solid rgba(43,179,42,0.4)" : "1px solid rgba(255,255,255,0.75)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        borderRadius: "20px",
      }}
      data-testid={`card-broker-${name}`}
    >
      {/* Header */}
      <div className="p-5 pb-4 space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className="flex-shrink-0 flex items-center justify-center p-3"
            style={{
              width: "80px",
              height: "80px",
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: "16px",
              boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
            }}
          >
            <img
              src={logo}
              alt={name}
              loading="lazy"
              width="56"
              height="56"
              className="w-full h-full object-contain rounded-xl"
              data-testid="img-broker-logo"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="text-base md:text-lg font-bold leading-tight"
              style={{ color: "#111827" }}
              data-testid="text-broker-name"
            >
              {name}
            </h3>
            <div className="flex items-center gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 flex-shrink-0 ${i < Math.floor(rating) ? "text-amber-500 fill-amber-500" : "text-gray-200 fill-gray-100"}`}
                />
              ))}
              <span className="text-sm font-semibold ml-1.5 whitespace-nowrap" style={{ color: "#374151" }}>
                {rating}/5
              </span>
            </div>
            {verified && (
              <div
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mt-2"
                style={{ background: "rgba(43,179,42,0.10)", color: "#186818", border: "1px solid rgba(43,179,42,0.22)" }}
                data-testid="badge-verified"
              >
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 flex-1 space-y-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "#9ca3af" }}
          >
            Key Benefits
          </p>
          <div className="space-y-2.5">
            {pros.slice(0, 3).map((pro, index) => {
              const Icon = icons[index % icons.length];
              return (
                <div key={index} className="flex items-center gap-2.5" data-testid={`pro-${index}`}>
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: "32px",
                      height: "32px",
                      background: "rgba(43,179,42,0.08)",
                      borderRadius: "10px",
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "#2bb32a" }} />
                  </div>
                  <p className="text-sm flex-1" style={{ color: "#4b5563" }}>{pro}</p>
                </div>
              );
            })}
          </div>
        </div>

        {highlights && highlights.length > 0 && (
          <div className="pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex flex-wrap gap-1.5">
              {highlights.map((highlight, index) => (
                <span
                  key={index}
                  className="inline-flex text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "rgba(0,0,0,0.06)", color: "#6b7280" }}
                  data-testid={`highlight-${index}`}
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 pt-4 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(0,0,0,0.07)", marginTop: "16px" }}>
        {reviewPath && (
          <Button asChild variant="ghost" className="w-full" data-testid="button-read-review">
            <Link href={reviewPath}>
              <BookOpen className="mr-2 h-4 w-4" /> Read Review
            </Link>
          </Button>
        )}
        <Button
          asChild
          className="w-full"
          size="lg"
          style={{ background: "#2bb32a", color: "#fff", border: "none" }}
          data-testid="button-visit-broker"
          onClick={() => trackAffiliateClick({
            broker_name: name,
            broker_type: type === 'prop-firm' ? 'prop_firm' : 'broker',
            page_location: pageLocation,
            placement_type: placementType,
            rating: rating,
            affiliate_link: link,
            position: position
          })}
        >
          <a href={link} target="_blank" rel="noopener noreferrer" className="truncate">
            Visit {name}
          </a>
        </Button>
        <p className="text-xs text-center" style={{ color: "#9ca3af" }}>
          Risk Warning: Trading involves risk
        </p>
      </div>
    </div>
  );
}
