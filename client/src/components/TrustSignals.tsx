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
    <section className="py-12 border-y bg-card/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {signals.map((signal, index) => {
            const Icon = iconMap[signal.icon] || Users;
            return (
              <div key={index} className="flex flex-col items-center text-center" data-testid={`signal-${index}`}>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-lg md:text-2xl font-bold text-foreground mb-1">{signal.value}</p>
                <p className="text-xs text-muted-foreground">{signal.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
