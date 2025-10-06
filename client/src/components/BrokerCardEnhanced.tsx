import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, TrendingUp, Shield, Zap } from "lucide-react";

interface BrokerCardEnhancedProps {
  name: string;
  logo: string;
  verified: boolean;
  rating: number;
  pros: string[];
  highlights?: string[];
  link: string;
  featured?: boolean;
}

export function BrokerCardEnhanced({ name, logo, verified, rating, pros, highlights, link, featured }: BrokerCardEnhancedProps) {
  const icons = [TrendingUp, Shield, Zap];
  
  return (
    <Card className={`hover-elevate transition-all h-full flex flex-col ${featured ? "border-primary shadow-lg" : ""}`} data-testid={`card-broker-${name}`}>
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="w-20 sm:w-28 h-20 sm:h-28 rounded-xl bg-white dark:bg-card flex items-center justify-center shadow-sm p-3 sm:p-4 flex-shrink-0" style={{ border: '0.5px solid rgba(128, 128, 128, 0.15)' }}>
              <img src={logo} alt={name} className="w-full h-full object-contain rounded-md" data-testid="img-broker-logo" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg md:text-xl font-bold text-foreground break-words leading-tight" data-testid="text-broker-name">{name}</h3>
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 flex-shrink-0 ${i < rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40 fill-muted-foreground/20"}`}
                  />
                ))}
                <span className="text-sm font-semibold text-foreground ml-1 whitespace-nowrap">{rating}/5</span>
              </div>
            </div>
          </div>
          {verified && (
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 flex-shrink-0" data-testid="badge-verified">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        {featured && (
          <Badge variant="outline" className="w-fit border-amber-500 text-amber-500" data-testid="badge-featured">
            <Star className="h-3 w-3 mr-1 fill-amber-500" />
            Top Rated
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Key Benefits:</p>
          <div className="space-y-2">
            {pros.slice(0, 3).map((pro, index) => {
              const Icon = icons[index % icons.length];
              return (
                <div key={index} className="flex items-center gap-2" data-testid={`pro-${index}`}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">{pro}</p>
                </div>
              );
            })}
          </div>
        </div>

        {highlights && highlights.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex flex-wrap gap-2">
              {highlights.map((highlight, index) => (
                <Badge key={index} variant="secondary" className="text-xs" data-testid={`highlight-${index}`}>
                  {highlight}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-4">
        <Button asChild className="w-full" size="lg" data-testid="button-visit-broker">
          <a href={link} target="_blank" rel="noopener noreferrer" className="truncate">
            <span className="hidden sm:inline">Visit {name}</span>
            <span className="sm:hidden">Visit Broker</span>
          </a>
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Risk Warning: Trading involves risk
        </p>
      </CardFooter>
    </Card>
  );
}
