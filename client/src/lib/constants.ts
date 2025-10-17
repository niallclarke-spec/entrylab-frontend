/**
 * Categories to exclude from public display
 * 
 * IMPORTANT: WordPress uses shared categories across all post types (posts, brokers, prop firms).
 * This list should include:
 * 1. Internal/non-public categories
 * 2. Categories used ONLY by Custom Post Types (brokers/prop firms)
 * 
 * When creating new categories for CPTs, add them here to prevent them from appearing in article category filters.
 */
export const EXCLUDED_CATEGORIES: readonly string[] = [
  // Internal categories
  'trading-alerts',
  'uncategorized', 
  'uncategorised',
  'prop-firm-updates',
  'broker-closures',
  'market-analysis',
  
  // CPT-only categories (add new broker/prop firm categories here)
  'top-cfd-brokers', // Popular Brokers CPT category
];
