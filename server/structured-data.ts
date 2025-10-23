import https from 'https';
import { apiCache } from "./cache";

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

// Helper function to make WordPress API requests
function fetchWordPress(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Host': urlObj.hostname,
      'Connection': 'keep-alive',
    };
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers,
      servername: urlObj.hostname,
      rejectUnauthorized: true,
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}`));
          } else {
            resolve(JSON.parse(data));
          }
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', (err) => reject(err));
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Cached WordPress API fetcher
async function fetchWordPressWithCache(
  url: string, 
  options: { cacheTTL?: number; staleTTL?: number } = {}
): Promise<any> {
  const cacheTTL = options.cacheTTL || 900; // 15 minutes
  const staleTTL = options.staleTTL || 3600; // 60 minutes
  
  // Check cache first
  const cached = apiCache.get(url);
  if (cached) {
    // If stale, revalidate in background
    if (apiCache.isStale(url)) {
      fetchWordPress(url)
        .then(data => apiCache.set(url, data, cacheTTL, staleTTL))
        .catch(() => {}); // Ignore background errors
    }
    return cached;
  }
  
  // Fetch fresh data
  const data = await fetchWordPress(url);
  apiCache.set(url, data, cacheTTL, staleTTL);
  return data;
}

// Organization schema (always included)
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "EntryLab",
    "url": "https://entrylab.io",
    "logo": "https://entrylab.io/favicon.svg",
    "description": "Forex broker news, prop firm updates, and trading analysis platform",
    "sameAs": [
      "https://twitter.com/entrylab",
      "https://facebook.com/entrylab"
    ]
  };
}

// Article schema generator
export async function getArticleSchema(slug: string) {
  try {
    const post = await fetchWordPressWithCache(
      `https://admin.entrylab.io/wp-json/wp/v2/posts?slug=${slug}&_embed`,
      { cacheTTL: 900, staleTTL: 3600 }
    );

    if (!post || post.length === 0) return null;

    const article = post[0];
    const title = stripHtml(article.title?.rendered || '');
    const description = stripHtml(article.excerpt?.rendered || '').substring(0, 155);
    const author = article._embedded?.author?.[0]?.name || "EntryLab Editorial Team";
    const categories = article._embedded?.["wp:term"]?.[0]?.map((t: any) => t.name) || [];
    const tags = article._embedded?.["wp:term"]?.[1]?.map((t: any) => t.name) || [];
    
    // Get featured image
    const media = article._embedded?.["wp:featuredmedia"]?.[0];
    const image = media?.source_url || "https://entrylab.io/og-image.jpg";

    const schemas = [];

    // Article schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "image": image,
      "datePublished": article.date,
      "dateModified": article.modified || article.date,
      "author": {
        "@type": "Person",
        "name": author
      },
      "publisher": {
        "@type": "Organization",
        "name": "EntryLab",
        "logo": {
          "@type": "ImageObject",
          "url": "https://entrylab.io/favicon.svg"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://entrylab.io/article/${slug}`
      },
      ...(categories.length > 0 && { "articleSection": categories.join(", ") }),
      ...(tags.length > 0 && { "keywords": tags.join(", ") })
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
          "name": "Articles",
          "item": "https://entrylab.io/archive"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": title,
          "item": `https://entrylab.io/article/${slug}`
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
    const brokers = await fetchWordPressWithCache(
      `https://admin.entrylab.io/wp-json/wp/v2/popular_broker?slug=${slug}&_embed&acf_format=standard`,
      { cacheTTL: 900, staleTTL: 3600 }
    );

    if (!brokers || brokers.length === 0) return null;

    const broker = brokers[0];
    const name = stripHtml(broker.title?.rendered || '');
    
    // Get SEO meta description from Yoast (prioritize over excerpt/tagline)
    const yoastMeta = broker.yoast_head_json?.description;
    const description = yoastMeta || 
                       stripHtml(broker.excerpt?.rendered || '').substring(0, 155) || 
                       `Comprehensive review of ${name}. Compare spreads, regulation, and trading conditions.`;
    
    const acf = broker.acf || {};
    const rating = acf.rating || 0;
    const link = acf.link || '';
    const headquarters = acf.headquarters;
    const support = acf.support;
    const minDeposit = acf.min_deposit;
    const yearFounded = acf.year_founded;
    
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
    
    schemas.push(financialServiceSchema);

    // Review schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Review",
      "itemReviewed": {
        "@type": "FinancialService",
        "name": name,
        "description": description
      },
      "author": {
        "@type": "Organization",
        "name": "EntryLab"
      },
      "datePublished": broker.date,
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
    const propFirms = await fetchWordPressWithCache(
      `https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?slug=${slug}&_embed&acf_format=standard`,
      { cacheTTL: 900, staleTTL: 3600 }
    );

    if (!propFirms || propFirms.length === 0) return null;

    const propFirm = propFirms[0];
    const name = stripHtml(propFirm.title?.rendered || '');
    
    // Get SEO meta description from Yoast (prioritize over excerpt)
    const yoastMeta = propFirm.yoast_head_json?.description;
    const description = yoastMeta || 
                       stripHtml(propFirm.excerpt?.rendered || '').substring(0, 155) || 
                       `Comprehensive review of ${name}. Compare evaluation process, profit splits, and funding options.`;
    
    const acf = propFirm.acf || {};
    const rating = acf.rating || 0;
    const faqData = acf.faq || [];
    const link = acf.link || '';
    const headquarters = acf.headquarters;
    const support = acf.support;
    const minDeposit = acf.minimum_account_size;
    const yearFounded = acf.year_founded;
    
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
    
    schemas.push(financialServiceSchema);

    // Review schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Review",
      "itemReviewed": {
        "@type": "FinancialService",
        "name": name,
        "description": description
      },
      "author": {
        "@type": "Organization",
        "name": "EntryLab"
      },
      "datePublished": propFirm.date,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": rating,
        "bestRating": 5,
        "worstRating": 1
      }
    });

    // FAQ schema (if FAQ data exists)
    if (faqData.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqData.map((item: any) => ({
          "@type": "Question",
          "name": stripHtml(item.question || ''),
          "acceptedAnswer": {
            "@type": "Answer",
            "text": stripHtml(item.answer || '')
          }
        }))
      });
    }

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

// Generate structured data based on URL path
export async function generateStructuredData(url: string): Promise<string> {
  const schemas: any[] = [];

  // Always include organization schema
  schemas.push(getOrganizationSchema());

  // Parse URL to determine page type and extract slug
  const urlParts = url.split('?')[0].split('/').filter(Boolean);
  
  if (urlParts[0] === 'article' && urlParts[1]) {
    const articleSchemas = await getArticleSchema(urlParts[1]);
    if (articleSchemas) {
      schemas.push(...articleSchemas);
    }
  } else if (urlParts[0] === 'broker' && urlParts[1]) {
    const brokerSchemas = await getBrokerSchema(urlParts[1]);
    if (brokerSchemas) {
      schemas.push(...brokerSchemas);
    }
  } else if (urlParts[0] === 'prop-firm' && urlParts[1]) {
    const propFirmSchemas = await getPropFirmSchema(urlParts[1]);
    if (propFirmSchemas) {
      schemas.push(...propFirmSchemas);
    }
  } else if (urlParts.length === 2 && ['news', 'broker-news', 'broker-guides', 'prop-firm-news', 'trading-strategies'].includes(urlParts[0])) {
    // Handle /:category/:slug article format (e.g., /broker-news/zarafx-gets-raided)
    const articleSchemas = await getArticleSchema(urlParts[1]);
    if (articleSchemas) {
      schemas.push(...articleSchemas);
    }
  }

  // Generate script tags for each schema
  return schemas
    .map(schema => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
    .join('\n    ');
}
