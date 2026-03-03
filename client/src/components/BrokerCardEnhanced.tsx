import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card
      className={`hover-elevate transition-all h-full flex flex-col rounded-2xl ${featured ? "border-primary shadow-md" : ""}`}
      style={!featured ? { border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 20px rgba(0,0,0,0.05)" } : undefined}
      data-testid={`card-broker-${name}`}
    >
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className="w-20 sm:w-24 h-20 sm:h-24 rounded-2xl bg-white flex items-center justify-center p-3 sm:p-4 flex-shrink-0"
            style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
          >
            <img src={logo} alt={name} loading="lazy" width="96" height="96" className="w-full h-full object-contain rounded-xl" data-testid="img-broker-logo" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight" data-testid="text-broker-name">{name}</h3>
            <div className="flex items-center gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 flex-shrink-0 ${i < Math.floor(rating) ? "text-amber-500 fill-amber-500" : "text-gray-200 fill-gray-100"}`}
                />
              ))}
              <span className="text-sm font-semibold text-gray-700 ml-1.5 whitespace-nowrap">{rating}/5</span>
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

        {featured && (
          <Badge variant="outline" className="w-fit border-amber-500 text-amber-600" data-testid="badge-featured">
            <Star className="h-3 w-3 mr-1 fill-amber-500" />
            Top Rated
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Key Benefits</p>
          <div className="space-y-2.5">
            {pros.slice(0, 3).map((pro, index) => {
              const Icon = icons[index % icons.length];
              return (
                <div key={index} className="flex items-center gap-2.5" data-testid={`pro-${index}`}>
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(43,179,42,0.08)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "#2bb32a" }} />
                  </div>
                  <p className="text-sm text-gray-600 flex-1">{pro}</p>
                </div>
              );
            })}
          </div>
        </div>

        {highlights && highlights.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1.5">
              {highlights.map((highlight, index) => (
                <span
                  key={index}
                  className="inline-flex text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "rgba(0,0,0,0.05)", color: "#6b7280" }}
                  data-testid={`highlight-${index}`}
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-4">
        {reviewPath && (
          <Button asChild variant="outline" className="w-full" data-testid="button-read-review">
            <Link href={reviewPath}>
              <BookOpen className="mr-2 h-4 w-4" /> Read Review
            </Link>
          </Button>
        )}
        <Button
          asChild
          className="w-full"
          size="lg"
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
        <p className="text-xs text-gray-400 text-center">Risk Warning: Trading involves risk</p>
      </CardFooter>
    </Card>
  );
}
