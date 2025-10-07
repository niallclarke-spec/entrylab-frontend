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

// Affiliate click tracking
export const trackAffiliateClick = (params: {
  broker_name: string;
  broker_type: 'broker' | 'prop_firm';
  click_location: string; // e.g., 'featured_widget', 'broker_card', 'inline_card', 'review_page'
  rating?: number;
  affiliate_link?: string;
}) => {
  pushToDataLayer({
    event: 'affiliate_click',
    ...params,
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
export const trackCategoryFilter = (params: {
  category_name: string;
  page_type: 'brokers' | 'prop_firms' | 'archive';
}) => {
  pushToDataLayer({
    event: 'category_filter',
    ...params,
  });
};

// Search tracking
export const trackSearch = (searchQuery: string, resultsCount: number) => {
  pushToDataLayer({
    event: 'search',
    search_query: searchQuery,
    results_count: resultsCount,
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
