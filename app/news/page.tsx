import { getArticlesBySection } from "@/lib/articles";
import { ArticleList } from "@/components/ArticleList";
import { Newspaper } from "lucide-react";
import type { Metadata } from "next";
import { currentYear, SITE_URL } from "@/lib/utils";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: `Forex & Prop Firm News ${currentYear()}`,
  description: `Latest news from the forex broker and prop firm industry. Regulatory updates, new brokers, promotions and trading conditions.`,
  openGraph: { title: `Forex & Prop Firm News ${currentYear()}`, description: `Latest news from the forex broker and prop firm industry. Regulatory updates, new brokers, promotions and trading conditions.`, url: `${SITE_URL}/news` },
  alternates: { canonical: `${SITE_URL}/news` },
};

export default async function NewsPage() {
  const articles = await getArticlesBySection("news");

  return (
    <>
      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-14">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a" }}>
            <Newspaper className="h-3 w-3" /> News
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Forex & Prop Firm News</h1>
          <p className="text-[#adb2b1] max-w-xl">Breaking updates, regulatory changes, and industry developments.</p>
        </div>
      </section>
      <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <ArticleList articles={articles} showCategory={false} />
        </div>
      </section>
    </>
  );
}
