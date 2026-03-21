import type { Article } from "@shared/schema";

export function getCategorySlug(post: Article): string {
  return post.category || "uncategorized";
}

export function getCategoryName(post: Article): string {
  return post.category || "News";
}

export function getArticleUrl(post: any): string {
  if (post.relatedBroker && typeof post.relatedBroker === "string") {
    return `/broker/${post.relatedBroker}/${post.slug}`;
  }
  if (post.relatedBroker && typeof post.relatedBroker === "object" && post.relatedBroker?.slug) {
    return `/broker/${post.relatedBroker.slug}/${post.slug}`;
  }
  if (post.relatedPropFirm && typeof post.relatedPropFirm === "string") {
    return `/prop-firm/${post.relatedPropFirm}/${post.slug}`;
  }
  if (post.relatedPropFirm && typeof post.relatedPropFirm === "object" && post.relatedPropFirm?.slug) {
    return `/prop-firm/${post.relatedPropFirm.slug}/${post.slug}`;
  }
  return `/${getCategorySlug(post)}/${post.slug}`;
}
