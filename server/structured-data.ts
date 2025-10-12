import https from 'https';
import { apiCache } from "./cache";

// Helper to strip HTML tags
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
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
    const description = stripHtml(broker.excerpt?.rendered || '').substring(0, 155) || 
                       `Comprehensive review of ${name}. Compare spreads, regulation, and trading conditions.`;
    const rating = broker.acf?.rating || 0;
    
    const schemas = [];

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
    const description = stripHtml(propFirm.excerpt?.rendered || '').substring(0, 155) || 
                       `Comprehensive review of ${name}. Compare evaluation process, profit splits, and funding options.`;
    const rating = propFirm.acf?.rating || 0;
    const faqData = propFirm.acf?.faq || [];
    
    const schemas = [];

    // Review schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Review",
      "itemReviewed": {
        "@type": "Organization",
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
  }

  // Generate script tags for each schema
  return schemas
    .map(schema => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
    .join('\n    ');
}
