import { Shield, Users, TrendingUp, Award, Newspaper, Handshake, BarChart3, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
    <section className="relative overflow-hidden bg-slate-900/60 border-y border-white/5">
      {/* Subtle texture overlay - different from hero */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 11px)`,
      }} />
      
      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Eyebrow label for visual separation */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Trusted Platform</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          {/* Left: Stats in horizontal strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {signals.map((signal, index) => {
              const Icon = iconMap[signal.icon] || Users;
              return (
                <div 
                  key={index} 
                  className="relative p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group"
                  data-testid={`signal-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-bold text-white truncate">{signal.value}</p>
                      <p className="text-xs text-white/50 truncate">{signal.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Right: Compact narrative (no CTA) */}
          <div className="lg:max-w-xs text-white/80 lg:text-right">
            <p className="text-sm leading-relaxed">
              Join thousands of traders who trust our unbiased reviews and expert market analysis
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
