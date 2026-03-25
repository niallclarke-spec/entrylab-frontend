import { getArticlesBySection } from "@/lib/articles";
import { ArticleList } from "@/components/ArticleList";
import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const revalidate = 1800;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — Forex Trading Articles",
  description: "Articles on forex trading, market analysis, and trading strategies from the EntryLab editorial team.",
  openGraph: { title: "Blog — Forex Trading Articles", url: `${SITE_URL}/blog` },
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default async function BlogPage() {
  const articles = await getArticlesBySection("blog");

  return (
    <>
      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-14">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a" }}>
            <FileText className="h-3 w-3" /> Blog
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Blog</h1>
          <p className="text-[#adb2b1] max-w-xl">Trading insights, market analysis, and educational content.</p>
        </div>
      </section>
      <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <ArticleList articles={articles} />
        </div>
      </section>
    </>
  );
}
