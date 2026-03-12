import { TrendingUp, AlertCircle, Building2, BarChart3, Newspaper, ShieldCheck, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { EXCLUDED_CATEGORIES } from "@/lib/constants";

interface TrendingTopicsProps {
  selectedCategory: string | null;
  onCategorySelect: (slug: string | null) => void;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export function TrendingTopics({ selectedCategory, onCategorySelect }: TrendingTopicsProps) {
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const getIconAndColor = (slug: string, index: number) => {
    if (slug.toLowerCase().includes("news") || slug.toLowerCase().includes("article") || slug.toLowerCase().includes("update"))
      return { icon: Newspaper, color: "#1d4ed8" };
    if (slug.toLowerCase().includes("broker"))
      return { icon: TrendingUp, color: "#186818" };
    if (slug.toLowerCase().includes("market") || slug.toLowerCase().includes("analysis"))
      return { icon: BarChart3, color: "#6d28d9" };
    if (slug.toLowerCase().includes("trading") || slug.toLowerCase().includes("alert"))
      return { icon: AlertCircle, color: "#92400e" };
    if (slug.toLowerCase().includes("prop"))
      return { icon: Building2, color: "#186818" };
    const defaults = [
      { icon: TrendingUp, color: "#186818" },
      { icon: Building2, color: "#186818" },
      { icon: BarChart3, color: "#6b7280" },
      { icon: Newspaper, color: "#1d4ed8" },
    ];
    return defaults[index % defaults.length];
  };

  const topCategories = categories
    ?.filter(c => c.count > 0)
    ?.filter(c => !EXCLUDED_CATEGORIES.includes(c.slug.toLowerCase()))
    ?.sort((a, b) => b.count - a.count)
    ?.slice(0, 4) || [];

  const fixedTopic = { id: "prop-firm-reviews", label: "Verified Prop Firm Reviews", link: "/prop-firms" };

  return (
    <section
      style={{
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(16px) saturate(200%)",
        WebkitBackdropFilter: "blur(16px) saturate(200%)",
        borderBottom: "1px solid rgba(255,255,255,0.38)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2.5 md:min-w-[180px] flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "rgba(43,179,42,0.08)", border: "1px solid rgba(43,179,42,0.14)" }}>
              <Flame className="h-4 w-4" style={{ color: "#186818" }} />
            </div>
            <div>
              <p className="text-sm font-bold leading-none mb-0.5" style={{ color: "#111827" }}>Trending Now</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>Hot topics in forex</p>
            </div>
          </div>

          <div className="hidden md:block w-px h-8 self-center" style={{ background: "rgba(255,255,255,0.5)" }} />

          <div className="flex flex-wrap items-center gap-2">
            <Link href={fixedTopic.link}>
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
                style={{ background: "rgba(43,179,42,0.08)", border: "1px solid rgba(43,179,42,0.15)", color: "#14531a" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(43,179,42,0.14)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(43,179,42,0.08)")}
                data-testid="badge-trending-prop-firm-reviews"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {fixedTopic.label}
              </button>
            </Link>

            {topCategories.map((category, index) => {
              const { icon: Icon, color } = getIconAndColor(category.slug, index);
              const isSelected = selectedCategory === category.slug;
              return (
                <Link key={category.id} href={`/${category.slug}`}>
                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
                    style={{
                      background: isSelected ? "rgba(43,179,42,0.08)" : "rgba(255,255,255,0.25)",
                      border: isSelected ? "1px solid rgba(43,179,42,0.15)" : "1px solid rgba(255,255,255,0.50)",
                      color: isSelected ? "#14531a" : "#374151",
                    }}
                    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = "rgba(255,255,255,0.38)"; e.currentTarget.style.color = "#111827"; } }}
                    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "#374151"; } }}
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
