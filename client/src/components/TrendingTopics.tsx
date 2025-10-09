import { TrendingUp, AlertCircle, Building2, BarChart3, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface TrendingTopicsProps {
  selectedCategory: string | null;
  onCategorySelect: (slug: string | null) => void;
}

interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export function TrendingTopics({ selectedCategory, onCategorySelect }: TrendingTopicsProps) {
  const { data: categories } = useQuery<WordPressCategory[]>({
    queryKey: ["/api/wordpress/categories"],
  });

  // Icon mapping for different category types
  const getIconForCategory = (slug: string, index: number) => {
    const iconMap: Record<string, any> = {
      "broker": TrendingUp,
      "closures": AlertCircle,
      "prop-firm": Building2,
      "market": BarChart3,
      "analysis": BarChart3,
      "trading": AlertCircle,
      "alerts": AlertCircle,
      "news": FileText,
    };

    // Try to match category slug with icon keywords
    for (const [key, Icon] of Object.entries(iconMap)) {
      if (slug.toLowerCase().includes(key)) {
        return Icon;
      }
    }

    // Default icons rotation if no match
    const defaultIcons = [TrendingUp, Building2, BarChart3, AlertCircle, FileText];
    return defaultIcons[index % defaultIcons.length];
  };

  // Get top 5 categories by post count
  const topCategories = categories
    ?.filter(cat => cat.count > 0)
    ?.sort((a, b) => b.count - a.count)
    ?.slice(0, 5) || [];

  if (!topCategories.length) {
    return null;
  }

  return (
    <div className="border-y bg-card/50 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 md:gap-6 overflow-x-auto scrollbar-hide">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
            Trending:
          </span>
          {topCategories.map((category, index) => {
            const Icon = getIconForCategory(category.slug, index);
            const isSelected = selectedCategory === category.slug;
            return (
              <Badge
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                className="gap-2 px-4 py-2 cursor-pointer hover-elevate whitespace-nowrap"
                onClick={() => onCategorySelect(category.slug)}
                data-testid={`badge-trending-${category.slug}`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? '' : 'text-primary'}`} />
                {category.name}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
