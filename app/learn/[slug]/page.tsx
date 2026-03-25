import { getArticle, ArticlePageContent } from "@/components/ArticlePage";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { stripHtml, SITE_URL } from "@/lib/utils";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article Not Found" };

  const title = article.seoTitle || `${stripHtml(article.title)} | EntryLab`;
  const description = article.seoDescription || stripHtml(article.excerpt || "").substring(0, 160);

  return {
    title, description,
    openGraph: { title, description, url: `${SITE_URL}/learn/${slug}`, type: "article" },
    twitter: { title, description, creator: "@entrylabio" },
    alternates: { canonical: `${SITE_URL}/learn/${slug}` },
  };
}

export default async function LearnArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  if (article.relatedBroker) redirect(`/brokers/${article.relatedBroker}/${slug}`);
  if (article.relatedPropFirm) redirect(`/prop-firms/${article.relatedPropFirm}/${slug}`);

  return <ArticlePageContent article={article} backHref="/learn" backLabel="Guides" />;
}
