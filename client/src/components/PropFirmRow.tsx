import { Star, ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { trackAffiliateClick } from "@/lib/gtm";

interface PropFirmRowProps {
  name: string;
  logo: string;
  rating: number;
  pros: string[];
  link: string;
  reviewLink?: string;
  position: number;
  pageLocation?: string;
}

export function PropFirmRow({ name, logo, rating, pros, link, reviewLink, position, pageLocation = "home" }: PropFirmRowProps) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(16px) saturate(200%)",
        WebkitBackdropFilter: "blur(16px) saturate(200%)",
        border: "1px solid rgba(255,255,255,0.38)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.65)",
        borderRadius: "16px",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.20)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.11), inset 0 1px 0 rgba(255,255,255,0.7)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.65)";
      }}
      data-testid={`row-prop-firm-${position}`}
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(43,179,42,0.08)", color: "#14531a", border: "1px solid rgba(43,179,42,0.15)" }} data-testid={`text-rank-${position}`}>
        {position}
      </div>

      {/* Logo */}
      <div className="flex-shrink-0 flex items-center justify-center p-1.5" style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
        <img src={logo} alt={name} loading="lazy" className="w-full h-full object-contain rounded-lg" data-testid="img-prop-firm-logo" />
      </div>

      {/* Name + rating */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm md:text-base" style={{ color: "#111827" }} data-testid="text-prop-firm-name">{name}</p>
        <div className="flex items-center gap-0.5 mt-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 flex-shrink-0 ${i < Math.floor(rating) ? "text-amber-500 fill-amber-500" : "text-gray-300 fill-gray-200"}`} />
          ))}
          <span className="text-xs font-semibold ml-1.5" style={{ color: "#6b7280" }}>{rating}/5</span>
        </div>
      </div>

      {/* Pro pills */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        {pros.slice(0, 2).map((pro, i) => (
          <span key={i} className="inline-flex text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap" style={{ background: "rgba(255,255,255,0.35)", color: "#374151", border: "1px solid rgba(255,255,255,0.5)" }} data-testid={`badge-pro-${i}`}>
            {pro.length > 28 ? pro.slice(0, 28) + "…" : pro}
          </span>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {reviewLink && (
          <Button asChild variant="ghost" size="sm" className="hidden sm:flex text-xs" style={{ color: "#374151" }} data-testid="button-read-review">
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
