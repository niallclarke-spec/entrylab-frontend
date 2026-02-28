import { Shield, Users, TrendingUp, Award, Newspaper, Handshake, BarChart3, MessageCircle, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
    <section
      className="relative overflow-hidden"
      style={{
        background: "#1a1e1c",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Single subtle orb */}
      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(43,179,42,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          transform: "translate(-30%, -30%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: Primary stat */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{
                background: "rgba(43,179,42,0.12)",
                border: "1px solid rgba(43,179,42,0.25)",
                color: "#2bb32a",
              }}
            >
              <Award className="h-3.5 w-3.5" />
              Why Traders Trust Us
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(43,179,42,0.12)",
                    border: "1px solid rgba(43,179,42,0.2)",
                  }}
                >
                  <PrimaryIcon className="h-8 w-8" style={{ color: "#2bb32a" }} />
                </div>
                <div>
                  <p className="text-5xl font-bold text-white mb-1">{primaryStat.value}</p>
                  <p className="text-lg" style={{ color: "#adb2b1" }}>{primaryStat.label}</p>
                </div>
              </div>

              <p className="leading-relaxed max-w-md" style={{ color: "#6b7a74" }}>
                Join a growing community of traders who rely on our independent broker reviews,
                real-time market analysis, and expert insights to make confident trading decisions.
              </p>

              <Link
                href="/news"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#ffffff",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                data-testid="link-explore-articles"
              >
                Explore All Articles <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right: Secondary stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {secondaryStats.map((signal, index) => {
              const Icon = iconMap[signal.icon] || Users;
              return (
                <div key={index} className="text-center" data-testid={`signal-${index + 1}`}>
                  <div
                    className="inline-flex w-12 h-12 rounded-lg items-center justify-center mb-3"
                    style={{ background: "rgba(43,179,42,0.10)" }}
                  >
                    <Icon className="h-6 w-6" style={{ color: "#2bb32a" }} />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{signal.value}</p>
                  <p className="text-sm" style={{ color: "#adb2b1" }}>{signal.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
