import { TrendingUp, AlertCircle, Building2, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TrendingTopics() {
  const topics = [
    { icon: TrendingUp, label: "Broker Closures", color: "text-destructive" },
    { icon: Building2, label: "Prop Firm Updates", color: "text-primary" },
    { icon: BarChart3, label: "Market Analysis", color: "text-chart-2" },
    { icon: AlertCircle, label: "Trading Alerts", color: "text-chart-4" },
  ];

  return (
    <div className="border-y bg-card/50 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 md:gap-6 overflow-x-auto scrollbar-hide">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
            Trending:
          </span>
          {topics.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <Badge
                key={index}
                variant="outline"
                className="gap-2 px-4 py-2 cursor-pointer hover-elevate whitespace-nowrap"
                data-testid={`badge-trending-${index}`}
              >
                <Icon className={`h-4 w-4 ${topic.color}`} />
                {topic.label}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
