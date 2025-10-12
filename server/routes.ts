import type { Express } from "express";
import { createServer, type Server } from "http";
import https from "https";
import { storage } from "./storage";
import { db } from "./db";
import { brokerAlerts, insertBrokerAlertSchema } from "../shared/schema";
import { apiCache } from "./cache";
import { sendReviewNotification, sendTelegramMessage, getTelegramBot } from "./telegram";

// Cache key for published reviews - used for cache invalidation after approval/rejection
const REVIEWS_CACHE_KEY = 'https://admin.entrylab.io/wp-json/wp/v2/review?status=publish&acf_format=standard&per_page=100&_embed';

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
      let url = "https://admin.entrylab.io/wp-json/wp/v2/posts?_embed&per_page=10&orderby=date&order=desc";
      
      if (category) {
        url += `&categories=${category}`;
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

  app.get("/api/brokers", async (req, res) => {
    const brokers = await storage.getBrokers();
    res.json(brokers);
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

  // Dynamic Sitemap XML - CRITICAL: Set headers FIRST before any async operations
  app.get('/sitemap.xml', async (_req, res) => {
    // Set XML headers IMMEDIATELY - this prevents Express from serving HTML
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex'); // Don't index the sitemap itself
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    try {
      // Fetch all posts, brokers, and prop firms
      const [posts, brokers, propFirms] = await Promise.all([
        fetchWordPressWithCache('https://admin.entrylab.io/wp-json/wp/v2/posts?_embed&per_page=100'),
        fetchWordPressWithCache('https://admin.entrylab.io/wp-json/wp/v2/popular_broker?_embed&per_page=100'),
        fetchWordPressWithCache('https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?_embed&per_page=100')
      ]);

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

      // Archive page
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/archive</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>daily</changefreq>\n`;
      sitemap += `    <priority>0.9</priority>\n`;
      sitemap += `  </url>\n`;

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

      // Articles
      posts.forEach((post: any) => {
        const modifiedDate = new Date(post.modified).toISOString();
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/article/${post.slug}</loc>\n`;
        sitemap += `    <lastmod>${modifiedDate}</lastmod>\n`;
        sitemap += `    <changefreq>monthly</changefreq>\n`;
        sitemap += `    <priority>0.8</priority>\n`;
        sitemap += `  </url>\n`;
      });

      // Brokers
      brokers.forEach((broker: any) => {
        const modifiedDate = new Date(broker.modified).toISOString();
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/broker/${broker.slug}</loc>\n`;
        sitemap += `    <lastmod>${modifiedDate}</lastmod>\n`;
        sitemap += `    <changefreq>monthly</changefreq>\n`;
        sitemap += `    <priority>0.7</priority>\n`;
        sitemap += `  </url>\n`;
      });

      // Prop Firms
      propFirms.forEach((firm: any) => {
        const modifiedDate = new Date(firm.modified).toISOString();
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

  // Structured data injection middleware for SEO
  // This must run BEFORE Vite/static middleware to inject server-side structured data
  
  console.log('[SERVER] Registering SEO middleware');
  
  const { generateStructuredData } = await import("./structured-data");
  
  console.log('[SERVER] SEO middleware import successful');
  
  app.use(async (req, res, next) => {
    const url = req.originalUrl || req.url;
    
    console.log('[SEO MIDDLEWARE] Request URL:', url);
    
    // Only process HTML requests for specific page types
    const isHtmlRequest = !url.includes('.') || url.endsWith('.html');
    const needsStructuredData = url.startsWith('/article/') || 
                                url.startsWith('/broker/') || 
                                url.startsWith('/prop-firm/');
    
    if (isHtmlRequest && needsStructuredData) {
      console.log('[SEO MIDDLEWARE] Will inject structured data for:', url);
      // Wrap res.end to intercept HTML response (Vite uses res.end, not res.send)
      const originalEnd = res.end;
      const originalSend = res.send;
      
      // Intercept res.end
      res.end = function(chunk?: any, encoding?: any, callback?: any) {
        if (typeof chunk === 'string' && chunk.includes('id="ssr-structured-data"')) {
          console.log('[SEO] Replacing placeholder with structured data');
          generateStructuredData(url)
            .then(structuredData => {
              const modifiedHtml = chunk.replace('<script id="ssr-structured-data"></script>', structuredData);
              originalEnd.call(res, modifiedHtml, encoding, callback);
            })
            .catch(error => {
              console.error('[Structured Data] Injection error:', error);
              originalEnd.call(res, chunk, encoding, callback);
            });
        } else {
          originalEnd.call(res, chunk, encoding, callback);
        }
        
        return res;
      };
      
      // Also intercept res.send for production static serving
      res.send = function(data: any) {
        if (typeof data === 'string' && data.includes('id="ssr-structured-data"')) {
          console.log('[SEO] Replacing placeholder with structured data (send)');
          generateStructuredData(url)
            .then(structuredData => {
              const modifiedHtml = data.replace('<script id="ssr-structured-data"></script>', structuredData);
              res.type('html');
              originalSend.call(res, modifiedHtml);
            })
            .catch(error => {
              console.error('[Structured Data] Injection error:', error);
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

  const httpServer = createServer(app);

  return httpServer;
}
