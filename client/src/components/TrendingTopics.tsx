import { TrendingUp, AlertCircle, Building2, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TrendingTopicsProps {
  selectedCategory: string | null;
  onCategorySelect: (slug: string | null) => void;
}

export function TrendingTopics({ selectedCategory, onCategorySelect }: TrendingTopicsProps) {
  const topics = [
    { icon: TrendingUp, label: "Broker Closures", slug: "broker-closures", color: "text-destructive" },
    { icon: Building2, label: "Prop Firm Updates", slug: "prop-firm-updates", color: "text-primary" },
    { icon: BarChart3, label: "Market Analysis", slug: "market-analysis", color: "text-chart-2" },
    { icon: AlertCircle, label: "Trading Alerts", slug: "trading-alerts", color: "text-chart-4" },
  ];

  return (
    <div className="border-y bg-card/50 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 md:gap-6 overflow-x-auto scrollbar-hide">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
            Trending:
          </span>
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="gap-2 px-4 py-2 cursor-pointer hover-elevate whitespace-nowrap"
            onClick={() => onCategorySelect(null)}
            data-testid="badge-trending-all"
          >
            All Topics
          </Badge>
          {topics.map((topic, index) => {
            const Icon = topic.icon;
            const isSelected = selectedCategory === topic.slug;
            return (
              <Badge
                key={index}
                variant={isSelected ? "default" : "outline"}
                className="gap-2 px-4 py-2 cursor-pointer hover-elevate whitespace-nowrap"
                onClick={() => onCategorySelect(topic.slug)}
                data-testid={`badge-trending-${topic.slug}`}
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
