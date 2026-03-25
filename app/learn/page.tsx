import { getArticlesBySection } from "@/lib/articles";
import { ArticleList } from "@/components/ArticleList";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const revalidate = 1800;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forex Trading Guides & Tutorials",
  description: "In-depth guides on forex brokers, prop firms, account types, deposit methods, platforms and trading conditions explained.",
  openGraph: { title: "Forex Trading Guides & Tutorials", url: `${SITE_URL}/learn` },
  alternates: { canonical: `${SITE_URL}/learn` },
};

export default async function LearnPage() {
  const articles = await getArticlesBySection("learn");

  return (
    <>
      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-14">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a" }}>
            <BookOpen className="h-3 w-3" /> Guides
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Forex Trading Guides</h1>
          <p className="text-[#adb2b1] max-w-xl">Broker guides, prop firm tutorials, and trading tool breakdowns.</p>
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
