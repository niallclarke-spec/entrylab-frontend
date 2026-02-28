import { TrendingUp, AlertCircle, Building2, BarChart3, Newspaper, ShieldCheck, Flame } from "lucide-react";
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

  const getIconAndColor = (slug: string, index: number) => {
    if (slug.toLowerCase().includes("news") || slug.toLowerCase().includes("article") || slug.toLowerCase().includes("update"))
      return { icon: Newspaper, color: "#60a5fa" };
    if (slug.toLowerCase().includes("broker"))
      return { icon: TrendingUp, color: "#2bb32a" };
    if (slug.toLowerCase().includes("market") || slug.toLowerCase().includes("analysis"))
      return { icon: BarChart3, color: "#a78bfa" };
    if (slug.toLowerCase().includes("trading") || slug.toLowerCase().includes("alert"))
      return { icon: AlertCircle, color: "#f59e0b" };
    if (slug.toLowerCase().includes("prop"))
      return { icon: Building2, color: "#2bb32a" };
    const defaults = [
      { icon: TrendingUp, color: "#2bb32a" },
      { icon: Building2, color: "#2bb32a" },
      { icon: BarChart3, color: "#adb2b1" },
      { icon: Newspaper, color: "#60a5fa" },
    ];
    return defaults[index % defaults.length];
  };

  const topCategories = categories
    ?.filter((cat) => cat.count > 0)
    ?.filter((cat) => !EXCLUDED_CATEGORIES.includes(cat.slug.toLowerCase()))
    ?.sort((a, b) => b.count - a.count)
    ?.slice(0, 4) || [];

  const fixedTopic = {
    id: "prop-firm-reviews",
    label: "Verified Prop Firm Reviews",
    slug: "prop-firm-reviews",
    link: "/prop-firms",
  };

  return (
    <section
      style={{
        background: "#1a1e1c",
        borderBottom: "1px solid rgba(43,179,42,0.12)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Label */}
          <div className="flex items-center gap-2.5 md:min-w-[180px] flex-shrink-0">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: "rgba(43,179,42,0.12)" }}
            >
              <Flame className="h-4 w-4" style={{ color: "#2bb32a" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none mb-0.5">Trending Now</p>
              <p className="text-xs" style={{ color: "#6b7a74" }}>Hot topics in forex</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-8 self-center" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* Topics */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Fixed first item */}
            <Link href={fixedTopic.link}>
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
                style={{
                  background: "rgba(43,179,42,0.12)",
                  border: "1px solid rgba(43,179,42,0.25)",
                  color: "#2bb32a",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(43,179,42,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(43,179,42,0.12)")}
                data-testid="badge-trending-prop-firm-reviews"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {fixedTopic.label}
              </button>
            </Link>

            {/* WordPress categories */}
            {topCategories.map((category, index) => {
              const { icon: Icon, color } = getIconAndColor(category.slug, index);
              const isSelected = selectedCategory === category.slug;
              return (
                <Link key={category.id} href={`/${category.slug}`}>
                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
                    style={{
                      background: isSelected ? "rgba(43,179,42,0.15)" : "rgba(255,255,255,0.05)",
                      border: isSelected ? "1px solid rgba(43,179,42,0.35)" : "1px solid rgba(255,255,255,0.08)",
                      color: isSelected ? "#2bb32a" : "#adb2b1",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                        e.currentTarget.style.color = "#ffffff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.color = "#adb2b1";
                      }
                    }}
                    data-testid={`badge-trending-${category.slug}`}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: isSelected ? "#2bb32a" : color }} />
                    {category.name}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
