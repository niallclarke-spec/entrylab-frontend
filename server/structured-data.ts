import { db } from "./db";
import { brokersTable, propFirmsTable, articlesTable, reviewsTable } from "@shared/schema";
import { eq, and, count, avg, desc } from "drizzle-orm";

// Helper to strip HTML tags
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

// Country name to ISO code mapping for Schema.org compliance
const countryNameToCode: Record<string, string> = {
  "Australia": "AU",
  "Saint Lucia": "LC",
  "United Kingdom": "GB",
  "United States": "US",
  "Cyprus": "CY",
  "Seychelles": "SC",
  "Belize": "BZ",
  "Vanuatu": "VU",
  "Malta": "MT",
  "Gibraltar": "GI",
  "British Virgin Islands": "VG",
  "Cayman Islands": "KY",
  "Mauritius": "MU",
  "Canada": "CA",
  "Switzerland": "CH",
  "UAE": "AE",
  "United Arab Emirates": "AE",
  "Singapore": "SG",
  "Hong Kong": "HK",
  "Japan": "JP",
  "Germany": "DE",
  "France": "FR",
  "Netherlands": "NL",
  "Poland": "PL",
  "Spain": "ES",
  "Italy": "IT",
  "South Africa": "ZA",
  "New Zealand": "NZ",
  "China": "CN",
  "India": "IN",
  "Brazil": "BR",
  "Mexico": "MX",
  "Argentina": "AR",
  "Chile": "CL",
  "Russia": "RU",
  "Turkey": "TR",
  "Israel": "IL",
  "Ireland": "IE",
  "Estonia": "EE",
  "Latvia": "LV",
  "Lithuania": "LT",
  "Czech Republic": "CZ",
  "Slovakia": "SK",
  "Hungary": "HU",
  "Romania": "RO",
  "Bulgaria": "BG",
  "Greece": "GR",
  "Portugal": "PT",
  "Austria": "AT",
  "Belgium": "BE",
  "Luxembourg": "LU",
  "Denmark": "DK",
  "Sweden": "SE",
  "Norway": "NO",
  "Finland": "FI",
  "Iceland": "IS"
};

// Convert country name to ISO code
function getCountryCode(countryName: string | undefined): string | undefined {
  if (!countryName) return undefined;
  
  const trimmed = countryName.trim();
  
  // If it's already a 2-letter code, return as-is
  if (/^[A-Z]{2}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Look up the country name (case-insensitive)
  const code = countryNameToCode[trimmed] || 
               Object.entries(countryNameToCode).find(
                 ([name]) => name.toLowerCase() === trimmed.toLowerCase()
               )?.[1];
  
  // If not found, return the original (Google may still accept it)
  return code || trimmed;
}

// Parse headquarters address into locality and country
function parseHeadquarters(headquarters: string | undefined): { locality?: string; country?: string } {
  if (!headquarters) return {};
  
  const parts = headquarters.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return {};
  
  const locality = parts[0];
  
  // Check if last part looks like a postal code (digits)
  const lastPart = parts[parts.length - 1];
  const isPostalCode = /^\d+(-\d+)?$/.test(lastPart);
  
  // Country is second-to-last if last part is postal code, otherwise last
  const country = isPostalCode && parts.length > 1 
    ? parts[parts.length - 2] 
    : lastPart;
  
  return { locality, country };
}

// Validate phone number (basic check)
function isValidPhone(phone: string | undefined): boolean {
  if (!phone) return false;
  // Basic check: contains digits and common phone chars
  return /[\d\+\-\(\)\s]{7,}/.test(phone);
}


// Organization schema (always included)
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "NewsMediaOrganization"],
    "name": "EntryLab",
    "url": "https://entrylab.io",
    "logo": {
      "@type": "ImageObject",
      "url": "https://entrylab.io/favicon.svg"
    },
    "description": "Forex broker news, prop firm updates, and XAU/USD trading signals platform",
    "foundingDate": "2024",
    "areaServed": "Worldwide",
    "knowsAbout": [
      "Forex Trading",
      "Forex Brokers",
      "Proprietary Trading Firms",
      "XAU/USD Trading Signals",
      "Gold Trading",
      "Forex Market Analysis",
      "MetaTrader 4",
      "MetaTrader 5",
      "CFD Trading",
      "Prop Firm Challenges",
      "Funded Trader Accounts"
    ],
    "sameAs": [
      "https://t.me/entrylabs"
    ]
  };
}

// WebSite schema
export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "EntryLab",
    "url": "https://entrylab.io",
    "description": "Forex broker reviews, prop firm evaluations, and XAU/USD trading signals"
  };
}

// ItemList schema for brokers listing page
export async function getBrokersListSchema() {
  try {
    const brokers = await db.select({
      name: brokersTable.name,
      slug: brokersTable.slug,
      seoDescription: brokersTable.seoDescription,
      tagline: brokersTable.tagline,
    }).from(brokersTable).limit(20);

    if (!brokers || brokers.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Forex Broker Reviews",
      "description": "Comprehensive reviews of top forex brokers including spreads, regulation, and trading conditions",
      "url": "https://entrylab.io/brokers",
      "numberOfItems": brokers.length,
      "itemListElement": brokers.map((broker, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": broker.name,
        "url": `https://entrylab.io/broker/${broker.slug}`,
        "description": broker.seoDescription || broker.tagline || `Review of ${broker.name}`
      }))
    };
  } catch (error) {
    console.error('[Structured Data] Error fetching brokers list:', error);
    return null;
  }
}

// ItemList schema for prop firms listing page
export async function getPropFirmsListSchema() {
  try {
    const propFirms = await db.select({
      name: propFirmsTable.name,
      slug: propFirmsTable.slug,
      seoDescription: propFirmsTable.seoDescription,
      tagline: propFirmsTable.tagline,
    }).from(propFirmsTable).limit(20);

    if (!propFirms || propFirms.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Proprietary Trading Firm Reviews",
      "description": "Comprehensive reviews of top prop trading firms including evaluation process, profit splits, and funding options",
      "url": "https://entrylab.io/prop-firms",
      "numberOfItems": propFirms.length,
      "itemListElement": propFirms.map((firm, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": firm.name,
        "url": `https://entrylab.io/prop-firm/${firm.slug}`,
        "description": firm.seoDescription || firm.tagline || `Review of ${firm.name}`
      }))
    };
  } catch (error) {
    console.error('[Structured Data] Error fetching prop firms list:', error);
    return null;
  }
}

// Fetch approved user review stats for a broker or prop firm
async function getApprovedReviewStats(firmType: string, firmSlug: string): Promise<{ reviewCount: number; avgRating: number }> {
  try {
    const rows = await db
      .select({ avgRating: avg(reviewsTable.rating), total: count() })
      .from(reviewsTable)
      .where(and(
        eq(reviewsTable.firmType, firmType),
        eq(reviewsTable.firmSlug, firmSlug),
        eq(reviewsTable.status, 'approved')
      ));
    const reviewCount = Number(rows[0]?.total ?? 0);
    // User reviews are on a 1–10 scale; normalise to 1–5 for consistency
    const avgRaw = parseFloat(String(rows[0]?.avgRating ?? '0')) || 0;
    const avgRating = avgRaw / 2;
    return { reviewCount, avgRating };
  } catch {
    return { reviewCount: 0, avgRating: 0 };
  }
}

// Human-readable category names for breadcrumbs
const categoryLabels: Record<string, string> = {
  'broker-news': 'Broker News',
  'prop-firm-news': 'Prop Firm News',
  'broker-guides': 'Broker Guides',
  'prop-firm-guides': 'Prop Firm Guides',
  'trading-tools': 'Trading Tools',
  'news': 'News',
};

// Article schema generator
export async function getArticleSchema(slug: string) {
  try {
    const rows = await db.select().from(articlesTable).where(eq(articlesTable.slug, slug)).limit(1);
    if (!rows || rows.length === 0) return null;

    const article = rows[0];
    const title = stripHtml(article.title || '');
    const description = article.seoDescription || stripHtml(article.excerpt || '').substring(0, 155);
    const authorName = article.author || "EntryLab Editorial Team";
    const image = article.featuredImage || "https://entrylab.io/assets/entrylab-logo-green.png";
    
    const datePublished = article.publishedAt ? article.publishedAt.toISOString() : article.createdAt.toISOString();
    const dateModified = article.updatedAt ? article.updatedAt.toISOString() : datePublished;

    const newsCategories = ['broker-news', 'prop-firm-news', 'news'];
    const isNewsArticle = newsCategories.some(c => (article.category || '').toLowerCase().includes(c));
    const articleType = isNewsArticle ? "NewsArticle" : "Article";

    // Canonical URL uses /:category/:slug format
    const categorySlug = article.category || 'news';
    const canonicalUrl = `https://entrylab.io/${categorySlug}/${slug}`;
    const categoryLabel = categoryLabels[categorySlug] || categorySlug;
    const categoryUrl = `https://entrylab.io/${categorySlug}`;

    const schemas = [];

    // Use Person type for named human authors; fall back to Organization for the editorial team
    const isEditorialTeam = !authorName || authorName.toLowerCase().includes('team') || authorName.toLowerCase().includes('entrylab');
    const authorSchema = isEditorialTeam
      ? { "@type": "Organization", "name": "EntryLab Editorial Team", "url": "https://entrylab.io" }
      : { "@type": "Person", "name": authorName, "url": "https://entrylab.io" };

    // Article schema (NewsArticle for news content, Article for guides/educational)
    schemas.push({
      "@context": "https://schema.org",
      "@type": articleType,
      "headline": title,
      "description": description,
      "image": image,
      "datePublished": datePublished,
      "dateModified": dateModified,
      "author": authorSchema,
      "publisher": {
        "@type": "Organization",
        "name": "EntryLab",
        "logo": {
          "@type": "ImageObject",
          "url": "https://entrylab.io/assets/entrylab-logo-green.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      ...(article.category && { "articleSection": categoryLabel }),
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", ".article-excerpt"]
      }
    });

    // Breadcrumb schema using correct canonical URLs
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://entrylab.io"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": categoryLabel,
          "item": categoryUrl
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": title,
          "item": canonicalUrl
        }
      ]
    });

    return schemas;
  } catch (error) {
    console.error('[Structured Data] Error fetching article:', error);
    return null;
  }
}

// Broker review schema generator
export async function getBrokerSchema(slug: string) {
  try {
    const rows = await db.select().from(brokersTable).where(eq(brokersTable.slug, slug)).limit(1);
    if (!rows || rows.length === 0) return null;

    const broker = rows[0];
    const name = broker.name;
    const description = broker.seoDescription || broker.tagline ||
                       `Comprehensive review of ${name}. Compare spreads, regulation, and trading conditions.`;
    
    const rating = parseFloat(String(broker.rating ?? '0')) || 0;
    const link = broker.affiliateLink || '';
    const headquarters = broker.headquarters;
    const support = broker.support;
    const minDeposit = broker.minDeposit;
    const yearFounded = broker.yearFounded;
    
    // Parse headquarters into address components
    const { locality, country } = parseHeadquarters(headquarters);
    
    const schemas = [];

    // FinancialService schema (standalone entity)
    const hasAddressData = locality || country;
    const financialServiceSchema: any = {
      "@context": "https://schema.org",
      "@type": "FinancialService",
      "@id": `https://entrylab.io/broker/${slug}#organization`,
      "name": name,
      "description": description,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://entrylab.io/broker/${slug}`
      }
    };
    
    // Only include URL if we have a valid broker website link
    if (link && link.trim()) {
      financialServiceSchema.url = link;
    }
    
    // Add address if we have location data
    if (hasAddressData) {
      const address: any = {
        "@type": "PostalAddress"
      };
      if (locality) address.addressLocality = locality;
      if (country) address.addressCountry = getCountryCode(country);
      financialServiceSchema.address = address;
    }
    
    // Add optional fields if available
    if (support && isValidPhone(support)) {
      financialServiceSchema.telephone = support;
    }
    if (minDeposit) {
      financialServiceSchema.priceRange = `From ${minDeposit}`;
    }
    if (yearFounded) {
      financialServiceSchema.foundingDate = yearFounded;
    }
    
    // AggregateRating — combines EntryLab editorial rating with approved user reviews
    if (rating > 0) {
      const userStats = await getApprovedReviewStats('broker', slug);
      const totalCount = 1 + userStats.reviewCount;
      const combinedRating = userStats.reviewCount > 0
        ? Math.round(((rating + userStats.avgRating * userStats.reviewCount) / totalCount) * 10) / 10
        : rating;
      financialServiceSchema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": combinedRating,
        "bestRating": 5,
        "worstRating": 1,
        "ratingCount": totalCount,
        "reviewCount": totalCount
      };
    }

    schemas.push(financialServiceSchema);

    // Review schema - references the FinancialService above using @id
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Review",
      "itemReviewed": {
        "@id": `https://entrylab.io/broker/${slug}#organization`
      },
      "author": {
        "@type": "Organization",
        "name": "EntryLab"
      },
      "datePublished": broker.createdAt ? broker.createdAt.toISOString() : undefined,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": rating,
        "bestRating": 5,
        "worstRating": 1
      }
    });

    // Breadcrumb schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://entrylab.io"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Brokers",
          "item": "https://entrylab.io/brokers"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": name,
          "item": `https://entrylab.io/broker/${slug}`
        }
      ]
    });

    return schemas;
  } catch (error) {
    console.error('[Structured Data] Error fetching broker:', error);
    return null;
  }
}

// Prop firm review schema generator
export async function getPropFirmSchema(slug: string) {
  try {
    const rows = await db.select().from(propFirmsTable).where(eq(propFirmsTable.slug, slug)).limit(1);
    if (!rows || rows.length === 0) return null;

    const propFirm = rows[0];
    const name = propFirm.name;
    const description = propFirm.seoDescription || propFirm.tagline ||
                       `Comprehensive review of ${name}. Compare evaluation process, profit splits, and funding options.`;
    
    const rating = parseFloat(String(propFirm.rating ?? '0')) || 0;
    const link = propFirm.affiliateLink || '';
    const headquarters = propFirm.headquarters;
    const support = propFirm.support;
    const minDeposit = propFirm.evaluationFee;
    const yearFounded: string | null = null;
    
    // Parse headquarters into address components
    const { locality, country } = parseHeadquarters(headquarters);
    
    const schemas = [];
    
    // FinancialService schema (standalone entity for prop firm)
    const hasAddressData = locality || country;
    const financialServiceSchema: any = {
      "@context": "https://schema.org",
      "@type": "FinancialService",
      "@id": `https://entrylab.io/prop-firm/${slug}#organization`,
      "name": name,
      "description": description,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://entrylab.io/prop-firm/${slug}`
      }
    };
    
    // Only include URL if we have a valid prop firm website link
    if (link && link.trim()) {
      financialServiceSchema.url = link;
    }
    
    // Add address if we have location data
    if (hasAddressData) {
      const address: any = {
        "@type": "PostalAddress"
      };
      if (locality) address.addressLocality = locality;
      if (country) address.addressCountry = getCountryCode(country);
      financialServiceSchema.address = address;
    }
    
    // Add optional fields if available
    if (support && isValidPhone(support)) {
      financialServiceSchema.telephone = support;
    }
    if (minDeposit) {
      financialServiceSchema.priceRange = `From ${minDeposit}`;
    }
    if (yearFounded) {
      financialServiceSchema.foundingDate = yearFounded;
    }

    // AggregateRating — combines EntryLab editorial rating with approved user reviews
    if (rating > 0) {
      const userStats = await getApprovedReviewStats('prop_firm', slug);
      const totalCount = 1 + userStats.reviewCount;
      const combinedRating = userStats.reviewCount > 0
        ? Math.round(((rating + userStats.avgRating * userStats.reviewCount) / totalCount) * 10) / 10
        : rating;
      financialServiceSchema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": combinedRating,
        "bestRating": 5,
        "worstRating": 1,
        "ratingCount": totalCount,
        "reviewCount": totalCount
      };
    }
    
    schemas.push(financialServiceSchema);

    // Review schema - references the FinancialService above using @id
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Review",
      "itemReviewed": {
        "@id": `https://entrylab.io/prop-firm/${slug}#organization`
      },
      "author": {
        "@type": "Organization",
        "name": "EntryLab"
      },
      "datePublished": propFirm.createdAt ? propFirm.createdAt.toISOString() : undefined,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": rating,
        "bestRating": 5,
        "worstRating": 1
      }
    });

    // Breadcrumb schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://entrylab.io"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Prop Firms",
          "item": "https://entrylab.io/prop-firms"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": name,
          "item": `https://entrylab.io/prop-firm/${slug}`
        }
      ]
    });

    return schemas;
  } catch (error) {
    console.error('[Structured Data] Error fetching prop firm:', error);
    return null;
  }
}

// Comparison page schema — WebPage + BreadcrumbList for /compare/broker/:slug and /compare/prop-firm/:slug
async function getComparisonPageSchema(entityType: 'broker' | 'prop-firm', slug: string) {
  try {
    const table = entityType === 'broker' ? brokersTable : propFirmsTable;
    const [a, b] = slug.split('-vs-');
    if (!a || !b) return null;

    const canonicalUrl = `https://entrylab.io/compare/${entityType}/${slug}`;
    const hubLabel = entityType === 'broker' ? 'Broker Comparisons' : 'Prop Firm Comparisons';
    const hubUrl = `https://entrylab.io/compare/${entityType}`;

    // Look up display names for both entities so the breadcrumb label is human-readable
    const [rowA] = await db.select({ name: table.name }).from(table).where(eq(table.slug, a)).limit(1);
    const [rowB] = await db.select({ name: table.name }).from(table).where(eq(table.slug, b)).limit(1);
    const nameA = rowA?.name || a;
    const nameB = rowB?.name || b;
    const pageTitle = `${nameA} vs ${nameB}`;

    return [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": pageTitle,
        "description": `Compare ${nameA} vs ${nameB} side-by-side. In-depth analysis of fees, regulation, trading conditions, and more.`,
        "url": canonicalUrl,
        "publisher": {
          "@type": "Organization",
          "name": "EntryLab",
          "url": "https://entrylab.io"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://entrylab.io" },
          { "@type": "ListItem", "position": 2, "name": hubLabel, "item": hubUrl },
          { "@type": "ListItem", "position": 3, "name": pageTitle, "item": canonicalUrl }
        ]
      }
    ];
  } catch (err) {
    console.error('[Structured Data] Comparison schema error:', err);
    return null;
  }
}

// Static hub and archive page schemas — WebPage + BreadcrumbList for pages that had no schema
function getStaticPageSchemas(urlParts: string[]): any[] {
  const BASE = 'https://entrylab.io';

  const categoryMeta: Record<string, { label: string; desc: string }> = {
    'broker-news':       { label: 'Broker News',       desc: 'Latest forex broker news, regulatory updates, and industry announcements.' },
    'prop-firm-news':    { label: 'Prop Firm News',    desc: 'Latest prop trading firm news, rule changes, and payout updates.' },
    'broker-guides':     { label: 'Broker Guides',     desc: 'In-depth broker guides, platform walkthroughs, and trading condition breakdowns.' },
    'prop-firm-guides':  { label: 'Prop Firm Guides',  desc: 'Prop firm guides, evaluation tips, and challenge strategy breakdowns.' },
    'trading-tools':     { label: 'Trading Tools',     desc: 'Trading tools, calculators, and platform feature guides for forex traders.' },
    'news':              { label: 'News',              desc: 'Financial market news and forex industry updates from EntryLab.' },
  };

  // Category archive pages: /broker-news, /prop-firm-news, etc.
  if (urlParts.length === 1 && categoryMeta[urlParts[0]]) {
    const { label, desc } = categoryMeta[urlParts[0]];
    const pageUrl = `${BASE}/${urlParts[0]}`;
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": `${label} | EntryLab`,
        "description": desc,
        "url": pageUrl,
        "publisher": { "@type": "Organization", "name": "EntryLab", "url": BASE }
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE },
          { "@type": "ListItem", "position": 2, "name": label, "item": pageUrl }
        ]
      }
    ];
  }

  // /signals hub
  if (urlParts.length === 1 && urlParts[0] === 'signals') {
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Premium Forex Signals | EntryLab",
        "description": "Daily forex trading signals with entry, stop-loss, and take-profit levels. Subscribe for premium access via Telegram.",
        "url": `${BASE}/signals`,
        "publisher": { "@type": "Organization", "name": "EntryLab", "url": BASE }
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE },
          { "@type": "ListItem", "position": 2, "name": "Forex Signals", "item": `${BASE}/signals` }
        ]
      }
    ];
  }

  // /compare top-level hub
  if (urlParts.length === 1 && urlParts[0] === 'compare') {
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Compare Forex Brokers & Prop Firms | EntryLab",
        "description": "Side-by-side comparisons of forex brokers and prop trading firms. Compare fees, regulation, platforms, and more.",
        "url": `${BASE}/compare`,
        "publisher": { "@type": "Organization", "name": "EntryLab", "url": BASE }
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE },
          { "@type": "ListItem", "position": 2, "name": "Compare", "item": `${BASE}/compare` }
        ]
      }
    ];
  }

  // /compare/broker and /compare/prop-firm hub pages
  if (urlParts.length === 2 && urlParts[0] === 'compare' && (urlParts[1] === 'broker' || urlParts[1] === 'prop-firm')) {
    const isPropFirm = urlParts[1] === 'prop-firm';
    const label = isPropFirm ? 'Prop Firm Comparisons' : 'Broker Comparisons';
    const desc = isPropFirm
      ? 'Compare prop trading firms side-by-side. Evaluation fees, profit splits, max funding, and platform breakdowns.'
      : 'Compare forex brokers side-by-side. Regulation, spreads, leverage, platforms, and minimum deposits.';
    const pageUrl = `${BASE}/compare/${urlParts[1]}`;
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": `${label} | EntryLab`,
        "description": desc,
        "url": pageUrl,
        "publisher": { "@type": "Organization", "name": "EntryLab", "url": BASE }
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE },
          { "@type": "ListItem", "position": 2, "name": "Compare", "item": `${BASE}/compare` },
          { "@type": "ListItem", "position": 3, "name": label, "item": pageUrl }
        ]
      }
    ];
  }

  return [];
}

// In-memory cache for homepage ItemList — refreshed every 5 minutes
let _recentArticlesCache: { data: any; ts: number } | null = null;
const RECENT_ARTICLES_TTL = 5 * 60 * 1000; // 5 minutes

// ItemList of the 8 most-recently published articles — added to homepage schema
async function getRecentArticlesItemListSchema() {
  if (_recentArticlesCache && Date.now() - _recentArticlesCache.ts < RECENT_ARTICLES_TTL) {
    return _recentArticlesCache.data;
  }
  try {
    const recent = await db
      .select({ slug: articlesTable.slug, title: articlesTable.title, category: articlesTable.category, featuredImage: articlesTable.featuredImage })
      .from(articlesTable)
      .where(eq(articlesTable.status, 'published'))
      .orderBy(desc(articlesTable.publishedAt))
      .limit(8);

    if (!recent.length) return null;

    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Latest Forex & Trading Articles",
      "url": "https://entrylab.io",
      "itemListElement": recent.map((art, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "url": `https://entrylab.io/${art.category || 'news'}/${art.slug}`,
        "name": stripHtml(art.title || '')
      }))
    };
    _recentArticlesCache = { data: schema, ts: Date.now() };
    return schema;
  } catch (err) {
    console.error('[Structured Data] Recent articles ItemList error:', err);
    return _recentArticlesCache?.data ?? null; // serve stale on error rather than nothing
  }
}

// Generate structured data based on URL path
export async function generateStructuredData(url: string): Promise<string> {
  const schemas: any[] = [];

  // Parse URL to determine page type and extract slug
  const urlParts = url.split('?')[0].split('/').filter(Boolean);
  
  // Determine if this is a broker/prop-firm detail page (they have their own entity schemas)
  const isBrokerOrPropFirm = (urlParts[0] === 'broker' || urlParts[0] === 'prop-firm') && urlParts[1];
  const isComparisonPage = urlParts[0] === 'compare' && urlParts.length === 3;
  
  // Only include organization schema on non-broker/prop-firm detail pages
  if (!isBrokerOrPropFirm && !isComparisonPage) {
    schemas.push(getOrganizationSchema());
  }

  // Add WebSite schema on homepage only
  const isHomePage = urlParts.length === 0;
  if (isHomePage) {
    schemas.push(getWebSiteSchema());
    const recentArticles = await getRecentArticlesItemListSchema();
    if (recentArticles) schemas.push(recentArticles);
  }
  
  if (urlParts[0] === 'article' && urlParts[1]) {
    const articleSchemas = await getArticleSchema(urlParts[1]);
    if (articleSchemas) schemas.push(...articleSchemas);
  } else if (urlParts[0] === 'broker' && urlParts[1]) {
    const brokerSchemas = await getBrokerSchema(urlParts[1]);
    if (brokerSchemas) schemas.push(...brokerSchemas);
  } else if (urlParts[0] === 'prop-firm' && urlParts[1]) {
    const propFirmSchemas = await getPropFirmSchema(urlParts[1]);
    if (propFirmSchemas) schemas.push(...propFirmSchemas);
  } else if (urlParts[0] === 'brokers' && !urlParts[1]) {
    const brokersListSchema = await getBrokersListSchema();
    if (brokersListSchema) schemas.push(brokersListSchema);
  } else if (urlParts[0] === 'prop-firms' && !urlParts[1]) {
    const propFirmsListSchema = await getPropFirmsListSchema();
    if (propFirmsListSchema) schemas.push(propFirmsListSchema);
  } else if (urlParts.length === 2 && ['news', 'broker-news', 'broker-guides', 'prop-firm-news', 'prop-firm-guides', 'trading-tools'].includes(urlParts[0])) {
    // Handle /:category/:slug article format (e.g., /broker-news/zarafx-gets-raided)
    const articleSchemas = await getArticleSchema(urlParts[1]);
    if (articleSchemas) schemas.push(...articleSchemas);
  } else {
    // Hub and archive pages: /compare, /compare/broker, /compare/prop-firm, /broker-news, /signals, etc.
    const staticSchemas = getStaticPageSchemas(urlParts);
    if (staticSchemas.length) schemas.push(...staticSchemas);
  }

  if (urlParts[0] === 'compare' && urlParts.length === 3 && (urlParts[1] === 'broker' || urlParts[1] === 'prop-firm')) {
    // Comparison pages: /compare/broker/:slug and /compare/prop-firm/:slug
    const entityType = urlParts[1] as 'broker' | 'prop-firm';
    const compSchemas = await getComparisonPageSchema(entityType, urlParts[2]);
    if (compSchemas) schemas.push(...compSchemas);
  }

  // Generate script tags for each schema
  return schemas
    .map(schema => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
    .join('\n    ');
}
