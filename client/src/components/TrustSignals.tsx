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
    <section className="border-y border-white/5 bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {signals.map((signal, index) => {
            const Icon = iconMap[signal.icon] || Users;
            return (
              <div 
                key={index} 
                className="flex items-center gap-3"
                data-testid={`signal-${index}`}
              >
                <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <span className="text-lg font-bold text-white">{signal.value}</span>
                  <span className="text-sm text-white/50 ml-2">{signal.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
