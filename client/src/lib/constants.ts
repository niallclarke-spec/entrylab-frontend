/**
 * Categories to exclude from public display
 * 
 * IMPORTANT: This list should ONLY include:
 * 1. Internal/system categories (like "Uncategorized")
 * 2. Categories that should NEVER appear in article navigation
 * 
 * Standard WordPress categories (wp/v2/categories) are automatically separated from
 * CPT taxonomies (broker-category, prop-firm-category), so we don't need to exclude them here.
 */
export const EXCLUDED_CATEGORIES: readonly string[] = [
  // Internal WordPress categories
  'uncategorized', 
  'uncategorised',
  // Prevent /home from showing as a category page (should redirect to /)
  'home',
];
