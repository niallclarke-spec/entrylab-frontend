import { Star, ExternalLink, BookOpen, DollarSign, TrendingUp, ShieldCheck, CheckCircle2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { trackAffiliateClick } from "@/lib/gtm";

interface PropFirmRowProps {
  name: string;
  logo: string;
  rating: number;
  pros: string[];
  highlights?: string[];
  tagline?: string;
  link: string;
  reviewLink?: string;
  position: number;
  pageLocation?: string;
}

const RANK_STYLES: Record<number, { bg: string; color: string; border: string; icon?: any }> = {
  1: { bg: "rgba(251,191,36,0.12)", color: "#92400e", border: "rgba(251,191,36,0.30)", icon: Trophy },
  2: { bg: "rgba(148,163,184,0.12)", color: "#475569", border: "rgba(148,163,184,0.30)" },
  3: { bg: "rgba(180,120,60,0.10)", color: "#78350f", border: "rgba(180,120,60,0.25)" },
};

const PRO_ICONS = [DollarSign, TrendingUp, ShieldCheck];

export function PropFirmRow({ name, logo, rating, pros, highlights, tagline, link, reviewLink, position, pageLocation = "home" }: PropFirmRowProps) {
  const rankStyle = RANK_STYLES[position] || { bg: "rgba(43,179,42,0.08)", color: "#14531a", border: "rgba(43,179,42,0.15)" };
  const RankIcon = rankStyle.icon;

  return (
    <div
      className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 px-5 md:px-7 py-5 md:py-6 transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(16px) saturate(200%)",
        WebkitBackdropFilter: "blur(16px) saturate(200%)",
        border: "1px solid rgba(255,255,255,0.38)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.65)",
        borderRadius: "20px",
        minHeight: "96px",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.20)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px rgba(0,0,0,0.11), inset 0 1px 0 rgba(255,255,255,0.7)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.65)";
      }}
      data-testid={`row-prop-firm-${position}`}
    >
      {/* Segment 1 — Rank + Logo + Identity */}
      <div className="flex items-center gap-4 flex-shrink-0 md:min-w-[220px]">
        {/* Rank badge */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: rankStyle.bg, color: rankStyle.color, border: `1px solid ${rankStyle.border}` }}
          data-testid={`text-rank-${position}`}
        >
          {RankIcon ? <RankIcon className="h-4 w-4" /> : position}
        </div>

        {/* Logo */}
        <div
          className="flex-shrink-0 flex items-center justify-center p-2"
          style={{ width: "60px", height: "60px", background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" }}
        >
          <img src={logo} alt={name} loading="lazy" className="w-full h-full object-contain rounded-lg" data-testid="img-prop-firm-logo" />
        </div>

        {/* Name + tagline + stars */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm md:text-base leading-tight" style={{ color: "#111827" }} data-testid="text-prop-firm-name">
              {name}
            </p>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
              style={{ background: "rgba(43,179,42,0.08)", color: "#14531a", border: "1px solid rgba(43,179,42,0.15)" }}
            >
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </span>
          </div>
          {tagline && (
            <p className="text-xs mt-0.5 truncate max-w-[180px]" style={{ color: "#6b7280" }}>{tagline}</p>
          )}
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 flex-shrink-0 ${i < Math.floor(rating) ? "text-amber-500 fill-amber-500" : "text-gray-300 fill-gray-200"}`} />
            ))}
            <span className="text-xs font-semibold ml-1" style={{ color: "#6b7280" }}>{rating}/5</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px self-stretch flex-shrink-0" style={{ background: "rgba(255,255,255,0.45)", minHeight: "48px" }} />

      {/* Segment 2 — Key benefits */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: "#9ca3af" }}>Key Benefits</p>
        <div className="flex flex-wrap gap-2">
          {pros.slice(0, 3).map((pro, i) => {
            const Icon = PRO_ICONS[i % PRO_ICONS.length];
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap"
                style={{ background: "rgba(255,255,255,0.35)", color: "#374151", border: "1px solid rgba(255,255,255,0.55)" }}
                data-testid={`badge-pro-${i}`}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#2bb32a" }} />
                {pro.length > 30 ? pro.slice(0, 30) + "…" : pro}
              </span>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px self-stretch flex-shrink-0" style={{ background: "rgba(255,255,255,0.45)", minHeight: "48px" }} />

      {/* Segment 3 — CTAs */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {reviewLink && (
          <Button asChild variant="ghost" size="sm" className="text-xs" style={{ color: "#374151" }} data-testid="button-read-review">
            <Link href={reviewLink}>
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              Review
            </Link>
          </Button>
        )}
        <Button
          asChild
          size="sm"
          className="text-xs font-semibold"
          style={{ background: "#2bb32a", color: "#fff", border: "none", boxShadow: "0 2px 10px rgba(43,179,42,0.15)" }}
          data-testid="button-visit-prop-firm"
          onClick={() => trackAffiliateClick({ broker_name: name, broker_type: "prop_firm", page_location: pageLocation as any, placement_type: "top_rated_card", rating, affiliate_link: link, position })}
        >
          <a href={link} target="_blank" rel="noopener noreferrer">
            Visit <ExternalLink className="h-3 w-3 ml-1.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}
