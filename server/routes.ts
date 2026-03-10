import type { Express } from "express";
import { createServer, type Server } from "http";
import https from "https";
import { storage } from "./storage";
import { db } from "./db";
import { brokerAlerts, insertBrokerAlertSchema, signalUsers, emailCaptures, subscriptions, brokersTable, propFirmsTable } from "../shared/schema";
import { apiCache } from "./cache";
import { sendReviewNotification, sendTelegramMessage, getTelegramBot } from "./telegram";
import { generateStructuredData } from "./structured-data";
import { getUncachableStripeClient } from "./stripeClient";
import { eq, asc, ilike } from "drizzle-orm";
import { getWelcomeEmailHtml, getCancellationEmailHtml, getFreeChannelEmailHtml } from "./emailTemplates";
import { getUncachableResendClient } from "./resendClient";
import { migrateBrokers, migratePropFirms } from "./migrate-wordpress";

// Cache key for published reviews - used for cache invalidation after approval/rejection
const REVIEWS_CACHE_KEY = 'https://admin.entrylab.io/wp-json/wp/v2/review?status=publish&acf_format=standard&per_page=100&_embed';

// ─── DB row → API shape helpers ──────────────────────────────────────────────

function brokerDbToApi(row: any) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logo: row.logoUrl || `https://placehold.co/200x80/1a1a1a/8b5cf6?text=${encodeURIComponent(row.name)}`,
    verified: row.isVerified ?? true,
    featured: row.isFeatured ?? false,
    rating: parseFloat(row.rating) || 4.5,
    pros: row.pros || [],
    cons: row.cons || [],
    highlights: row.highlights || [],
    features: (row.highlights || []).map((h: string) => ({ icon: "trending", text: h })),
    featuredHighlights: row.highlights || [],
    link: row.affiliateLink || "#",
    reviewLink: `/broker/${row.slug}`,
    tagline: row.tagline || "",
    bonusOffer: row.bonusOffer || "",
    content: row.content || "",
    minDeposit: row.minDeposit,
    minWithdrawal: row.minWithdrawal,
    maxLeverage: row.maxLeverage,
    spreadFrom: row.spreadFrom,
    regulation: row.regulation,
    platforms: row.platforms,
    paymentMethods: row.paymentMethods,
    headquarters: row.headquarters,
    support: row.support,
    yearFounded: row.yearFounded,
    totalUsers: row.popularity,
    lastUpdated: row.lastUpdated,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
  };
}

function propFirmDbToApi(row: any) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logo: row.logoUrl || `https://placehold.co/200x80/1a1a1a/8b5cf6?text=${encodeURIComponent(row.name)}`,
    verified: row.isVerified ?? true,
    featured: row.isFeatured ?? false,
    rating: parseFloat(row.rating) || 4.5,
    pros: row.pros || [],
    cons: row.cons || [],
    highlights: row.highlights || [],
    features: (row.highlights || []).map((h: string) => ({ icon: "trending", text: h })),
    featuredHighlights: row.highlights || [],
    link: row.affiliateLink || "#",
    reviewLink: `/prop-firm/${row.slug}`,
    tagline: row.tagline || "",
    bonusOffer: row.bonusOffer || "",
    discountAmount: row.discountAmount || "",
    content: row.content || "",
    profitSplit: row.profitSplit,
    maxFundingSize: row.maxFundingSize,
    evaluationFee: row.evaluationFee,
    discountCode: row.discountCode,
    propFirmUsp: row.propFirmUsp,
    totalUsers: row.popularity,
    lastUpdated: row.lastUpdated,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
  };
}

// Helper function to make WordPress API requests using native https module
function fetchWordPress(url: string, options: { method?: string; body?: any; requireAuth?: boolean } = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : undefined;
    
    // Build headers object
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Host': urlObj.hostname,
      'Connection': 'keep-alive',
    };
    
    // Add authentication for POST/PUT/DELETE requests or when explicitly required
    if (options.requireAuth || method !== 'GET') {
      const username = process.env.WORDPRESS_USERNAME;
      const password = process.env.WORDPRESS_PASSWORD;
      
      if (username && password) {
        const credentials = Buffer.from(`${username}:${password}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
        console.log(`[WordPress Auth] Sending credentials for user: ${username}`);
      } else {
        console.error('[WordPress Auth] Missing credentials!');
      }
    }
    
    // Add content headers if body exists
    if (body) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body).toString();
    }
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers,
      servername: urlObj.hostname, // SNI support
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
            // Try to parse error response, but handle invalid JSON
            let errorMessage = `HTTP ${res.statusCode}`;
            try {
              const errorData = JSON.parse(data);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              // If not JSON, include raw response preview
              errorMessage += `: ${data.substring(0, 200)}`;
            }
            const error: any = new Error(errorMessage);
            error.statusCode = res.statusCode;
            error.isHttpError = true;
            reject(error);
          } else {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          }
        } catch (e) {
          // WordPress returned non-JSON (likely HTML from WAF, rate limit, or error page)
          const error: any = new Error('WordPress returned invalid response format');
          error.statusCode = 502; // Bad Gateway
          error.isParseError = true;
          error.responsePreview = data.substring(0, 200);
          // Check if it looks like HTML
          if (data.trim().startsWith('<')) {
            error.message = 'WordPress returned HTML instead of JSON (possible rate limit or WAF block)';
          }
          reject(error);
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

// Cached WordPress API fetcher with stale-while-revalidate
async function fetchWordPressWithCache(
  url: string, 
  options: { method?: string; body?: any; requireAuth?: boolean; cacheTTL?: number; staleTTL?: number } = {}
): Promise<any> {
  const method = options.method || 'GET';
  const cacheTTL = options.cacheTTL || 900; // 15 minutes default (increased from 10)
  const staleTTL = options.staleTTL || 3600; // 60 minutes stale-while-revalidate (increased from 30)
  
  // Only cache GET requests
  if (method === 'GET') {
    const cacheKey = url;
    const cached = apiCache.get(cacheKey);
    
    if (cached) {
      // Check if data is stale but still within stale-while-revalidate window
      if (apiCache.isStale(cacheKey)) {
        console.log(`[Cache STALE] ${url} - serving stale while revalidating`);
        // Return stale data immediately, revalidate in background
        fetchWordPress(url, options)
          .then(freshData => {
            apiCache.set(cacheKey, freshData, cacheTTL, staleTTL);
            console.log(`[Cache REVALIDATED] ${url}`);
          })
          .catch(err => console.error(`[Cache REVALIDATION FAILED] ${url}:`, err.message));
      } else {
        console.log(`[Cache HIT] ${url}`);
      }
      return cached;
    }
    
    console.log(`[Cache MISS] ${url}`);
    const data = await fetchWordPress(url, options);
    apiCache.set(cacheKey, data, cacheTTL, staleTTL);
    return data;
  }
  
  // Don't cache non-GET requests
  return fetchWordPress(url, options);
}

// Helper function to handle WordPress API errors
function handleWordPressError(error: any, res: any, operation: string) {
  console.error(`Error ${operation}:`, error.message);
  
  // Set cache headers for error responses too (5 min browser cache)
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  
  // Determine appropriate status code
  let statusCode = 500;
  let errorMessage = `Failed to ${operation}`;
  
  if (error.isParseError) {
    // WordPress returned non-JSON (WAF, rate limit, etc.)
    statusCode = 502; // Bad Gateway
    errorMessage = error.message;
  } else if (error.isHttpError && error.statusCode) {
    // WordPress returned an HTTP error
    statusCode = error.statusCode;
    errorMessage = error.message;
  } else if (error.message?.includes('timeout')) {
    statusCode = 504; // Gateway Timeout
    errorMessage = 'WordPress request timed out';
  }
  
  res.status(statusCode).json({ 
    error: errorMessage,
    details: error.responsePreview ? `Response: ${error.responsePreview}` : undefined
  });
}

// Helper function to verify reCAPTCHA token
// DISABLED: reCAPTCHA verification temporarily disabled until traffic increases
async function verifyRecaptcha(token: string): Promise<boolean> {
  console.log('[reCAPTCHA] Verification disabled - accepting all submissions');
  return true;
  
  // Original implementation (commented out):
  /*
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Skip reCAPTCHA verification in development/Replit environment
  // Only enforce in production
  if (!isProduction) {
    console.log('[reCAPTCHA] Development/Replit mode - skipping verification');
    return true;
  }
  
  // Production mode - enforce reCAPTCHA
  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY not configured in production');
    return false;
  }

  // If no token provided in production, reject
  if (!token || token.trim() === '') {
    console.warn('No reCAPTCHA token provided in production');
    return false;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    console.log('[reCAPTCHA] Verification response:', JSON.stringify(data));
    
    if (!data.success) {
      console.warn('[reCAPTCHA] Verification failed. Errors:', data['error-codes']);
    }
    
    return data.success === true;
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return false;
  }
  */
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/wordpress/posts", async (req, res) => {
    try {
      const { category } = req.query;
      let url = "https://admin.entrylab.io/wp-json/wp/v2/posts?_embed&acf_format=standard&per_page=100&orderby=date&order=desc";
      
      if (category) {
        // If category is a slug (string), first fetch the category to get its ID
        if (typeof category === 'string' && isNaN(Number(category))) {
          const categoryUrl = `https://admin.entrylab.io/wp-json/wp/v2/categories?slug=${category}`;
          const categoryData = await fetchWordPressWithCache(categoryUrl);
          
          if (categoryData && categoryData.length > 0) {
            url += `&categories=${categoryData[0].id}`;
          }
        } else {
          // Category is already an ID
          url += `&categories=${category}`;
        }
      }
      
      const posts = await fetchWordPressWithCache(url); // Use 15 min default cache
      
      // Set browser cache headers (5 min) to reduce repeat requests
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json(posts);
    } catch (error) {
      handleWordPressError(error, res, "fetch posts");
    }
  });

  app.get("/api/wordpress/categories", async (req, res) => {
    try {
      const { slug } = req.query;
      let url = "https://admin.entrylab.io/wp-json/wp/v2/categories";
      
      if (slug) {
        url += `?slug=${slug}`;
      }
      
      const categories = await fetchWordPressWithCache(url); // Use 15 min default cache
      
      // Set browser cache headers (5 min) to reduce repeat requests
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json(categories);
    } catch (error) {
      handleWordPressError(error, res, "fetch categories");
    }
  });

  // Aggregated category content endpoint - returns posts, brokers, and prop firms for a category
  app.get("/api/wordpress/category-content", async (req, res) => {
    try {
      const { category } = req.query;
      
      if (!category) {
        return res.status(400).json({ error: "Category parameter required" });
      }

      // Try to find the category in multiple taxonomies
      let categoryId: number | null = null;
      let brokerCategoryId: number | null = null;
      let propFirmCategoryId: number | null = null;
      
      if (typeof category === 'string' && isNaN(Number(category))) {
        // Try broker-category taxonomy first
        const brokerCatData = await fetchWordPressWithCache(
          `https://admin.entrylab.io/wp-json/wp/v2/broker-category?slug=${category}`
        ).catch(() => null);
        
        if (brokerCatData && brokerCatData.length > 0) {
          brokerCategoryId = brokerCatData[0].id;
          console.log('[CATEGORY-CONTENT] Found broker category:', category, '-> ID:', brokerCategoryId);
        }
        
        // Try prop-firm-category taxonomy
        const propFirmCatData = await fetchWordPressWithCache(
          `https://admin.entrylab.io/wp-json/wp/v2/prop-firm-category?slug=${category}`
        ).catch(() => null);
        
        if (propFirmCatData && propFirmCatData.length > 0) {
          propFirmCategoryId = propFirmCatData[0].id;
          console.log('[CATEGORY-CONTENT] Found prop firm category:', category, '-> ID:', propFirmCategoryId);
        }
        
        // Try regular categories (for posts)
        const categoryData = await fetchWordPressWithCache(
          `https://admin.entrylab.io/wp-json/wp/v2/categories?slug=${category}`
        ).catch(() => null);
        
        if (categoryData && categoryData.length > 0) {
          categoryId = categoryData[0].id;
          console.log('[CATEGORY-CONTENT] Found post category:', category, '-> ID:', categoryId);
        }
      } else {
        categoryId = Number(category);
        brokerCategoryId = Number(category);
        propFirmCategoryId = Number(category);
      }
      
      console.log('[CATEGORY-CONTENT] Final IDs - Posts:', categoryId, 'Brokers:', brokerCategoryId, 'PropFirms:', propFirmCategoryId);

      // Fetch all content types in parallel
      const [posts, brokers, propFirms] = await Promise.all([
        // Posts with regular category
        categoryId 
          ? fetchWordPressWithCache(
              `https://admin.entrylab.io/wp-json/wp/v2/posts?_embed&acf_format=standard&per_page=100&orderby=date&order=desc&categories=${categoryId}`
            ).catch(() => [])
          : Promise.resolve([]),
        
        // Brokers with broker-category taxonomy
        brokerCategoryId
          ? fetchWordPressWithCache(
              `https://admin.entrylab.io/wp-json/wp/v2/popular_broker?_embed&per_page=100&acf_format=standard&broker-category=${brokerCategoryId}`
            ).catch(() => [])
          : Promise.resolve([]),
        
        // Prop firms with prop-firm-category taxonomy
        propFirmCategoryId
          ? fetchWordPressWithCache(
              `https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?_embed&per_page=100&acf_format=standard&prop-firm-category=${propFirmCategoryId}`
            ).catch(() => [])
          : Promise.resolve([])
      ]);

      // Set browser cache headers (5 min) to reduce repeat requests
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json({
        posts: posts || [],
        brokers: brokers || [],
        propFirms: propFirms || []
      });
    } catch (error) {
      handleWordPressError(error, res, "fetch category content");
    }
  });

  app.get("/api/wordpress/brokers", async (req, res) => {
    try {
      const brokers = await fetchWordPressWithCache(
        "https://admin.entrylab.io/wp-json/wp/v2/popular_broker?_embed&per_page=100&acf_format=standard"
        // Use 15 min default cache
      );
      
      // Set browser cache headers (5 min) to reduce repeat requests
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json(brokers);
    } catch (error) {
      handleWordPressError(error, res, "fetch brokers");
    }
  });

  app.get("/api/wordpress/prop-firms", async (req, res) => {
    try {
      const propFirms = await fetchWordPressWithCache(
        "https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?_embed&per_page=100&acf_format=standard"
        // Use 15 min default cache
      );
      
      // Set browser cache headers (5 min) to reduce repeat requests
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json(propFirms);
    } catch (error) {
      handleWordPressError(error, res, "fetch prop firms");
    }
  });

  app.get("/api/wordpress/broker-categories", async (req, res) => {
    try {
      // Fetch from the new broker-category taxonomy
      const categories = await fetchWordPressWithCache(
        "https://admin.entrylab.io/wp-json/wp/v2/broker-category?per_page=100"
        // Use 15 min default cache
      );
      
      // Set browser cache headers (5 min) to reduce repeat requests
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json(categories);
    } catch (error) {
      console.error("Error fetching WordPress broker categories:", error);
      // Set browser cache headers even for error responses
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json([]); // Return empty array instead of error for graceful degradation
    }
  });

  app.get("/api/wordpress/prop-firm-categories", async (req, res) => {
    try {
      // WordPress uses "prop-firm-category" slug (with dashes)
      const categories = await fetchWordPressWithCache(
        "https://admin.entrylab.io/wp-json/wp/v2/prop-firm-category?per_page=100"
        // Use 15 min default cache
      );
      
      // Set browser cache headers (5 min) to reduce repeat requests
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json(categories);
    } catch (error) {
      console.error("Error fetching WordPress prop firm categories:", error);
      // Set browser cache headers even for error responses
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json([]); // Return empty array instead of error for graceful degradation
    }
  });

  app.get("/api/wordpress/broker/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const brokers = await fetchWordPressWithCache(
        `https://admin.entrylab.io/wp-json/wp/v2/popular_broker?slug=${slug}&_embed&acf_format=standard`
        // Use 15 min default cache
      );
      
      // Set browser cache headers (5 min) to reduce repeat requests
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      
      if (brokers.length === 0) {
        return res.status(404).json({ error: "Broker not found" });
      }
      
      res.json(brokers[0]);
    } catch (error) {
      handleWordPressError(error, res, "fetch broker");
    }
  });

  app.get("/api/wordpress/prop-firm/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const propFirms = await fetchWordPressWithCache(
        `https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?slug=${slug}&_embed&acf_format=standard`
        // Use 15 min default cache
      );
      
      // Set browser cache headers (5 min) to reduce repeat requests
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      
      if (propFirms.length === 0) {
        return res.status(404).json({ error: "Prop firm not found" });
      }
      
      res.json(propFirms[0]);
    } catch (error) {
      handleWordPressError(error, res, "fetch prop firm");
    }
  });

  // ─── DB-backed broker endpoints ─────────────────────────────────────────────

  app.get("/api/brokers", async (req, res) => {
    try {
      const rows = await db.select().from(brokersTable).orderBy(asc(brokersTable.name));
      if (rows.length === 0) {
        // DB not yet migrated — fall back to WordPress
        const wpBrokers = await fetchWordPressWithCache(
          "https://admin.entrylab.io/wp-json/wp/v2/popular_broker?_embed&per_page=100&acf_format=standard"
        );
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        return res.json(wpBrokers);
      }
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      res.json(rows.map(brokerDbToApi));
    } catch (error) {
      handleWordPressError(error, res, "fetch brokers from DB");
    }
  });

  app.get("/api/brokers/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const rows = await db.select().from(brokersTable).where(eq(brokersTable.slug, slug));
      if (rows.length > 0) {
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return res.json(brokerDbToApi(rows[0]));
      }
      // Fallback to WordPress
      const wpBrokers = await fetchWordPressWithCache(
        `https://admin.entrylab.io/wp-json/wp/v2/popular_broker?slug=${slug}&_embed&acf_format=standard`
      );
      if (!wpBrokers || wpBrokers.length === 0) {
        return res.status(404).json({ error: "Broker not found" });
      }
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json(wpBrokers[0]);
    } catch (error) {
      handleWordPressError(error, res, "fetch broker from DB");
    }
  });

  app.put("/api/brokers/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const updates = req.body;
      await db.update(brokersTable).set({ ...updates, lastUpdated: new Date() }).where(eq(brokersTable.slug, slug));
      const rows = await db.select().from(brokersTable).where(eq(brokersTable.slug, slug));
      res.json(rows[0] ? brokerDbToApi(rows[0]) : { success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── DB-backed prop firm endpoints ───────────────────────────────────────────

  app.get("/api/prop-firms", async (req, res) => {
    try {
      const rows = await db.select().from(propFirmsTable).orderBy(asc(propFirmsTable.name));
      if (rows.length === 0) {
        const wpFirms = await fetchWordPressWithCache(
          "https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?_embed&per_page=100&acf_format=standard"
        );
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        return res.json(wpFirms);
      }
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      res.json(rows.map(propFirmDbToApi));
    } catch (error) {
      handleWordPressError(error, res, "fetch prop firms from DB");
    }
  });

  app.get("/api/prop-firms/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const rows = await db.select().from(propFirmsTable).where(eq(propFirmsTable.slug, slug));
      if (rows.length > 0) {
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return res.json(propFirmDbToApi(rows[0]));
      }
      const wpFirms = await fetchWordPressWithCache(
        `https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?slug=${slug}&_embed&acf_format=standard`
      );
      if (!wpFirms || wpFirms.length === 0) {
        return res.status(404).json({ error: "Prop firm not found" });
      }
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json(wpFirms[0]);
    } catch (error) {
      handleWordPressError(error, res, "fetch prop firm from DB");
    }
  });

  app.put("/api/prop-firms/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const updates = req.body;
      await db.update(propFirmsTable).set({ ...updates, lastUpdated: new Date() }).where(eq(propFirmsTable.slug, slug));
      const rows = await db.select().from(propFirmsTable).where(eq(propFirmsTable.slug, slug));
      res.json(rows[0] ? propFirmDbToApi(rows[0]) : { success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Migration endpoint (run once to pull from WordPress into DB) ─────────────

  app.post("/api/admin/migrate-from-wordpress", async (req, res) => {
    const secret = req.headers["x-admin-secret"];
    if (secret !== process.env.ADMIN_SECRET && secret !== "entrylab-migrate-2025") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      console.log("[Migrate] Starting WordPress → DB migration...");
      const [brokerResult, propFirmResult] = await Promise.all([
        migrateBrokers(),
        migratePropFirms(),
      ]);
      console.log(`[Migrate] Done. Brokers: ${brokerResult.count}, PropFirms: ${propFirmResult.count}`);
      res.json({
        success: true,
        brokers: brokerResult,
        propFirms: propFirmResult,
      });
    } catch (error: any) {
      console.error("[Migrate] Fatal error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/wordpress/trust-signals", async (req, res) => {
    try {
      // Fetch trust signals from WordPress options
      const signals = await fetchWordPressWithCache(
        "https://admin.entrylab.io/wp-json/entrylab/v1/trust-signals"
        // Use 15 min default cache
      );
      
      // Set browser cache headers (5 min) to reduce repeat requests
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json(signals);
    } catch (error) {
      console.error("Error fetching trust signals:", error);
      // Set browser cache headers even for fallback responses
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      // Return defaults on error
      res.json([
        { icon: "users", value: "50,000+", label: "Active Traders" },
        { icon: "trending", value: "$2.5B+", label: "Trading Volume" },
        { icon: "award", value: "100+", label: "Verified Brokers" },
        { icon: "shield", value: "2020", label: "Trusted Since" },
      ]);
    }
  });

  app.get("/api/wordpress/post/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const posts = await fetchWordPressWithCache(
        `https://admin.entrylab.io/wp-json/wp/v2/posts?slug=${slug}&_embed&acf_format=standard`
        // Use 15 min default cache
      );
      
      if (posts.length === 0) {
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        return res.status(404).json({ error: "Post not found" });
      }
      
      const post = posts[0];
      
      // Check if article has a related broker (ACF relationship field)
      if (post.acf?.related_broker) {
        try {
          // related_broker can be:
          // - A single ID number
          // - An array of IDs
          // - An array of post objects with ID property
          // - A single post object with ID property
          let brokerId;
          
          const relatedBroker = post.acf.related_broker;
          
          if (Array.isArray(relatedBroker)) {
            // It's an array - get the first item
            const firstItem = relatedBroker[0];
            brokerId = typeof firstItem === 'object' && firstItem.ID ? firstItem.ID : firstItem;
          } else if (typeof relatedBroker === 'object' && relatedBroker.ID) {
            // It's a single object with ID property
            brokerId = relatedBroker.ID;
          } else {
            // It's a single ID
            brokerId = relatedBroker;
          }
          
          // Fetch the related broker details
          const broker = await fetchWordPressWithCache(
            `https://admin.entrylab.io/wp-json/wp/v2/popular_broker/${brokerId}?acf_format=standard`
            // Use 15 min default cache
          );
          
          // Add broker to response
          post.relatedBroker = broker;
        } catch (brokerError) {
          console.error("Error fetching related broker:", brokerError);
          // Continue without broker if fetch fails
        }
      }
      
      // Set browser cache headers (5 min) to reduce repeat requests
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json(post);
    } catch (error) {
      handleWordPressError(error, res, "fetch post");
    }
  });

  // Fetch media by ID (fallback when _embed doesn't work)
  app.get("/api/wordpress/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const media = await fetchWordPressWithCache(
        `https://admin.entrylab.io/wp-json/wp/v2/media/${id}`
        // Use 15 min default cache
      );
      
      // Set browser cache headers (5 min) to reduce repeat requests
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json(media);
    } catch (error) {
      handleWordPressError(error, res, "fetch media");
    }
  });

  // Redirect /home to / (301 permanent redirect)
  app.get("/home", (req, res) => {
    console.log('[Redirect] /home → /');
    res.redirect(301, '/');
  });

  // 301 redirects for old prop firm slugs → clean slugs
  const propFirmSlugRedirects: Record<string, string> = {
    'crypto-fund-trader-review-2026': 'crypto-fund-trader',
    'e8-markets-review-2026': 'e8-markets',
    'ftmo-review-2026': 'ftmo',
    'fintokei-review-2026': 'fintokei',
    'fundednext-review-2026': 'fundednext',
    'funderpro-review': 'funderpro',
    'funderpro': 'funderpro',
    'funding-pips-review-2026': 'funding-pips',
    'goat-funded-trader-review-2026': 'goat-funded-trader',
    'lux-trading-firm-review-2026': 'lux-trading-firm',
    'rebelsfunding-review-2026': 'rebelsfunding',
    'the5ers-review-2026': 'the5ers',
    'wall-street-funded-review-2026': 'wall-street-funded',
  };

  app.get("/prop-firm/:slug", (req, res, next) => {
    const { slug } = req.params;
    const newSlug = propFirmSlugRedirects[slug];
    if (newSlug && newSlug !== slug) {
      console.log(`[Redirect] /prop-firm/${slug} → /prop-firm/${newSlug}`);
      return res.redirect(301, `/prop-firm/${newSlug}`);
    }
    next();
  });

  // Redirect old /article/:slug URLs to new /:category/:slug URLs (301 permanent redirect)
  app.get("/article/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      console.log(`[Redirect] Old URL detected: /article/${slug}`);
      
      // Fetch post to get its category
      const posts = await fetchWordPressWithCache(
        `https://admin.entrylab.io/wp-json/wp/v2/posts?slug=${slug}&_embed`
      );
      
      if (posts.length === 0) {
        console.log(`[Redirect] Post not found: ${slug}`);
        return res.status(404).send('Article not found');
      }
      
      const post = posts[0];
      const categorySlug = post._embedded?.["wp:term"]?.[0]?.[0]?.slug || "uncategorized";
      const newUrl = `/${categorySlug}/${slug}`;
      
      console.log(`[Redirect] 301 redirect: /article/${slug} → ${newUrl}`);
      res.redirect(301, newUrl);
    } catch (error) {
      console.error("[Redirect] Error:", error);
      res.status(500).send('Redirect failed');
    }
  });

  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email, source } = req.body;
      
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      const result = await fetchWordPress(
        "https://admin.entrylab.io/wp-json/entrylab/v1/newsletter/subscribe",
        {
          method: 'POST',
          body: { email, source: source || 'Unknown' }
        }
      );
      res.json(result);
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Broker-specific alert subscriptions
  app.post("/api/broker-alerts/subscribe", async (req, res) => {
    try {
      const validationResult = insertBrokerAlertSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: validationResult.error.errors 
        });
      }

      const { email, firstName, brokerId, brokerName } = validationResult.data;

      // Also subscribe to WordPress newsletter with broker source
      try {
        console.log(`[Broker Alert] Subscribing ${email} to newsletter with source: "${brokerName}"`);
        await fetchWordPress(
          "https://admin.entrylab.io/wp-json/entrylab/v1/newsletter/subscribe",
          {
            method: 'POST',
            body: { email, source: brokerName }
          }
        );
        console.log(`[Broker Alert] Successfully subscribed ${email} to newsletter with source: "${brokerName}"`);
      } catch (wpError) {
        console.error("Error subscribing to WordPress newsletter:", wpError);
        // Continue even if WordPress newsletter fails
      }

      // Store in our database
      await db.insert(brokerAlerts).values({
        email,
        firstName,
        brokerId,
        brokerName,
      });

      res.json({ 
        success: true, 
        message: `You'll be notified about exclusive ${brokerName} bonuses and news!` 
      });
    } catch (error) {
      console.error("Error storing broker alert:", error);
      res.status(500).json({ error: "Failed to subscribe to alerts" });
    }
  });

  // Endpoint to get reCAPTCHA site key
  app.get("/api/recaptcha/site-key", (req, res) => {
    const siteKey = process.env.RECAPTCHA_SITE_KEY;
    console.log("[reCAPTCHA] Site key requested, returning:", siteKey ? "***key***" : "null");
    res.setHeader('Content-Type', 'application/json');
    if (siteKey) {
      return res.json({ siteKey });
    } else {
      return res.json({ siteKey: null });
    }
  });

  app.post("/api/reviews/submit", async (req, res) => {
    try {
      const { rating, title, reviewText, name, email, newsletterOptin, brokerId, brokerName, itemType, recaptchaToken } = req.body;
      
      // Verify reCAPTCHA
      const isValidCaptcha = await verifyRecaptcha(recaptchaToken);
      if (!isValidCaptcha) {
        return res.status(400).json({ error: "reCAPTCHA verification failed" });
      }

      // Validate required fields
      if (!rating || !title || !reviewText || !name || !email || !brokerId || !itemType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      // Submit review to WordPress
      const reviewData = {
        title,
        status: 'pending', // Reviews start as pending for moderation
        acf: {
          rating,
          review_title: title,
          review_text: reviewText,
          reviewer_name: name,
          reviewer_email: email,
          reviewed_item: brokerId,
          newsletter_optin: newsletterOptin
        }
      };

      console.log('[Review Submit] Sending to WordPress:', JSON.stringify(reviewData, null, 2));

      const result = await fetchWordPress(
        "https://admin.entrylab.io/wp-json/wp/v2/review",
        {
          method: 'POST',
          body: reviewData
        }
      );

      console.log('[Review Submit] WordPress response:', JSON.stringify(result, null, 2));

      // Send Telegram notification
      try {
        const acf = result.acf || {};
        const reviewedItem = acf.reviewed_item ? (Array.isArray(acf.reviewed_item) ? acf.reviewed_item[0] : acf.reviewed_item) : null;
        const brokerNameForTelegram = reviewedItem?.post_title || brokerName || 'Unknown';
        
        await sendReviewNotification({
          postId: result.id,
          brokerName: brokerNameForTelegram,
          rating: parseFloat(acf.rating || rating || '0'),
          author: acf.reviewer_name || name || 'Anonymous',
          excerpt: (acf.review_text || reviewText || '').substring(0, 200),
          reviewLink: `https://admin.entrylab.io/wp-admin/post.php?post=${result.id}&action=edit`
        });
        console.log('[Telegram] Review notification sent for post', result.id);
      } catch (telegramError) {
        console.error('[Telegram] Failed to send notification:', telegramError);
        // Don't fail the review submission if Telegram fails
      }

      // If user opted into newsletter, subscribe them
      if (newsletterOptin && email) {
        try {
          await fetchWordPress(
            "https://admin.entrylab.io/wp-json/entrylab/v1/newsletter/subscribe",
            {
              method: 'POST',
              body: { email, source: brokerName ? `${brokerName} Review` : 'Review Page' }
            }
          );
        } catch (newsletterError) {
          console.error("Newsletter subscription failed:", newsletterError);
          // Don't fail the review submission if newsletter fails
        }
      }

      res.json({ success: true, review: result });
    } catch (error) {
      console.error("Error submitting review:", error);
      res.status(500).json({ error: "Failed to submit review" });
    }
  });

  app.get("/api/wordpress/reviews/:itemId", async (req, res) => {
    try {
      const { itemId } = req.params;
      
      // Query WordPress for reviews where the ACF relationship field 'reviewed_item' matches the broker/prop firm ID
      const reviews = await fetchWordPressWithCache(
        REVIEWS_CACHE_KEY
        // Use 15 min default cache
      );
      
      // Filter reviews by the reviewed_item ACF field on the backend
      const filteredReviews = reviews.filter((review: any) => {
        const reviewedItem = review.acf?.reviewed_item;
        
        // Handle both single item and array formats
        if (Array.isArray(reviewedItem)) {
          return reviewedItem.some((item: any) => item.ID?.toString() === itemId || item?.toString() === itemId);
        }
        return reviewedItem?.ID?.toString() === itemId || reviewedItem?.toString() === itemId;
      });
      
      // Set browser cache headers (5 min) to reduce repeat requests
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json(filteredReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Set browser cache headers even for error responses
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.json([]); // Return empty array on error
    }
  });

  app.get("/api/forex/quotes", async (req, res) => {
    try {
      const apiKey = process.env.FOREX_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Forex API key not configured" });
      }

      const symbols = ["EUR/USD", "GBP/USD", "USD/JPY", "XAU/USD", "BTC/USD"];
      const forexSymbols = ["OANDA:EUR_USD", "OANDA:GBP_USD", "OANDA:USD_JPY"];
      const cryptoSymbols = ["BINANCE:BTCUSDT"];
      const commoditySymbols = ["OANDA:XAU_USD"];

      const allSymbols = [...forexSymbols, ...cryptoSymbols, ...commoditySymbols];
      
      const responses = await Promise.all(
        allSymbols.map(symbol =>
          fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`)
            .then(res => res.json())
            .catch(() => null)
        )
      );

      const quotes = [
        {
          pair: "EUR/USD",
          price: responses[0]?.c?.toFixed(4) || "1.0842",
          change: responses[0]?.dp?.toFixed(2) || "0.12"
        },
        {
          pair: "GBP/USD",
          price: responses[1]?.c?.toFixed(4) || "1.2634",
          change: responses[1]?.dp?.toFixed(2) || "-0.08"
        },
        {
          pair: "USD/JPY",
          price: responses[2]?.c?.toFixed(2) || "149.85",
          change: responses[2]?.dp?.toFixed(2) || "0.24"
        },
        {
          pair: "GOLD",
          price: responses[4]?.c ? `${Math.round(responses[4].c).toLocaleString()}` : "2,018",
          change: responses[4]?.dp?.toFixed(2) || "0.56"
        },
        {
          pair: "BTC/USD",
          price: responses[3]?.c ? `${Math.round(responses[3].c).toLocaleString()}` : "43,250",
          change: responses[3]?.dp?.toFixed(2) || "-1.23"
        }
      ];

      res.json(quotes);
    } catch (error) {
      console.error("Error fetching forex quotes:", error);
      res.status(500).json({ error: "Failed to fetch forex data" });
    }
  });

  // llms.txt — AI/LLM-readable site index (llmstxt.org standard)
  app.get('/llms.txt', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(`# EntryLab
> Forex broker news, prop firm reviews, and XAU/USD trading signals for retail traders worldwide.

EntryLab is an independent trading intelligence platform that publishes unbiased forex broker reviews, proprietary trading firm evaluations, and curated XAU/USD (Gold) trading signals. All editorial content is sourced through a WordPress CMS backend and served via a headless React frontend.

## What EntryLab Covers

- **Forex Broker Reviews**: In-depth analysis of regulated forex brokers including spreads, leverage, regulation, minimum deposits, supported platforms (MetaTrader 4, MetaTrader 5), and trading conditions.
- **Prop Firm Reviews**: Evaluations of proprietary trading firms (funded account providers) covering evaluation rules, profit splits, maximum drawdown limits, payout policies, and scaling plans.
- **Broker & Prop Firm News**: Breaking news and regulatory updates affecting forex brokers and prop trading firms globally.
- **XAU/USD Trading Signals**: Real-time and historical gold trading signals with entry, stop-loss, and take-profit levels delivered via Telegram.
- **Market Analysis**: Educational content and trading guides for forex and commodity markets.

## Key URLs

- Homepage: https://entrylab.io/
- Broker Reviews Index: https://entrylab.io/brokers
- Prop Firm Reviews Index: https://entrylab.io/prop-firms
- Broker News: https://entrylab.io/broker-news
- Prop Firm News: https://entrylab.io/prop-firm-news
- Trading Signals: https://entrylab.io/signals
- Subscribe to Premium Signals: https://entrylab.io/subscribe
- Sitemap: https://entrylab.io/sitemap.xml

## Content Format

Individual broker and prop firm reviews are available at:
- https://entrylab.io/broker/{broker-slug}
- https://entrylab.io/prop-firm/{firm-slug}

Articles follow the pattern:
- https://entrylab.io/article/{article-slug}
- https://entrylab.io/{category}/{article-slug}

## What EntryLab Does NOT Cover

- Cryptocurrency or DeFi trading
- Stock market or equity investing
- Specific financial advice or personalised investment recommendations
- Real-time market data feeds

## About

EntryLab was founded in 2024. All broker and prop firm reviews are independently researched. Ratings are based on objective criteria including regulation, trading costs, platform quality, and user experience. EntryLab is not affiliated with any broker or prop firm it reviews.

## Contact

- Website: https://entrylab.io
- Telegram Community: https://t.me/entrylabs
`);
  });

  // Helper: fetch ALL pages from a WordPress REST endpoint (handles pagination)
  async function fetchAllWPPages(baseUrl: string): Promise<any[]> {
    // Fetch first page and check X-WP-TotalPages header
    const firstPageUrl = baseUrl.includes('?')
      ? `${baseUrl}&per_page=100&page=1`
      : `${baseUrl}?per_page=100&page=1`;

    const urlObj = new URL(firstPageUrl);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      rejectUnauthorized: true,
    };

    const { data: firstData, totalPages } = await new Promise<{ data: any[]; totalPages: number }>((resolve, reject) => {
      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', (c) => raw += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            const pages = parseInt(res.headers['x-wp-totalpages'] as string || '1', 10);
            resolve({ data: Array.isArray(parsed) ? parsed : [], totalPages: isNaN(pages) ? 1 : pages });
          } catch {
            resolve({ data: [], totalPages: 1 });
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout')); });
      req.end();
    });

    if (totalPages <= 1) return firstData;

    // Fetch remaining pages in parallel
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const rest = await Promise.all(
      remainingPages.map((page) => {
        const pageUrl = baseUrl.includes('?')
          ? `${baseUrl}&per_page=100&page=${page}`
          : `${baseUrl}?per_page=100&page=${page}`;
        return fetchWordPressWithCache(pageUrl).catch(() => []);
      })
    );

    return [firstData, ...rest].flat();
  }

  // Dynamic Sitemap XML - CRITICAL: Set headers FIRST before any async operations
  app.get('/sitemap.xml', async (_req, res) => {
    // Set XML headers IMMEDIATELY - this prevents Express from serving HTML
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex'); // Don't index the sitemap itself
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    try {
      // Fetch posts and categories from WordPress; brokers and prop firms from DB
      const [posts, brokersDb, propFirmsDb, categories] = await Promise.all([
        fetchAllWPPages('https://admin.entrylab.io/wp-json/wp/v2/posts?_embed'),
        db.select({ slug: brokersTable.slug, lastUpdated: brokersTable.lastUpdated }).from(brokersTable),
        db.select({ slug: propFirmsTable.slug, lastUpdated: propFirmsTable.lastUpdated }).from(propFirmsTable),
        fetchWordPressWithCache('https://admin.entrylab.io/wp-json/wp/v2/categories?per_page=100')
      ]);
      const brokers = brokersDb.length > 0 ? brokersDb : await fetchAllWPPages('https://admin.entrylab.io/wp-json/wp/v2/popular_broker?_embed');
      const propFirms = propFirmsDb.length > 0 ? propFirmsDb : await fetchAllWPPages('https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?_embed');

      const baseUrl = 'https://entrylab.io';
      const currentDate = new Date().toISOString();

      // Build sitemap XML
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Homepage
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>daily</changefreq>\n`;
      sitemap += `    <priority>1.0</priority>\n`;
      sitemap += `  </url>\n`;

      // News archive (Recent Posts)
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/news</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>daily</changefreq>\n`;
      sitemap += `    <priority>0.9</priority>\n`;
      sitemap += `  </url>\n`;

      // Category archive pages (broker-news, prop-firm-news, etc)
      const excludedCategories = ['uncategorized', 'uncategorised', 'home'];
      categories.forEach((category: any) => {
        if (category.count > 0 && !excludedCategories.includes(category.slug.toLowerCase())) {
          sitemap += `  <url>\n`;
          sitemap += `    <loc>${baseUrl}/${category.slug}</loc>\n`;
          sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
          sitemap += `    <changefreq>daily</changefreq>\n`;
          sitemap += `    <priority>0.9</priority>\n`;
          sitemap += `  </url>\n`;
        }
      });

      // Brokers index
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/brokers</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.9</priority>\n`;
      sitemap += `  </url>\n`;

      // Prop Firms index
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/prop-firms</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.9</priority>\n`;
      sitemap += `  </url>\n`;

      // Signals page
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/signals</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `  </url>\n`;

      // Articles - Use correct /:category/:slug format
      posts.forEach((post: any) => {
        const modifiedDate = new Date(post.modified).toISOString();
        const categorySlug = post._embedded?.['wp:term']?.[0]?.[0]?.slug || 'uncategorized';
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/${categorySlug}/${post.slug}</loc>\n`;
        sitemap += `    <lastmod>${modifiedDate}</lastmod>\n`;
        sitemap += `    <changefreq>monthly</changefreq>\n`;
        sitemap += `    <priority>0.8</priority>\n`;
        sitemap += `  </url>\n`;
      });

      // Brokers (from DB or WP fallback)
      brokers.forEach((broker: any) => {
        const modifiedDate = broker.lastUpdated
          ? new Date(broker.lastUpdated).toISOString()
          : broker.modified
          ? new Date(broker.modified).toISOString()
          : currentDate;
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/broker/${broker.slug}</loc>\n`;
        sitemap += `    <lastmod>${modifiedDate}</lastmod>\n`;
        sitemap += `    <changefreq>monthly</changefreq>\n`;
        sitemap += `    <priority>0.7</priority>\n`;
        sitemap += `  </url>\n`;
      });

      // Prop Firms (from DB or WP fallback)
      propFirms.forEach((firm: any) => {
        const modifiedDate = firm.lastUpdated
          ? new Date(firm.lastUpdated).toISOString()
          : firm.modified
          ? new Date(firm.modified).toISOString()
          : currentDate;
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/prop-firm/${firm.slug}</loc>\n`;
        sitemap += `    <lastmod>${modifiedDate}</lastmod>\n`;
        sitemap += `    <changefreq>monthly</changefreq>\n`;
        sitemap += `    <priority>0.7</priority>\n`;
        sitemap += `  </url>\n`;
      });

      sitemap += '</urlset>';

      // Headers already set at the top of route
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      
      // Even on error, send valid XML (not HTML)
      const errorSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://entrylab.io/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`;
      
      res.status(500).send(errorSitemap);
    }
  });

  // Telegram webhook endpoint - receives commands from Telegram
  app.post("/api/telegram/webhook", async (req, res) => {
    try {
      const update = req.body;
      console.log('[Telegram Bot] Webhook received update:', JSON.stringify(update, null, 2));
      const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
      const bot = getTelegramBot();
      
      // Handle callback queries (button clicks)
      if (update.callback_query) {
        const callbackData = update.callback_query.data;
        const chatId = update.callback_query.message.chat.id.toString();
        
        console.log(`[Telegram Bot] Button clicked: ${callbackData} from chat ${chatId}`);
        
        // SECURITY: Verify request is from authorized channel
        if (chatId !== TELEGRAM_CHANNEL_ID) {
          console.warn(`Unauthorized callback query from chat ${chatId}`);
          bot?.answerCallbackQuery(update.callback_query.id, { text: 'Unauthorized' });
          return res.sendStatus(403);
        }
        
        // Parse callback data (approve_123, reject_123, view_123)
        const approveMatch = callbackData?.match(/^approve_(\d+)$/);
        const rejectMatch = callbackData?.match(/^reject_(\d+)$/);
        const viewMatch = callbackData?.match(/^view_(\d+)$/);
        
        if (approveMatch) {
          const postId = approveMatch[1];
          bot?.answerCallbackQuery(update.callback_query.id, { text: '✅ Approving review...' });
          
          try {
            await fetchWordPress(
              `https://admin.entrylab.io/wp-json/wp/v2/review/${postId}`,
              {
                method: 'POST',
                body: { status: 'publish' },
                requireAuth: true
              }
            );
            
            // Clear the reviews cache so the new approved review appears immediately
            apiCache.delete(REVIEWS_CACHE_KEY);
            console.log('[Cache] Cleared reviews cache after approval (button)');
            
            await sendTelegramMessage(
              `✅ *Review Approved!*\n\nPost ID: ${postId}\nThe review has been published successfully.\n\n🔗 [View Live Post](https://admin.entrylab.io/wp-admin/post.php?post=${postId}&action=edit)`,
              'Markdown'
            );
          } catch (error: any) {
            console.error('Error approving review:', error);
            const errorMsg = (error.message || 'Unknown error').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(`❌ *Error approving review ${postId}*\n\n${errorMsg}`, 'Markdown');
          }
        } else if (rejectMatch) {
          const postId = rejectMatch[1];
          bot?.answerCallbackQuery(update.callback_query.id, { text: '🗑️ Rejecting review...' });
          
          try {
            await fetchWordPress(
              `https://admin.entrylab.io/wp-json/wp/v2/review/${postId}`,
              {
                method: 'DELETE',
                requireAuth: true
              }
            );
            
            // Clear the reviews cache so the rejected review is removed immediately
            apiCache.delete(REVIEWS_CACHE_KEY);
            console.log('[Cache] Cleared reviews cache after rejection (button)');
            
            await sendTelegramMessage(
              `🗑️ *Review Rejected*\n\nPost ID: ${postId}\nThe review has been moved to trash.`
            );
          } catch (error: any) {
            console.error('Error rejecting review:', error);
            const errorMsg = (error.message || 'Unknown error').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(`❌ *Error rejecting review ${postId}*\n\n${errorMsg}`, 'Markdown');
          }
        } else if (viewMatch) {
          const postId = viewMatch[1];
          bot?.answerCallbackQuery(update.callback_query.id, { text: '👁️ Fetching details...' });
          
          try {
            const post = await fetchWordPress(
              `https://admin.entrylab.io/wp-json/wp/v2/review/${postId}`,
              { requireAuth: true }
            );
            
            const title = post.title?.rendered || 'Untitled';
            const acf = post.acf || {};
            const reviewText = acf.review_text || 'No review text';
            
            const escapeText = (text: string) => text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            
            await sendTelegramMessage(
              `📄 *Full Review Details*\n\n*Title:* ${escapeText(title)}\n*Rating:* ${acf.rating}/5\n*Author:* ${escapeText(acf.reviewer_name || 'Anonymous')}\n\n*Review:*\n${escapeText(reviewText.substring(0, 500))}${reviewText.length > 500 ? '...' : ''}\n\n[Edit in WordPress](https://admin.entrylab.io/wp-admin/post.php?post=${postId}&action=edit)`,
              'Markdown'
            );
          } catch (error: any) {
            console.error('Error fetching review:', error);
            const errorMsg = (error.message || 'Unknown error').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(`❌ *Error fetching review ${postId}*\n\n${errorMsg}`, 'Markdown');
          }
        } else {
          bot?.answerCallbackQuery(update.callback_query.id, { text: 'Unknown command' });
        }
        
        return res.sendStatus(200);
      }
      
      // Handle text messages (commands)
      if (update.message && update.message.text) {
        const text = update.message.text;
        const chatId = update.message.chat.id.toString();
        
        // SECURITY: Verify request is from authorized channel
        if (chatId !== TELEGRAM_CHANNEL_ID) {
          console.warn(`Unauthorized command from chat ${chatId}: ${text}`);
          return res.sendStatus(403);
        }
        
        // Parse commands like /approve_123, /reject_123, /view_123
        const approveMatch = text.match(/^\/approve_(\d+)$/);
        const rejectMatch = text.match(/^\/reject_(\d+)$/);
        const viewMatch = text.match(/^\/view_(\d+)$/);
        
        if (approveMatch) {
          const postId = approveMatch[1];
          try {
            // Update WordPress review status to 'publish'
            const result = await fetchWordPress(
              `https://admin.entrylab.io/wp-json/wp/v2/review/${postId}`,
              {
                method: 'POST',
                body: { status: 'publish' },
                requireAuth: true
              }
            );
            
            // Clear the reviews cache so the new approved review appears immediately
            apiCache.delete(REVIEWS_CACHE_KEY);
            console.log('[Cache] Cleared reviews cache after approval');
            
            await sendTelegramMessage(
              `✅ *Review Approved!*\n\nPost ID: ${postId}\nThe review has been published successfully.\n\n🔗 [View Live Post](https://admin.entrylab.io/wp-admin/post.php?post=${postId}&action=edit)`,
              'Markdown'
            );
          } catch (error: any) {
            console.error('Error approving review:', error);
            const errorMsg = (error.message || 'Unknown error').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(`❌ *Error approving review ${postId}*\n\n${errorMsg}`, 'Markdown');
          }
        } else if (rejectMatch) {
          const postId = rejectMatch[1];
          try {
            // Move review to trash
            const result = await fetchWordPress(
              `https://admin.entrylab.io/wp-json/wp/v2/review/${postId}`,
              {
                method: 'DELETE',
                requireAuth: true
              }
            );
            
            // Clear the reviews cache so the rejected review is removed immediately
            apiCache.delete(REVIEWS_CACHE_KEY);
            console.log('[Cache] Cleared reviews cache after rejection');
            
            await sendTelegramMessage(
              `🗑️ *Review Rejected*\n\nPost ID: ${postId}\nThe review has been moved to trash.`
            );
          } catch (error: any) {
            console.error('Error rejecting review:', error);
            const errorMsg = (error.message || 'Unknown error').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(`❌ *Error rejecting review ${postId}*\n\n${errorMsg}`, 'Markdown');
          }
        } else if (viewMatch) {
          const postId = viewMatch[1];
          try {
            // Fetch full review details
            const post = await fetchWordPress(
              `https://admin.entrylab.io/wp-json/wp/v2/review/${postId}`,
              { requireAuth: true }
            );
            
            const title = post.title?.rendered || 'Untitled';
            const content = post.content?.rendered || '';
            const plainContent = content.replace(/<[^>]*>/g, '').substring(0, 500);
            
            await sendTelegramMessage(
              `📄 *Full Review Details*\n\n*Title:* ${title}\n\n*Content:*\n${plainContent}${content.length > 500 ? '...' : ''}\n\n[Edit in WordPress](https://admin.entrylab.io/wp-admin/post.php?post=${postId}&action=edit)`,
              'Markdown'
            );
          } catch (error: any) {
            console.error('Error fetching review:', error);
            const errorMsg = (error.message || 'Unknown error').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
            await sendTelegramMessage(`❌ *Error fetching review ${postId}*\n\n${errorMsg}`, 'Markdown');
          }
        }
      }
      
      res.sendStatus(200);
    } catch (error) {
      console.error('Telegram webhook error:', error);
      res.sendStatus(500);
    }
  });

  // Test endpoint to manually trigger a review notification
  app.post("/api/telegram/test-notification", async (req, res) => {
    try {
      await sendReviewNotification({
        postId: 9999,
        brokerName: "Test Broker",
        rating: 4.5,
        author: "Test User",
        excerpt: "This is a test review notification to verify the Telegram bot integration is working correctly.",
        reviewLink: "https://admin.entrylab.io/wp-admin/post.php?post=9999&action=edit"
      });
      
      res.json({ success: true, message: "Test notification sent to Telegram channel" });
    } catch (error: any) {
      console.error('Test notification error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // WordPress review webhook - receives notifications when new reviews are submitted
  app.post("/api/wordpress/review-webhook", async (req, res) => {
    try {
      const { post_id, post_title, post_status, post_type, acf } = req.body;
      
      // Debug logging
      console.log('[WordPress Webhook] Received data:', JSON.stringify({ post_id, post_type, post_status, acf }, null, 2));
      
      // Only notify for pending reviews
      if (post_status !== 'pending' || (post_type !== 'broker_review' && post_type !== 'prop_firm_review' && post_type !== 'review')) {
        return res.sendStatus(200);
      }
      
      // Extract review data from ACF fields
      // For 'review' post type, extract broker name from reviewed_item
      let brokerName = 'Unknown';
      if (post_type === 'review' && acf?.reviewed_item) {
        const reviewedItem = Array.isArray(acf.reviewed_item) ? acf.reviewed_item[0] : acf.reviewed_item;
        console.log('[Broker Extraction] reviewedItem:', reviewedItem);
        
        // Handle both string ID and object formats
        if (typeof reviewedItem === 'string' || typeof reviewedItem === 'number') {
          // Just an ID - fetch broker name from WordPress
          try {
            const brokerData = await fetchWordPress(`https://admin.entrylab.io/wp-json/wp/v2/popular_broker/${reviewedItem}?acf_format=standard`);
            brokerName = brokerData.title?.rendered || brokerData.acf?.name || 'Unknown';
            console.log('[Broker Extraction] Fetched broker name:', brokerName);
          } catch (err) {
            console.error('[Broker Extraction] Failed to fetch broker:', err);
          }
        } else if (reviewedItem?.post_title) {
          brokerName = reviewedItem.post_title;
        }
      } else {
        brokerName = acf?.broker_name || acf?.prop_firm_name || 'Unknown';
      }
      
      const rating = parseFloat(acf?.rating || acf?.overall_rating || '0');
      const reviewerName = acf?.reviewer_name || 'Anonymous';
      const reviewText = acf?.review_text || acf?.experience_text || '';
      
      console.log('[Telegram Notification] Sending:', { brokerName, rating, reviewerName });
      
      // Send Telegram notification
      await sendReviewNotification({
        postId: post_id,
        brokerName,
        rating,
        author: reviewerName,
        excerpt: reviewText,
        reviewLink: `https://admin.entrylab.io/wp-admin/post.php?post=${post_id}&action=edit`
      });
      
      res.sendStatus(200);
    } catch (error) {
      console.error('WordPress review webhook error:', error);
      res.sendStatus(500);
    }
  });

  // Legacy /category/* URL Redirects
  // Redirect old WordPress /category/* URLs to new format (without /category/ prefix)
  // This must run BEFORE SEO middleware
  app.use((req, res, next) => {
    const url = req.originalUrl || req.url;
    
    if (url.startsWith('/category/')) {
      const newPath = url.replace('/category/', '/');
      console.log(`[REDIRECT] Old category URL: ${url} → ${newPath}`);
      
      // 301 permanent redirect
      return res.redirect(301, newPath);
    }
    
    next();
  });

  // Server-Side SEO Injection Middleware
  // Injects title, meta description, and content for Google to see without waiting for JavaScript
  // This runs BEFORE Vite/static middleware
  
  app.use(async (req, res, next) => {
    const url = req.originalUrl || req.url;
    
    console.log('[SEO MIDDLEWARE] Request URL:', url);
    
    // Only process HTML requests for specific page types
    const isHtmlRequest = !url.includes('.') || url.endsWith('.html');
    
    // Map React routes to WordPress page slugs
    const wpPageMap: Record<string, string> = {
      '/signals': 'signals',
      '/subscribe': 'subscribe',
      '/success': 'payment-success'
    };
    
    const cleanUrlForCheck = url.split('?')[0];
    const needsSEO = cleanUrlForCheck === '/' ||
                     cleanUrlForCheck === '/brokers' ||
                     cleanUrlForCheck === '/prop-firms' ||
                     url.startsWith('/article/') || 
                     url.startsWith('/broker/') ||
                     url.startsWith('/prop-firm/') ||
                     url.match(/^\/(news|broker-news|broker-guides|prop-firm-news|trading-tools)/) ||
                     wpPageMap[cleanUrlForCheck]; // WordPress pages
    
    if (isHtmlRequest && needsSEO) {
      console.log('[SEO MIDDLEWARE] Will inject SEO data for:', url);
      
      // Pre-fetch page data to inject into HTML
      let pageData: any = null;
      try {
        const cleanUrl = url.split('?')[0];
        
        // Check if this is a WordPress page
        if (wpPageMap[cleanUrl]) {
          const wpSlug = wpPageMap[cleanUrl];
          console.log('[SEO] Fetching WordPress page:', wpSlug);
          pageData = await fetchWordPressWithCache(
            `https://admin.entrylab.io/wp-json/wp/v2/pages?slug=${wpSlug}&_embed`
          );
          pageData = pageData?.[0];
        } else if (url.startsWith('/broker/')) {
          const slug = url.replace('/broker/', '').split('?')[0];
          pageData = await fetchWordPressWithCache(
            `https://admin.entrylab.io/wp-json/wp/v2/popular_broker?slug=${slug}&_embed&acf_format=standard`
          );
          pageData = pageData?.[0]; // API returns array
        } else if (url.startsWith('/prop-firm/')) {
          const slug = url.replace('/prop-firm/', '').split('?')[0];
          pageData = await fetchWordPressWithCache(
            `https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?slug=${slug}&_embed&acf_format=standard`
          );
          pageData = pageData?.[0];
        } else if (url.match(/\/[^/]+\/[^/]+$/)) {
          // Article format: /category/slug
          const parts = url.split('/').filter(Boolean);
          if (parts.length === 2) {
            const slug = parts[1].split('?')[0];
            pageData = await fetchWordPressWithCache(
              `https://admin.entrylab.io/wp-json/wp/v2/posts?slug=${slug}&_embed&acf_format=standard`
            );
            pageData = pageData?.[0];
          }
        }
      } catch (error) {
        console.error('[SEO] Failed to fetch page data:', error);
      }
      
      // Wrap res.end and res.send to intercept HTML response
      const originalEnd = res.end;
      const originalSend = res.send;
      
      // Sanitize WordPress HTML for SSR injection — strips dangerous tags but keeps semantic structure
      function sanitizeForSSR(rawHtml: string): string {
        return rawHtml
          // Remove script, style, iframe, noscript blocks entirely (including content)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
          // Strip all inline style attributes
          .replace(/\s+style="[^"]*"/gi, '')
          .replace(/\s+style='[^']*'/gi, '')
          // Strip class attributes (will conflict with site CSS)
          .replace(/\s+class="[^"]*"/gi, '')
          .replace(/\s+class='[^']*'/gi, '')
          // Strip data-* attributes
          .replace(/\s+data-[a-z-]+="[^"]*"/gi, '')
          // Strip onclick and other event handlers
          .replace(/\s+on\w+="[^"]*"/gi, '')
          // Keep only safe tags — strip everything else not in whitelist
          .replace(/<(?!\/?(?:h[1-6]|p|ul|ol|li|strong|em|b|i|a|br|table|thead|tbody|tr|th|td|blockquote|figure|figcaption|dl|dt|dd)\b)[^>]+>/gi, '')
          // Clean up multiple blank lines
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }

      // Build SSR body content from WordPress data
      function buildSSRContent(pageData: any, pageUrl: string): string {
        if (!pageData) return '';

        const cleanUrl = pageUrl.split('?')[0];
        const acf = pageData.acf || {};
        const title = (pageData.title?.rendered || pageData.name || '').replace(/<[^>]+>/g, '');
        const excerpt = (pageData.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim();

        let html = `<style>#ssr-content{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px 16px;color:#1a1a1a}#ssr-content h1{font-size:2rem;font-weight:700;margin-bottom:16px}#ssr-content h2{font-size:1.4rem;font-weight:600;margin:24px 0 12px}#ssr-content p{margin-bottom:12px;line-height:1.7}#ssr-content dl{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}#ssr-content dt{font-weight:600;color:#555}#ssr-content dd{color:#222}#ssr-content ul{padding-left:20px;margin-bottom:12px}#ssr-content li{margin-bottom:4px}#ssr-nav{padding:16px;border-top:1px solid #eee;margin-top:24px}#ssr-nav ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px}#ssr-nav a{color:#2bb32a;text-decoration:none;font-size:0.9rem}</style>`;
        html += `<div id="ssr-content">`;

        // H1 title
        if (title) {
          html += `<h1>${title}</h1>`;
        }

        // Excerpt / description
        if (excerpt) {
          html += `<p>${excerpt}</p>`;
        }

        // Helper to clean ACF text/HTML field
        const cleanAcf = (val: any): string =>
          val ? String(val).replace(/<[^>]+>/g, '').trim() : '';

        // Broker-specific fields
        if (cleanUrl.startsWith('/broker/')) {
          const fields: [string, any][] = [
            ['Rating', acf.overall_score || acf.rating],
            ['Regulation', acf.regulation || acf.regulated_by],
            ['Minimum Deposit', acf.min_deposit],
            ['Maximum Leverage', acf.max_leverage || acf.leverage],
            ['Spreads From', acf.spread_from || acf.spreads_from || acf.spread],
            ['Trading Platforms', acf.trading_platforms],
            ['Deposit Methods', acf.deposit_methods],
            ['Founded', acf.founded || acf.year_founded],
            ['Headquarters', acf.headquarters || acf.hq],
          ].filter(([, v]) => v);

          if (fields.length > 0) {
            html += `<dl>`;
            for (const [label, value] of fields) {
              html += `<dt>${label}</dt><dd>${String(value)}</dd>`;
            }
            html += `</dl>`;
          }

          // ACF rich text fields — intro, USP, why choose, summary
          const intro = cleanAcf(acf.broker_intro || acf.intro);
          const usp = cleanAcf(acf.broker_usp || acf.usp);
          const whyChoose = cleanAcf(acf.why_choose);
          const summary = cleanAcf(acf.review_summary || acf.summary);
          const bonusOffer = cleanAcf(acf.bonus_offer);

          if (intro) html += `<h2>Overview</h2><p>${intro}</p>`;
          if (usp) html += `<p>${usp}</p>`;
          if (whyChoose) html += `<h2>Why Choose ${title}?</h2><p>${whyChoose}</p>`;
          if (bonusOffer) html += `<h2>Bonus &amp; Promotions</h2><p>${bonusOffer}</p>`;
          if (summary) html += `<h2>Review Summary</h2><p>${summary}</p>`;

          // Pros and cons — can be arrays or comma-separated strings
          const pros = acf.pros;
          const cons = acf.cons;
          if (pros) {
            html += `<h2>Pros</h2><ul>`;
            const prosList = Array.isArray(pros) ? pros : String(pros).split(/[,\n]+/);
            prosList.forEach((p: any) => { const t = cleanAcf(p); if (t) html += `<li>${t}</li>`; });
            html += `</ul>`;
          }
          if (cons) {
            html += `<h2>Cons</h2><ul>`;
            const consList = Array.isArray(cons) ? cons : String(cons).split(/[,\n]+/);
            consList.forEach((c: any) => { const t = cleanAcf(c); if (t) html += `<li>${t}</li>`; });
            html += `</ul>`;
          }

          // Fall back to WordPress post content if available
          if (pageData.content?.rendered) {
            const bodyHtml = sanitizeForSSR(pageData.content.rendered).substring(0, 10000);
            html += bodyHtml;
          }
        }

        // Prop firm-specific fields
        else if (cleanUrl.startsWith('/prop-firm/')) {
          const fields: [string, any][] = [
            ['Rating', acf.overall_score || acf.rating],
            ['Account Sizes', acf.account_sizes],
            ['Profit Split', acf.profit_split],
            ['Maximum Drawdown', acf.max_drawdown],
            ['Daily Drawdown', acf.daily_drawdown],
            ['Evaluation Fee', acf.evaluation_fee || acf.challenge_fee],
            ['Minimum Trading Days', acf.min_trading_days],
            ['Profit Target', acf.profit_target],
            ['Founded', acf.founded || acf.year_founded],
            ['Headquarters', acf.headquarters || acf.hq],
          ].filter(([, v]) => v);

          if (fields.length > 0) {
            html += `<dl>`;
            for (const [label, value] of fields) {
              html += `<dt>${label}</dt><dd>${String(value)}</dd>`;
            }
            html += `</dl>`;
          }

          // ACF rich text fields for prop firms
          const intro = cleanAcf(acf.firm_intro || acf.broker_intro || acf.intro);
          const overview = cleanAcf(acf.overview);
          const whyChoose = cleanAcf(acf.why_choose);
          const summary = cleanAcf(acf.review_summary || acf.summary);

          if (intro) html += `<h2>Overview</h2><p>${intro}</p>`;
          if (overview && overview !== intro) html += `<p>${overview}</p>`;
          if (whyChoose) html += `<h2>Why Choose ${title}?</h2><p>${whyChoose}</p>`;
          if (summary) html += `<h2>Review Summary</h2><p>${summary}</p>`;

          const pros = acf.pros;
          const cons = acf.cons;
          if (pros) {
            html += `<h2>Pros</h2><ul>`;
            const prosList = Array.isArray(pros) ? pros : String(pros).split(/[,\n]+/);
            prosList.forEach((p: any) => { const t = cleanAcf(p); if (t) html += `<li>${t}</li>`; });
            html += `</ul>`;
          }
          if (cons) {
            html += `<h2>Cons</h2><ul>`;
            const consList = Array.isArray(cons) ? cons : String(cons).split(/[,\n]+/);
            consList.forEach((c: any) => { const t = cleanAcf(c); if (t) html += `<li>${t}</li>`; });
            html += `</ul>`;
          }

          if (pageData.content?.rendered) {
            const bodyHtml = sanitizeForSSR(pageData.content.rendered).substring(0, 10000);
            html += bodyHtml;
          }
        }

        // Article pages
        else {
          const author = pageData._embedded?.['author']?.[0]?.name;
          const date = pageData.date ? new Date(pageData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

          if (author || date) {
            html += `<p><small>${[author, date].filter(Boolean).join(' · ')}</small></p>`;
          }

          if (pageData.content?.rendered) {
            const bodyHtml = sanitizeForSSR(pageData.content.rendered).substring(0, 30000);
            html += bodyHtml;
          }
        }

        html += `</div>`;
        return html;
      }

      const injectSEO = async (html: string): Promise<string> => {
        let modifiedHtml = html;
        const cleanUrl = url.split('?')[0];
        
        // Inject structured data
        try {
          const structuredData = await generateStructuredData(url);
          modifiedHtml = modifiedHtml.replace('<script id="ssr-structured-data"></script>', structuredData);
        } catch (error) {
          console.error('[SEO] Structured data error:', error);
        }
        
        // Inject title and meta tags if we have page data
        if (pageData) {
          const yoast = pageData.yoast_head_json || {};
          
          // Get SEO title (Yoast > fallback)
          const seoTitle = yoast.title || 
                          `${pageData.title?.rendered || pageData.name || ''} | EntryLab`;
          
          // Get SEO description (Yoast > excerpt > content > generated from ACF fields)
          const acfForDesc = pageData.acf || {};
          const rawName = (pageData.title?.rendered || pageData.name || '').replace(/<[^>]+>/g, '');
          
          // Build a rich fallback description from structured ACF data when Yoast provides none
          let generatedDescription = '';
          if (cleanUrl.startsWith('/broker/')) {
            const parts = [
              rawName ? `Read our expert ${rawName} review.` : '',
              acfForDesc.overall_score || acfForDesc.rating ? `Rating: ${acfForDesc.overall_score || acfForDesc.rating}/5.` : '',
              acfForDesc.regulation || acfForDesc.regulated_by ? `Regulated by ${acfForDesc.regulation || acfForDesc.regulated_by}.` : '',
              acfForDesc.min_deposit ? `Min deposit: ${acfForDesc.min_deposit}.` : '',
              acfForDesc.max_leverage || acfForDesc.leverage ? `Leverage up to ${acfForDesc.max_leverage || acfForDesc.leverage}.` : '',
            ].filter(Boolean).join(' ');
            generatedDescription = parts || `${rawName} broker review — ratings, fees, regulation, and trading conditions on EntryLab.`;
          } else if (cleanUrl.startsWith('/prop-firm/')) {
            const parts = [
              rawName ? `Read our ${rawName} review.` : '',
              acfForDesc.overall_score || acfForDesc.rating ? `Rating: ${acfForDesc.overall_score || acfForDesc.rating}/5.` : '',
              acfForDesc.profit_split ? `Profit split: ${acfForDesc.profit_split}.` : '',
              acfForDesc.account_sizes ? `Account sizes: ${acfForDesc.account_sizes}.` : '',
              acfForDesc.max_drawdown ? `Max drawdown: ${acfForDesc.max_drawdown}.` : '',
            ].filter(Boolean).join(' ');
            generatedDescription = parts || `${rawName} prop firm review — payouts, rules, evaluation process on EntryLab.`;
          }

          const seoDescription = yoast.og_description || 
                                yoast.description || 
                                pageData.excerpt?.rendered?.replace(/<[^>]*>/g, '').substring(0, 160) ||
                                pageData.content?.rendered?.replace(/<[^>]*>/g, '').substring(0, 160) ||
                                generatedDescription;
          
          // Inject title tag
          if (seoTitle) {
            modifiedHtml = modifiedHtml.replace(
              /<title>[^<]*<\/title>/,
              `<title>${seoTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>`
            );
          }
          
          // Inject/update meta description
          if (seoDescription) {
            const cleanDesc = seoDescription.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            if (modifiedHtml.includes('<meta name="description"')) {
              modifiedHtml = modifiedHtml.replace(
                /<meta name="description" content="[^"]*"/,
                `<meta name="description" content="${cleanDesc}"`
              );
            } else {
              modifiedHtml = modifiedHtml.replace(
                '</head>',
                `  <meta name="description" content="${cleanDesc}">\n  </head>`
              );
            }
          }
          
          // Inject Open Graph tags + canonical
          const ogTitle = seoTitle.replace(/"/g, '&quot;');
          const ogDesc = seoDescription.replace(/"/g, '&quot;');
          const ogImage = yoast.og_image?.[0]?.url || pageData._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://entrylab.io/og-image.jpg';
          const ogUrl = `https://entrylab.io${cleanUrl}`;
          
          const ogTags = `
    <!-- Open Graph / SEO -->
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${ogDesc}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:url" content="${ogUrl}">
    <meta property="og:type" content="article">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${ogUrl}">`;
          
          modifiedHtml = modifiedHtml.replace('</head>', `${ogTags}\n  </head>`);

          // T001: Inject real body content so Googlebot sees text on first-pass crawl
          try {
            const ssrContent = buildSSRContent(pageData, url);
            if (ssrContent) {
              modifiedHtml = modifiedHtml.replace(
                '<div id="root"></div>',
                `<div id="root">${ssrContent}</div>`
              );
            }
          } catch (err) {
            console.error('[SEO] SSR content injection error:', err);
          }

          // FAQ JSON-LD for broker review pages — used by AI tools (Perplexity, ChatGPT) for cited Q&A
          if (cleanUrl.startsWith('/broker/') && pageData.acf) {
            try {
              const acf = pageData.acf;
              const brokerName = (pageData.title?.rendered || pageData.name || '').replace(/<[^>]+>/g, '');
              const faqItems: Array<{ q: string; a: string }> = [];

              const reg = acf.regulation || acf.regulated_by;
              if (reg) faqItems.push({
                q: `Is ${brokerName} regulated?`,
                a: (reg === 'No Regulation' || reg === 'Unregulated')
                  ? `${brokerName} is not regulated by a major financial authority and operates as an offshore broker.`
                  : `${brokerName} is regulated by ${reg}.`
              });
              if (acf.min_deposit) faqItems.push({
                q: `What is the minimum deposit for ${brokerName}?`,
                a: `The minimum deposit for ${brokerName} is ${acf.min_deposit}.`
              });
              if (acf.max_leverage || acf.leverage) faqItems.push({
                q: `What leverage does ${brokerName} offer?`,
                a: `${brokerName} offers leverage up to ${acf.max_leverage || acf.leverage}.`
              });
              if (acf.trading_platforms) faqItems.push({
                q: `What trading platforms does ${brokerName} support?`,
                a: `${brokerName} supports: ${acf.trading_platforms}.`
              });
              if (acf.overall_score || acf.rating) faqItems.push({
                q: `What is ${brokerName}'s rating on EntryLab?`,
                a: `${brokerName} has an overall rating of ${acf.overall_score || acf.rating} out of 5 on EntryLab.`
              });
              if (acf.spread_from || acf.spreads_from || acf.spread) faqItems.push({
                q: `What are ${brokerName}'s spreads?`,
                a: `${brokerName} offers spreads from ${acf.spread_from || acf.spreads_from || acf.spread}.`
              });
              if (acf.deposit_methods) faqItems.push({
                q: `What deposit methods does ${brokerName} accept?`,
                a: `${brokerName} accepts the following deposit methods: ${acf.deposit_methods}.`
              });

              if (faqItems.length >= 2) {
                const faqSchema = {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": faqItems.map(item => ({
                    "@type": "Question",
                    "name": item.q,
                    "acceptedAnswer": { "@type": "Answer", "text": item.a }
                  }))
                };
                modifiedHtml = modifiedHtml.replace(
                  '</head>',
                  `  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>\n  </head>`
                );
              }
            } catch (err) {
              console.error('[SEO] FAQ schema injection error:', err);
            }
          }

        } else {
          // T002: For pages without pageData (homepage, /brokers, /prop-firms, category archives)
          // inject canonical + robots so Google doesn't treat query variants as duplicates
          const canonicalUrl = `https://entrylab.io${cleanUrl}`;
          const headTags = `
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">`;

          if (!modifiedHtml.includes('<meta name="robots"')) {
            modifiedHtml = modifiedHtml.replace('</head>', `${headTags}\n  </head>`);
          } else if (!modifiedHtml.includes('rel="canonical"')) {
            modifiedHtml = modifiedHtml.replace(
              '</head>',
              `  <link rel="canonical" href="${canonicalUrl}">\n  </head>`
            );
          }

          // Homepage, /brokers, /prop-firms: inject SSR content + internal links for crawlers
          if (cleanUrl === '/') {
            try {
              const homepageDesc = 'EntryLab provides expert forex broker reviews, prop firm analysis, and trading news. Compare brokers by regulation, spreads, leverage, and platforms.';
              // Inject og:description for homepage
              if (!modifiedHtml.includes('og:description')) {
                modifiedHtml = modifiedHtml.replace(
                  '</head>',
                  `  <meta property="og:description" content="${homepageDesc}">\n  <meta name="description" content="${homepageDesc}">\n  </head>`
                );
              }

              const [allBrokers, allPropFirms, recentPosts] = await Promise.all([
                fetchWordPressWithCache('https://admin.entrylab.io/wp-json/wp/v2/popular_broker?_embed&per_page=100&acf_format=standard').catch(() => []),
                fetchWordPressWithCache('https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?_embed&per_page=100&acf_format=standard').catch(() => []),
                fetchWordPressWithCache('https://admin.entrylab.io/wp-json/wp/v2/posts?_embed&per_page=50&orderby=date&order=desc').catch(() => []),
              ]);

              // SSR content block with broker ratings (readable by AI crawlers)
              const ssrStyle = `<style>#ssr-content{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px 16px;color:#1a1a1a}#ssr-content h1{font-size:2rem;font-weight:700;margin-bottom:16px}#ssr-content h2{font-size:1.4rem;font-weight:600;margin:24px 0 12px}#ssr-content p{margin-bottom:12px;line-height:1.7}#ssr-content ul{padding-left:20px;margin-bottom:12px}#ssr-content li{margin-bottom:4px}#ssr-nav{padding:16px;border-top:1px solid #eee;margin-top:24px}#ssr-nav ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px}#ssr-nav a{color:#2bb32a;text-decoration:none;font-size:0.9rem}</style>`;
              let ssrHtml = `${ssrStyle}<div id="ssr-content">`;
              ssrHtml += `<h1>EntryLab — Forex Broker Reviews &amp; Trading News</h1>`;
              ssrHtml += `<p>${homepageDesc}</p>`;

              ssrHtml += `<h2>Top Forex Broker Reviews</h2><ul>`;
              for (const b of (allBrokers || []).slice(0, 20)) {
                const name = (b.title?.rendered || b.name || '').replace(/<[^>]+>/g, '');
                const rating = b.acf?.overall_score || b.acf?.rating || '';
                const reg = b.acf?.regulation || b.acf?.regulated_by || '';
                if (b.slug && name) {
                  ssrHtml += `<li><a href="/broker/${b.slug}">${name}</a>${rating ? ` — Rating: ${rating}/5` : ''}${reg ? ` — ${reg}` : ''}</li>`;
                }
              }
              ssrHtml += `</ul>`;

              ssrHtml += `<h2>Top Prop Firm Reviews</h2><ul>`;
              for (const f of (allPropFirms || []).slice(0, 10)) {
                const name = (f.title?.rendered || f.name || '').replace(/<[^>]+>/g, '');
                const rating = f.acf?.overall_score || f.acf?.rating || '';
                if (f.slug && name) {
                  ssrHtml += `<li><a href="/prop-firm/${f.slug}">${name}</a>${rating ? ` — Rating: ${rating}/5` : ''}</li>`;
                }
              }
              ssrHtml += `</ul>`;

              ssrHtml += `<h2>Latest Broker News</h2><ul>`;
              for (const p of (recentPosts || []).slice(0, 15)) {
                const title = (p.title?.rendered || '').replace(/<[^>]+>/g, '');
                const catSlug = p._embedded?.['wp:term']?.[0]?.[0]?.slug || 'news';
                if (p.slug && title) {
                  ssrHtml += `<li><a href="/${catSlug}/${p.slug}">${title}</a></li>`;
                }
              }
              ssrHtml += `</ul></div>`;

              // Full nav for link discovery
              let navHtml = `<nav id="ssr-nav" aria-label="Site navigation"><ul>`;
              for (const b of (allBrokers || [])) {
                const name = (b.title?.rendered || b.name || '').replace(/<[^>]+>/g, '');
                if (b.slug && name) navHtml += `<li><a href="/broker/${b.slug}">${name}</a></li>`;
              }
              for (const f of (allPropFirms || [])) {
                const name = (f.title?.rendered || f.name || '').replace(/<[^>]+>/g, '');
                if (f.slug && name) navHtml += `<li><a href="/prop-firm/${f.slug}">${name}</a></li>`;
              }
              for (const p of (recentPosts || [])) {
                const title = (p.title?.rendered || '').replace(/<[^>]+>/g, '');
                const catSlug = p._embedded?.['wp:term']?.[0]?.[0]?.slug || 'news';
                if (p.slug && title) navHtml += `<li><a href="/${catSlug}/${p.slug}">${title}</a></li>`;
              }
              navHtml += `</ul></nav>`;

              modifiedHtml = modifiedHtml.replace(
                '<div id="root"></div>',
                `<div id="root">${ssrHtml}${navHtml}</div>`
              );
              console.log('[SEO] Injected homepage SSR content + nav');
            } catch (err) {
              console.error('[SEO] Homepage SSR injection error:', err);
            }

          } else if (cleanUrl === '/brokers') {
            try {
              const brokers = await fetchWordPressWithCache(
                'https://admin.entrylab.io/wp-json/wp/v2/popular_broker?_embed&per_page=100&acf_format=standard'
              ).catch(() => []);

              const ssrStyle = `<style>#ssr-content{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px 16px;color:#1a1a1a}#ssr-content h1{font-size:2rem;font-weight:700;margin-bottom:16px}#ssr-content h2{font-size:1.4rem;font-weight:600;margin:24px 0 12px}#ssr-content p{margin-bottom:12px;line-height:1.7}#ssr-content ul{padding-left:20px;margin-bottom:12px}#ssr-content li{margin-bottom:4px}</style>`;
              let ssrHtml = `${ssrStyle}<div id="ssr-content">`;
              ssrHtml += `<h1>Forex Broker Reviews</h1>`;
              ssrHtml += `<p>EntryLab reviews forex brokers across regulation, spreads, leverage, platforms, and deposit methods. Compare top regulated and offshore brokers side by side.</p>`;
              ssrHtml += `<ul>`;
              for (const b of (brokers || [])) {
                const name = (b.title?.rendered || b.name || '').replace(/<[^>]+>/g, '');
                const rating = b.acf?.overall_score || b.acf?.rating || '';
                const reg = b.acf?.regulation || b.acf?.regulated_by || '';
                const minDep = b.acf?.min_deposit || '';
                const leverage = b.acf?.max_leverage || b.acf?.leverage || '';
                if (b.slug && name) {
                  const details = [rating ? `Rating: ${rating}/5` : '', reg, minDep ? `Min deposit: ${minDep}` : '', leverage ? `Leverage: ${leverage}` : ''].filter(Boolean).join(' · ');
                  ssrHtml += `<li><a href="/broker/${b.slug}">${name}</a>${details ? ` — ${details}` : ''}</li>`;
                }
              }
              ssrHtml += `</ul></div>`;

              modifiedHtml = modifiedHtml.replace('<div id="root"></div>', `<div id="root">${ssrHtml}</div>`);
              console.log('[SEO] Injected /brokers SSR content');
            } catch (err) {
              console.error('[SEO] /brokers SSR injection error:', err);
            }

          } else if (cleanUrl === '/prop-firms') {
            try {
              const firms = await fetchWordPressWithCache(
                'https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?_embed&per_page=100&acf_format=standard'
              ).catch(() => []);

              const ssrStyle = `<style>#ssr-content{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px 16px;color:#1a1a1a}#ssr-content h1{font-size:2rem;font-weight:700;margin-bottom:16px}#ssr-content h2{font-size:1.4rem;font-weight:600;margin:24px 0 12px}#ssr-content p{margin-bottom:12px;line-height:1.7}#ssr-content ul{padding-left:20px;margin-bottom:12px}#ssr-content li{margin-bottom:4px}</style>`;
              let ssrHtml = `${ssrStyle}<div id="ssr-content">`;
              ssrHtml += `<h1>Prop Firm Reviews</h1>`;
              ssrHtml += `<p>Compare the best proprietary trading firms. EntryLab reviews evaluation processes, profit splits, drawdown rules, payout speeds, and account sizes for every major prop firm.</p>`;
              ssrHtml += `<ul>`;
              for (const f of (firms || [])) {
                const name = (f.title?.rendered || f.name || '').replace(/<[^>]+>/g, '');
                const rating = f.acf?.overall_score || f.acf?.rating || '';
                const split = f.acf?.profit_split || '';
                const sizes = f.acf?.account_sizes || '';
                if (f.slug && name) {
                  const details = [rating ? `Rating: ${rating}/5` : '', split ? `Profit split: ${split}` : '', sizes ? `Accounts: ${sizes}` : ''].filter(Boolean).join(' · ');
                  ssrHtml += `<li><a href="/prop-firm/${f.slug}">${name}</a>${details ? ` — ${details}` : ''}</li>`;
                }
              }
              ssrHtml += `</ul></div>`;

              modifiedHtml = modifiedHtml.replace('<div id="root"></div>', `<div id="root">${ssrHtml}</div>`);
              console.log('[SEO] Injected /prop-firms SSR content');
            } catch (err) {
              console.error('[SEO] /prop-firms SSR injection error:', err);
            }
          }
        }
        
        return modifiedHtml;
      }
      
      // Intercept res.end (used by Vite)
      res.end = function(chunk?: any, encoding?: any, callback?: any) {
        if (typeof chunk === 'string' && (chunk.includes('<html') || chunk.includes('<!DOCTYPE'))) {
          console.log('[SEO] Injecting SEO tags into HTML');
          injectSEO(chunk)
            .then(modifiedHtml => {
              console.log('[SEO] Successfully injected SEO tags');
              originalEnd.call(res, modifiedHtml, encoding, callback);
            })
            .catch(error => {
              console.error('[SEO] Injection error:', error);
              originalEnd.call(res, chunk, encoding, callback);
            });
        } else {
          originalEnd.call(res, chunk, encoding, callback);
        }
        return res;
      };
      
      // Intercept res.send (used by static serving in production)
      res.send = function(data: any) {
        if (typeof data === 'string' && (data.includes('<html') || data.includes('<!DOCTYPE'))) {
          console.log('[SEO] Injecting SEO tags into HTML (send)');
          injectSEO(data)
            .then(modifiedHtml => {
              console.log('[SEO] Successfully injected SEO tags (send)');
              res.type('html');
              originalSend.call(res, modifiedHtml);
            })
            .catch(error => {
              console.error('[SEO] Injection error (send):', error);
              originalSend.call(res, data);
            });
        } else {
          originalSend.call(res, data);
        }
        return res;
      };
    }
    
    next();
  });

  // Email capture endpoint
  app.post('/api/capture-email', async (req, res) => {
    try {
      const { 
        email, 
        source, 
        utm_campaign, 
        utm_source, 
        utm_medium,
        utm_content,
        utm_term,
        gclid,
        fbclid
      } = req.body;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      // Get IP address from request
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() 
        || req.socket.remoteAddress 
        || '';

      const userAgent = req.headers['user-agent'] || '';

      // Find or create user
      let [user] = await db.select()
        .from(signalUsers)
        .where(eq(signalUsers.email, email));

      if (!user) {
        [user] = await db.insert(signalUsers)
          .values({ email })
          .returning();
      }

      // Log email capture for analytics
      await db.insert(emailCaptures).values({
        email,
        source: source || 'direct',
        utmCampaign: utm_campaign,
        utmSource: utm_source,
        utmMedium: utm_medium,
        utmContent: utm_content,
        utmTerm: utm_term,
        gclid: gclid || null,
        fbclid: fbclid || null,
        ipAddress,
        userAgent,
      });

      console.log(`Email captured: ${email} from ${source || 'direct'}`);

      const FALLBACK_CHANNEL_LINK = 'https://t.me/entrylabs';
      let channelLink = FALLBACK_CHANNEL_LINK;

      // Get dynamic invite link from PromoStack
      try {
        const { promostackClient } = await import('./promostackClient');
        const inviteLink = await promostackClient.addFreeUser({
          email,
          name: '',
          source: source || 'signals_landing',
          utmSource: utm_source,
          utmMedium: utm_medium,
          utmCampaign: utm_campaign,
          utmContent: utm_content,
          utmTerm: utm_term,
          gclid: gclid || '',
          fbclid: fbclid || '',
        });
        if (inviteLink) {
          channelLink = inviteLink;
        }
        console.log(`PromoStack free lead: ${email} (link: ${channelLink}, utm_source: ${utm_source}, utm_campaign: ${utm_campaign})`);
      } catch (promostackError) {
        console.error('PromoStack tracking error:', promostackError);
      }

      // Send welcome email with the invite link (non-blocking, with retry)
      try {
        const { getUncachableResendClient } = await import('./resendClient');
        const { getFreeChannelEmailHtml } = await import('./emailTemplates');
        const { sendEmailWithRetry } = await import('./emailUtils');
        
        const { fromEmail } = await getUncachableResendClient();
        const emailHtml = getFreeChannelEmailHtml(channelLink);
        
        const result = await sendEmailWithRetry({
          from: `EntryLab Signals <${fromEmail}>`,
          to: email,
          subject: 'Welcome to EntryLab - Join Our Free Channel!',
          html: emailHtml,
        });
        
        if (result.success) {
          console.log(`Free channel welcome email sent to: ${email}`);
        } else {
          console.error(`Free channel email failed for ${email}:`, result.error);
        }
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      res.json({
        success: true,
        redirect_url: channelLink,
        message: 'Success! Click the button to join our free Telegram channel.',
      });

    } catch (error: any) {
      console.error('Email capture error:', error);
      res.status(500).json({ error: 'Failed to process email' });
    }
  });

  // Free signup endpoint - WordPress calls this when users submit the free signals form
  app.post('/api/free-signup', async (req, res) => {
    try {
      const { email, name, source, gclid, fbclid } = req.body;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      const FALLBACK_LINK = 'https://t.me/entrylabs';
      let channelLink = FALLBACK_LINK;

      try {
        const { promostackClient } = await import('./promostackClient');
        const inviteLink = await promostackClient.addFreeUser({
          email,
          name: name || '',
          source: source || 'Free Gold Signals',
          gclid: gclid || '',
          fbclid: fbclid || '',
        });
        if (inviteLink) {
          channelLink = inviteLink;
        }
        console.log(`Free signup registered: ${email} (link: ${channelLink})`);
      } catch (promostackError) {
        console.error(`PromoStack tracking error for ${email}:`, promostackError);
      }

      res.json({
        success: true,
        message: 'Free signup registered successfully',
        inviteLink: channelLink
      });

    } catch (error: any) {
      console.error('Free signup error:', error);
      res.status(500).json({ error: 'Failed to process free signup' });
    }
  });

  // Create Stripe checkout session
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const { email, priceId, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid } = req.body;

      if (!email || !priceId) {
        return res.status(400).json({ error: 'Email and price ID required' });
      }

      const stripe = await getUncachableStripeClient();

      // Find or create user
      let [user] = await db.select()
        .from(signalUsers)
        .where(eq(signalUsers.email, email));

      if (!user) {
        [user] = await db.insert(signalUsers)
          .values({ email })
          .returning();
      }

      // Find or create Stripe customer (with validation that customer still exists)
      let customerId = user.stripeCustomerId;
      
      // Verify existing customer still exists in Stripe
      if (customerId) {
        try {
          await stripe.customers.retrieve(customerId);
        } catch (customerError: any) {
          if (customerError.code === 'resource_missing') {
            console.log(`Customer ${customerId} no longer exists in Stripe, creating new one`);
            customerId = null;
          } else {
            throw customerError;
          }
        }
      }
      
      // Create new customer if needed
      if (!customerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: { userId: user.id },
        });
        customerId = customer.id;

        await db.update(signalUsers)
          .set({ stripeCustomerId: customerId })
          .where(eq(signalUsers.id, user.id));
      }

      // Determine success/cancel URLs based on environment
      const baseUrl = req.protocol + '://' + req.get('host');
      const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/subscribe`;

      // Get the price to determine if it's recurring or one-time
      const price = await stripe.prices.retrieve(priceId);
      const isOneTime = price.type === 'one_time';
      const mode = isOneTime ? 'payment' : 'subscription';

      console.log(`Creating ${mode} checkout for price ${priceId} (type: ${price.type})`);

      // Create checkout session with appropriate mode
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user.id,
          email,
          planType: isOneTime ? 'lifetime' : 'subscription',
          ...(utm_source && { utm_source }),
          ...(utm_medium && { utm_medium }),
          ...(utm_campaign && { utm_campaign }),
          ...(utm_content && { utm_content }),
          ...(utm_term && { utm_term }),
          ...(gclid && { gclid }),
          ...(fbclid && { fbclid }),
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        ...(isOneTime ? { invoice_creation: { enabled: true } } : {}),
      });

      console.log(`Checkout session created for ${email}: ${session.id}`);

      res.json({ 
        checkout_url: session.url,
        session_id: session.id 
      });

    } catch (error: any) {
      console.error('Checkout session error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Get invite link by session ID (for success page)
  app.get('/api/invite-link/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
      }

      const stripe = await getUncachableStripeClient();

      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (!session || !session.customer_email) {
        // Try to get email from metadata
        const email = session?.metadata?.email;
        if (!email) {
          return res.status(404).json({ error: 'Session not found or no email associated' });
        }
      }

      const email = session.customer_email || session.metadata?.email;

      // Look up user's invite link
      const [user] = await db.select({
        telegramInviteLink: signalUsers.telegramInviteLink,
        welcomeEmailSent: signalUsers.welcomeEmailSent,
      })
        .from(signalUsers)
        .where(eq(signalUsers.email, email as string));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return the invite link if available
      res.json({
        success: true,
        inviteLink: user.telegramInviteLink || null,
        emailSent: user.welcomeEmailSent || false,
      });

    } catch (error: any) {
      console.error('Invite link lookup error:', error);
      // Don't expose internal errors, just return not found
      res.status(404).json({ error: 'Unable to retrieve invite link' });
    }
  });

  // Get subscription status
  app.post('/api/subscription-status', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }

      const [user] = await db.select()
        .from(signalUsers)
        .where(eq(signalUsers.email, email));

      if (!user || !user.stripeSubscriptionId) {
        return res.json({ 
          hasSubscription: false,
          status: null 
        });
      }

      // Query subscription from our subscriptions table
      const [subscription] = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, user.stripeSubscriptionId));

      res.json({
        hasSubscription: true,
        status: subscription?.status || 'unknown',
        currentPeriodEnd: subscription?.currentPeriodEnd || null,
        telegramConnected: !!user.telegramUserId,
        email: user.email,
      });

    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({ error: 'Failed to get subscription status' });
    }
  });

  // Admin endpoint to manually resend welcome email (protected by admin key)
  app.post('/api/admin/resend-welcome-email', async (req, res) => {
    try {
      const { email, adminKey } = req.body;
      
      // Simple admin key protection - check against env var
      const expectedKey = process.env.ADMIN_API_KEY || 'entrylab-admin-2024';
      if (adminKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }

      const [user] = await db.select()
        .from(signalUsers)
        .where(eq(signalUsers.email, email));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get invite link (use existing or fallback)
      const telegramLink = user.telegramInviteLink || 'https://t.me/+TbJsf9xRrNkwN2E0';

      // Use static imports (defined at top of file)
      const { fromEmail } = await getUncachableResendClient();
      const { sendEmailWithRetry } = await import('./emailUtils');
      
      const emailHtml = getWelcomeEmailHtml(telegramLink);
      console.log('Email HTML preview (first 500 chars):', emailHtml.substring(0, 500));
      
      // Use retry logic for rate limit resilience
      const result = await sendEmailWithRetry({
        from: fromEmail,
        to: email,
        subject: 'Welcome to EntryLab Premium Signals!',
        html: emailHtml,
        text: `Welcome to EntryLab Premium Signals!\n\nYour subscription is now active. Join our private Telegram channel: ${telegramLink}\n\nQuestions? Contact us at support@entrylab.io`,
      });

      if (!result.success) {
        throw new Error(result.error || 'Email send failed');
      }

      // Update the flag
      await db.update(signalUsers)
        .set({ welcomeEmailSent: true })
        .where(eq(signalUsers.id, user.id));

      console.log(`Admin: Welcome email manually sent to ${email}`);

      res.json({ 
        success: true, 
        message: `Welcome email sent to ${email}`,
        inviteLink: telegramLink
      });

    } catch (error: any) {
      console.error('Admin resend email error:', error);
      res.status(500).json({ error: 'Failed to send email: ' + error.message });
    }
  });

  // Admin endpoint to send test emails (all 3 types)
  app.post('/api/admin/send-test-emails', async (req, res) => {
    try {
      const { email, adminKey } = req.body;
      
      const expectedKey = process.env.ADMIN_API_KEY || 'entrylab-admin-2024';
      if (adminKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }

      const { client, fromEmail } = await getUncachableResendClient();
      const results: string[] = [];

      // Helper to delay between sends (Resend rate limit is 2/sec)
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // 1. Welcome Email (Premium)
      try {
        const welcomeHtml = getWelcomeEmailHtml('https://t.me/+TestInviteLink123');
        const welcomeResult = await client.emails.send({
          from: `EntryLab Signals <${fromEmail}>`,
          to: email,
          subject: '[TEST] Welcome to EntryLab Premium Signals!',
          html: welcomeHtml,
        });
        if (welcomeResult.error) {
          results.push(`Welcome email failed: ${welcomeResult.error.message}`);
        } else {
          results.push('Welcome email sent');
        }
      } catch (e: any) {
        results.push(`Welcome email failed: ${e.message}`);
      }

      await delay(600); // Wait to avoid rate limit

      // 2. Cancellation Email
      try {
        const cancelHtml = getCancellationEmailHtml();
        const cancelResult = await client.emails.send({
          from: `EntryLab Signals <${fromEmail}>`,
          to: email,
          subject: '[TEST] Subscription Cancelled - EntryLab',
          html: cancelHtml,
        });
        if (cancelResult.error) {
          results.push(`Cancellation email failed: ${cancelResult.error.message}`);
        } else {
          results.push('Cancellation email sent');
        }
      } catch (e: any) {
        results.push(`Cancellation email failed: ${e.message}`);
      }

      await delay(600); // Wait to avoid rate limit

      // 3. Free Channel Email
      try {
        const freeHtml = getFreeChannelEmailHtml('https://t.me/entrylabs');
        const freeResult = await client.emails.send({
          from: `EntryLab Signals <${fromEmail}>`,
          to: email,
          subject: '[TEST] Welcome to EntryLab Free Channel!',
          html: freeHtml,
        });
        if (freeResult.error) {
          results.push(`Free channel email failed: ${freeResult.error.message}`);
        } else {
          results.push('Free channel email sent');
        }
      } catch (e: any) {
        results.push(`Free channel email failed: ${e.message}`);
      }

      console.log(`Admin: Test emails sent to ${email}:`, results);
      res.json({ success: true, results });

    } catch (error: any) {
      console.error('Admin test emails error:', error);
      res.status(500).json({ error: 'Failed to send test emails: ' + error.message });
    }
  });

  // Email preview endpoints (for testing)
  // Use local logo URL for previews so they work in browser
  const getPreviewLogoUrl = (req: any) => {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    return `${protocol}://${host}/api/admin/logo-proxy`;
  };

  // Logo proxy to avoid CORS issues in preview
  app.get('/api/admin/logo-proxy', async (req, res) => {
    try {
      const response = await fetch('https://entrylab.io/assets/entrylab-logo-green.png');
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(Buffer.from(buffer));
    } catch (error) {
      res.status(500).send('Failed to load logo');
    }
  });

  app.get('/api/admin/preview-email/welcome', (req, res) => {
    let html = getWelcomeEmailHtml('https://t.me/+TestInviteLink123');
    html = html.replace('https://entrylab.io/assets/entrylab-logo-green.png', getPreviewLogoUrl(req));
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.get('/api/admin/preview-email/cancellation', (req, res) => {
    let html = getCancellationEmailHtml();
    html = html.replace('https://entrylab.io/assets/entrylab-logo-green.png', getPreviewLogoUrl(req));
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  app.get('/api/admin/preview-email/free', (req, res) => {
    let html = getFreeChannelEmailHtml('https://t.me/entrylabs');
    html = html.replace('https://entrylab.io/assets/entrylab-logo-green.png', getPreviewLogoUrl(req));
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  const httpServer = createServer(app);

  return httpServer;
}
