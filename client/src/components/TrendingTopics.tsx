import { TrendingUp, AlertCircle, Building2, BarChart3, Newspaper, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { EXCLUDED_CATEGORIES } from "@/lib/constants";

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

  // Get icon and color for WordPress categories
  const getIconAndColor = (slug: string, index: number) => {
    // Check for news/article categories
    if (slug.toLowerCase().includes('news') || 
        slug.toLowerCase().includes('article') || 
        slug.toLowerCase().includes('update')) {
      return { icon: Newspaper, color: 'text-chart-4' };
    }

    // Check for broker related
    if (slug.toLowerCase().includes('broker')) {
      return { icon: TrendingUp, color: 'text-destructive' };
    }

    // Check for market/analysis
    if (slug.toLowerCase().includes('market') || 
        slug.toLowerCase().includes('analysis')) {
      return { icon: BarChart3, color: 'text-chart-2' };
    }

    // Check for trading/alerts
    if (slug.toLowerCase().includes('trading') || 
        slug.toLowerCase().includes('alert')) {
      return { icon: AlertCircle, color: 'text-amber-500' };
    }

    // Check for prop firm
    if (slug.toLowerCase().includes('prop')) {
      return { icon: Building2, color: 'text-primary' };
    }

    // Default rotation with colors
    const defaults = [
      { icon: TrendingUp, color: 'text-destructive' },
      { icon: Building2, color: 'text-primary' },
      { icon: BarChart3, color: 'text-chart-2' },
      { icon: Newspaper, color: 'text-chart-4' },
    ];
    return defaults[index % defaults.length];
  };

  // Get top 4 categories (since we're adding one fixed category)
  const topCategories = categories
    ?.filter(cat => cat.count > 0)
    ?.filter(cat => !EXCLUDED_CATEGORIES.includes(cat.slug.toLowerCase()))
    ?.sort((a, b) => b.count - a.count)
    ?.slice(0, 4) || [];

  // First item is always "Verified Prop Firm Review"
  const fixedTopic = {
    id: 'prop-firm-reviews',
    label: 'Verified Prop Firm Reviews',
    slug: 'prop-firm-reviews',
    icon: ShieldCheck,
    color: 'text-emerald-500',
    link: '/prop-firms'
  };

  return (
    <div className="border-y bg-card/50 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 md:gap-6 overflow-x-auto scrollbar-hide">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
            Trending:
          </span>
          
          {/* Fixed first item - Verified Prop Firm Reviews */}
          <Link href={fixedTopic.link}>
            <Badge
              variant="outline"
              className="gap-2 px-4 py-2 cursor-pointer hover-elevate whitespace-nowrap"
              data-testid="badge-trending-prop-firm-reviews"
            >
              <fixedTopic.icon className={`h-4 w-4 ${fixedTopic.color}`} />
              {fixedTopic.label}
            </Badge>
          </Link>

          {/* WordPress categories */}
          {topCategories.map((category, index) => {
            const { icon: Icon, color } = getIconAndColor(category.slug, index);
            const isSelected = selectedCategory === category.slug;
            return (
              <Badge
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                className="gap-2 px-4 py-2 cursor-pointer hover-elevate whitespace-nowrap"
                onClick={() => onCategorySelect(category.slug)}
                data-testid={`badge-trending-${category.slug}`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? '' : color}`} />
                {category.name}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
