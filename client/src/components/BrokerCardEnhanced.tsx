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

const GLASS = {
  background: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(16px) saturate(200%)",
  WebkitBackdropFilter: "blur(16px) saturate(200%)",
  border: "1px solid rgba(255,255,255,0.38)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -1px 0 rgba(0,0,0,0.04)",
  borderRadius: "20px",
} as const;

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
      className="transition-all duration-200 h-full flex flex-col"
      style={{
        ...GLASS,
        ...(featured ? { border: "1px solid rgba(43,179,42,0.45)", boxShadow: "0 8px 32px rgba(43,179,42,0.15), inset 0 1px 0 rgba(255,255,255,0.65)" } : {}),
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.18)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.7)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -1px 0 rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
      data-testid={`card-broker-${name}`}
    >
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 flex items-center justify-center p-2.5"
            style={{
              width: "76px", height: "76px",
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.6)",
              borderRadius: "16px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}
          >
            <img src={logo} alt={name} loading="lazy" width="56" height="56" className="w-full h-full object-contain rounded-xl" data-testid="img-broker-logo" />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="text-base md:text-lg font-bold leading-snug" style={{ color: "#111827" }} data-testid="text-broker-name">
              {name}
            </h3>
            <div className="flex items-center gap-0.5 mt-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 flex-shrink-0 ${i < Math.floor(rating) ? "text-amber-500 fill-amber-500" : "text-gray-300 fill-gray-200"}`} />
              ))}
              <span className="text-sm font-semibold ml-1.5" style={{ color: "#374151" }}>{rating}/5</span>
            </div>
            {verified && (
              <div
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-2"
                style={{ background: "rgba(43,179,42,0.18)", color: "#14531a", border: "1px solid rgba(43,179,42,0.35)" }}
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
      <div className="p-5 flex-1 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#6b7280" }}>Key Benefits</p>
          <div className="space-y-2.5">
            {pros.slice(0, 3).map((pro, index) => {
              const Icon = icons[index % icons.length];
              return (
                <div key={index} className="flex items-center gap-3" data-testid={`pro-${index}`}>
                  <div className="flex-shrink-0 flex items-center justify-center" style={{ width: "32px", height: "32px", background: "rgba(43,179,42,0.15)", borderRadius: "10px", border: "1px solid rgba(43,179,42,0.25)" }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: "#186818" }} />
                  </div>
                  <p className="text-sm flex-1" style={{ color: "#374151" }}>{pro}</p>
                </div>
              );
            })}
          </div>
        </div>

        {highlights && highlights.length > 0 && (
          <div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.4)" }}>
            <div className="flex flex-wrap gap-1.5">
              {highlights.map((h, i) => (
                <span key={i} className="inline-flex text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.35)", color: "#374151", border: "1px solid rgba(255,255,255,0.5)" }} data-testid={`highlight-${i}`}>
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 pt-0 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.35)", paddingTop: "16px", marginTop: "4px" }}>
        {reviewPath && (
          <Button asChild variant="ghost" className="w-full" style={{ color: "#374151" }} data-testid="button-read-review">
            <Link href={reviewPath}>
              <BookOpen className="mr-2 h-4 w-4" /> Read Review
            </Link>
          </Button>
        )}
        <Button
          asChild
          className="w-full"
          size="lg"
          style={{ background: "#2bb32a", color: "#fff", border: "none", boxShadow: "0 2px 12px rgba(43,179,42,0.35)" }}
          data-testid="button-visit-broker"
          onClick={() => trackAffiliateClick({
            broker_name: name,
            broker_type: type === 'prop-firm' ? 'prop_firm' : 'broker',
            page_location: pageLocation,
            placement_type: placementType,
            rating,
            affiliate_link: link,
            position,
          })}
        >
          <a href={link} target="_blank" rel="noopener noreferrer" className="truncate">
            Visit {name}
          </a>
        </Button>
        <p className="text-xs text-center" style={{ color: "#6b7280" }}>Risk Warning: Trading involves risk</p>
      </div>
    </div>
  );
}
