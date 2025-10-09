import { CheckCircle2, TrendingUp, Shield, Zap, DollarSign, Globe, Star, ArrowRight, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackAffiliateClick } from "@/lib/gtm";

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
    <section className="py-12 md:py-16 bg-gradient-to-br from-primary/10 via-background to-chart-2/10 border-y">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-6">
          <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-featured-title">
            Featured Broker of the Week
          </h2>
        </div>
        
        <Card className="overflow-hidden border-primary/20">
          <div className="grid md:grid-cols-[300px,1fr] gap-0">
            {/* Left Side - Broker Info */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-8 flex flex-col items-center justify-center border-r">
              <div className="w-40 h-40 bg-white dark:bg-card rounded-2xl flex items-center justify-center mb-4 shadow-md p-6" style={{ border: '0.5px solid rgba(128, 128, 128, 0.15)' }}>
                <img src={logo} alt={name} loading="lazy" width="160" height="160" className="w-full h-full object-contain rounded-lg" data-testid="img-featured-logo" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2 text-center" data-testid="text-featured-name">{name}</h3>
              <p className="text-muted-foreground text-center mb-4">{tagline}</p>
              
              <div className="flex items-center gap-2 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.floor(rating) ? "text-amber-500 fill-amber-500" : "text-muted"}`}
                  />
                ))}
                <span className="text-base font-semibold ml-0.5">{rating}/5</span>
              </div>

              {bonusOffer && bonusOffer.trim() && (
                <Badge variant="outline" className="mb-4 text-center px-4 py-2 border-dashed border-2" data-testid="badge-bonus">
                  {bonusOffer}
                </Badge>
              )}

              <div className="w-full space-y-3">
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full shadow-lg" 
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
                    <a href={reviewLink} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      Read Review
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Right Side - Features & Highlights */}
            <div className="p-8">
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Key Features
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {features.map((feature, index) => {
                    const Icon = iconMap[feature.icon] || CheckCircle2;
                    return (
                      <div key={index} className="flex items-center gap-3" data-testid={`feature-${index}`}>
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground font-medium">{feature.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-chart-2" />
                  Why Traders Choose {name}
                </h4>
                <div className="space-y-3">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-3" data-testid={`highlight-${index}`}>
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-chart-2/20 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-chart-2" />
                      </div>
                      <p className="text-muted-foreground">{highlight}</p>
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
