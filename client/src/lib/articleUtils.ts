import type { Article } from "@shared/schema";

export function getCategorySlug(post: Article): string {
  return post.category || "uncategorized";
}

export function getCategoryName(post: Article): string {
  return post.category || "News";
}

export function getArticleUrl(post: Article): string {
  return `/${getCategorySlug(post)}/${post.slug}`;
}
