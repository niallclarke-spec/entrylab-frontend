import { useState } from "react";
import { Star, Shield, TrendingUp, ArrowRight, CheckCircle2, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { OptimizedImage } from "@/components/OptimizedImage";
import type { Broker } from "@shared/schema";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ConversionHeroProps {
  topBrokers: Broker[];
}

export function ConversionHero({ topBrokers }: ConversionHeroProps) {
  const top3Brokers = topBrokers.slice(0, 3);

  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-emerald-500/5 border-b overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(139,92,246,0.12),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(16,185,129,0.08),transparent_50%)]"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left: Main CTA & Trust Signals */}
          <div className="space-y-6 md:space-y-8">
            {/* Trust Badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 gap-1.5" data-testid="badge-trusted">
                <Award className="h-3.5 w-3.5" />
                Trusted Platform
              </Badge>
              <Badge variant="outline" className="gap-1.5" data-testid="badge-verified">
                <Shield className="h-3.5 w-3.5" />
                Verified Reviews
              </Badge>
              <Badge variant="outline" className="gap-1.5" data-testid="badge-updated">
                <TrendingUp className="h-3.5 w-3.5" />
                Updated Daily
              </Badge>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight" data-testid="text-conversion-hero-title">
                Find Your Perfect
                <span className="block text-primary mt-2">Forex Broker</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl" data-testid="text-conversion-hero-subtitle">
                Compare top-rated brokers, read unbiased reviews, and start trading with confidence. 
                Join <span className="font-semibold text-foreground">50,000+ traders</span> who trust EntryLab.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center space-y-1">
                <div className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-broker-count">200+</div>
                <div className="text-xs md:text-sm text-muted-foreground">Brokers Listed</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl md:text-3xl font-bold text-emerald-600" data-testid="text-review-count">1.2K+</div>
                <div className="text-xs md:text-sm text-muted-foreground">Reviews</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-user-count">50K+</div>
                <div className="text-xs md:text-sm text-muted-foreground">Active Users</div>
              </div>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto" data-testid="button-compare-brokers">
                <Link href="/brokers">
                  Compare Brokers <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-card/50 backdrop-blur-sm" data-testid="button-view-reviews">
                <Link href="/reviews">
                  View All Reviews
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: Top Brokers Carousel */}
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-foreground" data-testid="text-top-brokers-title">
                🏆 Top Rated Brokers
              </h2>
            </div>

            <Carousel className="w-full" data-testid="carousel-top-brokers">
              <CarouselContent>
                {top3Brokers.map((broker, index) => (
                  <CarouselItem key={broker.id}>
                    <Card className="border-2 hover-elevate active-elevate-2 transition-all duration-300">
                      <CardContent className="p-6 space-y-4">
                        {/* Ranking Badge */}
                        <div className="flex items-start justify-between">
                          <Badge className="bg-primary/10 text-primary border-primary/20" data-testid={`badge-rank-${index + 1}`}>
                            #{index + 1} Best Broker
                          </Badge>
                          {broker.verified && (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" data-testid={`icon-verified-${broker.id}`} />
                          )}
                        </div>

                        {/* Broker Logo & Name */}
                        <div className="flex items-center gap-4">
                          {broker.logo && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-card border flex-shrink-0">
                              <OptimizedImage
                                src={broker.logo}
                                alt={broker.name}
                                width="64"
                                height="64"
                                className="w-full h-full object-contain p-2"
                                data-testid={`img-broker-logo-${broker.id}`}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-foreground truncate" data-testid={`text-broker-name-${broker.id}`}>
                              {broker.name}
                            </h3>
                            {broker.rating && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                  <span className="ml-1 font-semibold text-foreground" data-testid={`text-rating-${broker.id}`}>
                                    {broker.rating.toFixed(1)}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">/5.0</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Key Features */}
                        {broker.highlights && broker.highlights.length > 0 && (
                          <div className="space-y-2">
                            {broker.highlights.slice(0, 3).map((highlight, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm" data-testid={`text-highlight-${broker.id}-${idx}`}>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{highlight}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Bonus Offer */}
                        {broker.bonusOffer && (
                          <div className="bg-emerald-600/10 border border-emerald-600/20 rounded-lg p-3">
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400" data-testid={`text-bonus-${broker.id}`}>
                              🎁 {broker.bonusOffer}
                            </p>
                          </div>
                        )}

                        {/* CTA Buttons */}
                        <div className="flex gap-3 pt-2">
                          <Button asChild className="flex-1" data-testid={`button-visit-${broker.id}`}>
                            <a href={broker.link} target="_blank" rel="noopener noreferrer">
                              Visit Broker
                            </a>
                          </Button>
                          <Button asChild variant="outline" className="flex-1" data-testid={`button-review-${broker.id}`}>
                            <Link href={broker.reviewLink || `/broker/${broker.slug}`}>
                              Read Review
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-4 lg:-left-12" data-testid="button-carousel-prev" />
              <CarouselNext className="-right-4 lg:-right-12" data-testid="button-carousel-next" />
            </Carousel>

            {/* Quick Links Below Carousel */}
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <Link href="/brokers" className="text-primary hover:underline font-medium" data-testid="link-all-brokers">
                View All Brokers →
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link href="/prop-firms" className="text-primary hover:underline font-medium" data-testid="link-prop-firms">
                Prop Firms →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Trust Bar */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-5 w-5 text-primary" />
              <span>Regulated Brokers Only</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-5 w-5 text-amber-500" />
              <span>Verified Reviews</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-5 w-5 text-emerald-600" />
              <span>50K+ Traders Trust Us</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Updated Daily</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
