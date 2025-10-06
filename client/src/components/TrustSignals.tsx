import { Shield, Users, TrendingUp, Award } from "lucide-react";

export function TrustSignals() {
  const signals = [
    { icon: Users, value: "50,000+", label: "Active Traders" },
    { icon: TrendingUp, value: "$2.5B+", label: "Trading Volume" },
    { icon: Award, value: "100+", label: "Verified Brokers" },
    { icon: Shield, value: "2020", label: "Trusted Since" },
  ];

  return (
    <section className="py-12 border-y bg-card/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {signals.map((signal, index) => {
            const Icon = signal.icon;
            return (
              <div key={index} className="flex flex-col items-center text-center" data-testid={`signal-${index}`}>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">{signal.value}</p>
                <p className="text-sm text-muted-foreground">{signal.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
