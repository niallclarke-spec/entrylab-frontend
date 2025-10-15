import type { WordPressPost } from "@shared/schema";

/**
 * Get the category slug from a WordPress post
 */
export function getCategorySlug(post: WordPressPost): string {
  return post._embedded?.["wp:term"]?.[0]?.[0]?.slug || "uncategorized";
}

/**
 * Get the category name from a WordPress post
 */
export function getCategoryName(post: WordPressPost): string {
  return post._embedded?.["wp:term"]?.[0]?.[0]?.name || "News";
}

/**
 * Generate WordPress-style article URL with category
 * Format: /:category/:slug
 */
export function getArticleUrl(post: WordPressPost): string {
  const categorySlug = getCategorySlug(post);
  return `/${categorySlug}/${post.slug}`;
}
