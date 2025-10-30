import { Shield, Users, TrendingUp, Award, Newspaper, Handshake, BarChart3, MessageCircle, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const iconMap: Record<string, any> = {
  users: Users,
  trending: TrendingUp,
  award: Award,
  shield: Shield,
  newspaper: Newspaper,
  handshake: Handshake,
  barchart: BarChart3,
  community: MessageCircle,
};

export function TrustSignals() {
  const { data: signals = [] } = useQuery<Array<{ icon: string; value: string; label: string }>>({
    queryKey: ["/api/wordpress/trust-signals"],
  });

  const [primaryStat, ...secondaryStats] = signals;

  if (!primaryStat) return null;

  const PrimaryIcon = iconMap[primaryStat.icon] || Users;

  return (
    <section className="border-y border-primary/10 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Featured Stat Callout */}
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Why Traders Trust Us</span>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <PrimaryIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-5xl font-bold text-white mb-2">{primaryStat.value}</p>
                  <p className="text-lg text-white/70">{primaryStat.label}</p>
                </div>
              </div>
              
              <p className="text-white/60 leading-relaxed max-w-md">
                Join a growing community of traders who rely on our independent broker reviews, 
                real-time market analysis, and expert insights to make confident trading decisions.
              </p>

              <Button asChild variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
                <Link href="/news" data-testid="link-explore-articles">
                  Explore All Articles <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: Supporting Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {secondaryStats.map((signal, index) => {
              const Icon = iconMap[signal.icon] || Users;
              return (
                <div key={index} className="text-center" data-testid={`signal-${index + 1}`}>
                  <div className="inline-flex w-12 h-12 rounded-lg bg-white/5 items-center justify-center mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{signal.value}</p>
                  <p className="text-sm text-white/50">{signal.label}</p>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
