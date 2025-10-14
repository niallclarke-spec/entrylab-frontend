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

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950/80 to-indigo-950/80 border-y border-primary/10">
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />
      
      <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="grid lg:grid-cols-[45%_55%] gap-12 items-center">
          {/* Left: Narrative */}
          <div className="space-y-6 text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Trusted by Traders Worldwide</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              Why Traders Choose EntryLab
            </h2>
            
            <p className="text-lg text-white/70 leading-relaxed max-w-xl">
              Join thousands of traders who rely on our unbiased broker reviews, real-time market analysis, 
              and expert insights to make informed trading decisions.
            </p>
            
            <div className="pt-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/archive">
                  Explore All Articles <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Right: Stats Grid */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {signals.map((signal, index) => {
              const Icon = iconMap[signal.icon] || Users;
              return (
                <div 
                  key={index} 
                  className="relative group"
                  data-testid={`signal-${index}`}
                >
                  <div className="relative h-full p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                    <div className="flex flex-col h-full">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-white mb-2">{signal.value}</p>
                      <p className="text-sm text-white/60">{signal.label}</p>
                    </div>
                  </div>
                  {/* Glow effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
