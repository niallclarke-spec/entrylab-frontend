import { TrendingUp, AlertCircle, Building2, BarChart3, Newspaper, ShieldCheck, Flame } from "lucide-react";
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
    if (slug.toLowerCase().includes('news') || 
        slug.toLowerCase().includes('article') || 
        slug.toLowerCase().includes('update')) {
      return { icon: Newspaper, color: 'text-blue-400' };
    }

    if (slug.toLowerCase().includes('broker')) {
      return { icon: TrendingUp, color: 'text-emerald-400' };
    }

    if (slug.toLowerCase().includes('market') || 
        slug.toLowerCase().includes('analysis')) {
      return { icon: BarChart3, color: 'text-purple-400' };
    }

    if (slug.toLowerCase().includes('trading') || 
        slug.toLowerCase().includes('alert')) {
      return { icon: AlertCircle, color: 'text-amber-400' };
    }

    if (slug.toLowerCase().includes('prop')) {
      return { icon: Building2, color: 'text-primary' };
    }

    const defaults = [
      { icon: TrendingUp, color: 'text-emerald-400' },
      { icon: Building2, color: 'text-primary' },
      { icon: BarChart3, color: 'text-purple-400' },
      { icon: Newspaper, color: 'text-blue-400' },
    ];
    return defaults[index % defaults.length];
  };

  const topCategories = categories
    ?.filter(cat => cat.count > 0)
    ?.filter(cat => !EXCLUDED_CATEGORIES.includes(cat.slug.toLowerCase()))
    ?.sort((a, b) => b.count - a.count)
    ?.slice(0, 4) || [];

  const fixedTopic = {
    id: 'prop-firm-reviews',
    label: 'Verified Prop Firm Reviews',
    slug: 'prop-firm-reviews',
    icon: ShieldCheck,
    color: 'text-emerald-400',
    link: '/prop-firms'
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-950/50 via-slate-900/50 to-indigo-950/50 border-y border-primary/10">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
        backgroundSize: '30px 30px'
      }} />
      
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Left: Heading */}
          <div className="flex items-center gap-3 md:min-w-[200px]">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 backdrop-blur-sm">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90">Trending Now</h3>
              <p className="text-xs text-white/60">Hot topics in forex</p>
            </div>
          </div>
          
          {/* Right: Topics */}
          <div className="flex-1 flex flex-wrap items-center gap-3">
            {/* Fixed first item */}
            <Link href={fixedTopic.link}>
              <Badge
                className="gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 backdrop-blur-sm cursor-pointer transition-all"
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
                <Link key={category.id} href={`/${category.slug}`}>
                  <Badge
                    className={`gap-2 px-4 py-2 backdrop-blur-sm cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-primary/20 text-primary border-primary/40 hover:bg-primary/30' 
                        : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                    }`}
                    data-testid={`badge-trending-${category.slug}`}
                  >
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : color}`} />
                    {category.name}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
