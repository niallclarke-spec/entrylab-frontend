import { Star, ExternalLink, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export function PropFirmRow({
  name,
  logo,
  rating,
  pros,
  link,
  reviewLink,
  position,
  pageLocation = "home",
}: PropFirmRowProps) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      data-testid={`row-prop-firm-${position}`}
    >
      {/* Rank badge */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ background: "rgba(43,179,42,0.15)", color: "#2bb32a", border: "1px solid rgba(43,179,42,0.3)" }}
        data-testid={`text-rank-${position}`}
      >
        {position}
      </div>

      {/* Logo */}
      <div
        className="flex-shrink-0 w-12 h-12 rounded-lg bg-white flex items-center justify-center p-1.5"
        style={{ border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <img
          src={logo}
          alt={name}
          loading="lazy"
          className="w-full h-full object-contain rounded"
          data-testid="img-prop-firm-logo"
        />
      </div>

      {/* Name + stars */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white leading-tight truncate text-sm md:text-base" data-testid="text-prop-firm-name">
          {name}
        </p>
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 flex-shrink-0 ${
                i < Math.floor(rating)
                  ? "text-amber-500 fill-amber-500"
                  : "text-white/20 fill-white/10"
              }`}
            />
          ))}
          <span className="text-xs font-semibold ml-1" style={{ color: "#adb2b1" }}>
            {rating}/5
          </span>
        </div>
      </div>

      {/* Key pros — hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        {pros.slice(0, 2).map((pro, i) => (
          <Badge
            key={i}
            className="text-xs font-medium border-0 whitespace-nowrap"
            style={{ background: "rgba(255,255,255,0.07)", color: "#adb2b1" }}
            data-testid={`badge-pro-${i}`}
          >
            {pro.length > 28 ? pro.slice(0, 28) + "…" : pro}
          </Badge>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {reviewLink && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:flex text-xs h-8 px-3"
            style={{ color: "#adb2b1" }}
            data-testid="button-read-review"
          >
            <Link href={reviewLink}>
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              Review
            </Link>
          </Button>
        )}
        <Button
          asChild
          size="sm"
          className="text-xs h-8 px-4 font-semibold text-white border-0"
          style={{ background: "#2bb32a" }}
          data-testid="button-visit-prop-firm"
          onClick={() =>
            trackAffiliateClick({
              broker_name: name,
              broker_type: "prop_firm",
              page_location: pageLocation as any,
              placement_type: "top_rated_card",
              rating,
              affiliate_link: link,
              position,
            })
          }
        >
          <a href={link} target="_blank" rel="noopener noreferrer">
            Visit <ExternalLink className="h-3 w-3 ml-1.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}
