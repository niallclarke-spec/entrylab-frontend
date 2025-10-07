import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp } from "lucide-react";
import type { Broker } from "@shared/schema";
import { trackAffiliateClick } from "@/lib/gtm";

interface InlineBrokerCardProps {
  broker: Broker;
}

export function InlineBrokerCard({ broker }: InlineBrokerCardProps) {
  return (
    <Card className="my-8 border-2 border-primary/20 bg-card/50 backdrop-blur-sm" data-testid="inline-broker-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-white dark:bg-card flex items-center justify-center shadow-sm p-2 flex-shrink-0" style={{ border: '0.5px solid rgba(128, 128, 128, 0.15)' }}>
              <img src={broker.logo} alt={broker.name} className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{broker.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(broker.rating) ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40 fill-muted-foreground/20"}`}
                  />
                ))}
                <span className="text-sm font-semibold text-foreground ml-1">{broker.rating}/5</span>
              </div>
            </div>
          </div>
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
            Featured
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {broker.bonusOffer && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-dashed border-amber-500/50">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {broker.bonusOffer}
            </p>
          </div>
        )}
        {broker.tagline && (
          <p className="text-sm text-muted-foreground">{broker.tagline}</p>
        )}
        <Button 
          asChild 
          className="w-full" 
          size="lg" 
          data-testid="button-visit-inline-broker"
          onClick={() => trackAffiliateClick({
            broker_name: broker.name,
            broker_type: 'broker',
            click_location: 'inline_card',
            rating: broker.rating,
            affiliate_link: broker.link
          })}
        >
          <a href={broker.link} target="_blank" rel="noopener noreferrer">
            Visit {broker.name}
          </a>
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Risk Warning: Trading involves risk
        </p>
      </CardContent>
    </Card>
  );
}
