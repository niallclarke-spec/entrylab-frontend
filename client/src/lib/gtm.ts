// Google Tag Manager DataLayer utilities

declare global {
  interface Window {
    dataLayer: any[];
  }
}

// Initialize dataLayer if it doesn't exist
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

export interface GTMEvent {
  event: string;
  [key: string]: any;
}

// Generic event pusher
export const pushToDataLayer = (data: GTMEvent) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(data);
    console.log('GTM Event:', data); // For debugging
  }
};

// Page view tracking
export const trackPageView = (pagePath: string, pageTitle: string) => {
  pushToDataLayer({
    event: 'page_view',
    page_path: pagePath,
    page_title: pageTitle,
  });
};

// Affiliate click tracking with granular placement details
export const trackAffiliateClick = (params: {
  broker_name: string;
  broker_type: 'broker' | 'prop_firm';
  page_location: 'home' | 'brokers' | 'prop_firms' | 'broker_review' | 'prop_firm_review' | 'article' | 'archive';
  placement_type: 'featured_widget' | 'top_rated_card' | 'broker_list_card' | 'inline_card' | 'hero_cta' | 'quick_stats_cta' | 'bottom_cta';
  rating?: number;
  affiliate_link?: string;
  position?: number; // Position in list (e.g., 1st, 2nd, 3rd card)
}) => {
  // Create descriptive click_location for easy filtering: "home_featured_widget" or "brokers_top_rated_card_position_1"
  const positionSuffix = params.position ? `_position_${params.position}` : '';
  const click_location = `${params.page_location}_${params.placement_type}${positionSuffix}`;
  
  pushToDataLayer({
    event: 'affiliate_click',
    broker_name: params.broker_name,
    broker_type: params.broker_type,
    page_location: params.page_location,
    placement_type: params.placement_type,
    click_location, // Combined string for easy filtering
    rating: params.rating,
    affiliate_link: params.affiliate_link,
    position: params.position,
  });
};

// Newsletter signup tracking
export const trackNewsletterSignup = (email: string, location: string) => {
  pushToDataLayer({
    event: 'newsletter_signup',
    email_domain: email.split('@')[1], // Track domain only for privacy
    signup_location: location,
  });
};

// Category filter tracking
export const trackCategoryFilter = (page_type: 'broker' | 'prop_firm' | 'article', category_name: string) => {
  pushToDataLayer({
    event: 'category_filter',
    filter_type: page_type,
    filter_value: category_name,
  });
};

// Search tracking
export const trackSearch = (searchQuery: string, resultsCount: number, location: string) => {
  pushToDataLayer({
    event: 'search',
    search_query: searchQuery,
    results_count: resultsCount,
    search_location: location,
  });
};

// Review page view tracking
export const trackReviewView = (params: {
  broker_name: string;
  broker_type: 'broker' | 'prop_firm';
  rating?: number;
  min_deposit?: string;
  regulation?: string;
}) => {
  pushToDataLayer({
    event: 'review_view',
    ...params,
  });
};

// Article view tracking
export const trackArticleView = (params: {
  article_title: string;
  article_slug: string;
  categories?: string[];
  author?: string;
}) => {
  pushToDataLayer({
    event: 'article_view',
    ...params,
  });
};
