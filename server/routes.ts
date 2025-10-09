import type { Express } from "express";
import { createServer, type Server } from "http";
import https from "https";
import { storage } from "./storage";

// Helper function to make WordPress API requests using native https module
function fetchWordPress(url: string, options: { method?: string; body?: any } = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : undefined;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Host': urlObj.hostname,
        'Connection': 'keep-alive',
        ...(body && {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        }),
      },
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
            reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
          } else {
            resolve(JSON.parse(data));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data.substring(0, 100)}`));
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

// Helper function to verify reCAPTCHA token
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  // In development/local without reCAPTCHA configured, skip verification
  if (!secretKey) {
    console.warn('RECAPTCHA_SECRET_KEY not configured - skipping verification (dev mode)');
    return true; // Allow submission in development
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
    return data.success === true;
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/wordpress/posts", async (req, res) => {
    try {
      const { category } = req.query;
      let url = "https://admin.entrylab.io/wp-json/wp/v2/posts?_embed&per_page=10&orderby=date&order=desc";
      
      if (category) {
        url += `&categories=${category}`;
      }
      
      const posts = await fetchWordPress(url);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching WordPress posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/wordpress/categories", async (req, res) => {
    try {
      const { slug } = req.query;
      let url = "https://admin.entrylab.io/wp-json/wp/v2/categories";
      
      if (slug) {
        url += `?slug=${slug}`;
      }
      
      const categories = await fetchWordPress(url);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching WordPress categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/wordpress/brokers", async (req, res) => {
    try {
      const brokers = await fetchWordPress(
        "https://admin.entrylab.io/wp-json/wp/v2/popular_broker?_embed&per_page=100&acf_format=standard"
      );
      res.json(brokers);
    } catch (error) {
      console.error("Error fetching WordPress brokers:", error);
      res.status(500).json({ error: "Failed to fetch brokers" });
    }
  });

  app.get("/api/wordpress/prop-firms", async (req, res) => {
    try {
      const propFirms = await fetchWordPress(
        "https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?_embed&per_page=100&acf_format=standard"
      );
      res.json(propFirms);
    } catch (error) {
      console.error("Error fetching WordPress prop firms:", error);
      res.status(500).json({ error: "Failed to fetch prop firms" });
    }
  });

  app.get("/api/wordpress/prop-firm-categories", async (req, res) => {
    try {
      // WordPress uses "prop-firm-category" slug (with dashes)
      const categories = await fetchWordPress(
        "https://admin.entrylab.io/wp-json/wp/v2/prop-firm-category?per_page=100"
      );
      res.json(categories);
    } catch (error) {
      console.error("Error fetching WordPress prop firm categories:", error);
      res.json([]); // Return empty array instead of error for graceful degradation
    }
  });

  app.get("/api/wordpress/broker/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const brokers = await fetchWordPress(
        `https://admin.entrylab.io/wp-json/wp/v2/popular_broker?slug=${slug}&_embed&acf_format=standard`
      );
      
      if (brokers.length === 0) {
        return res.status(404).json({ error: "Broker not found" });
      }
      
      res.json(brokers[0]);
    } catch (error) {
      console.error("Error fetching WordPress broker:", error);
      res.status(500).json({ error: "Failed to fetch broker" });
    }
  });

  app.get("/api/wordpress/prop-firm/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const propFirms = await fetchWordPress(
        `https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?slug=${slug}&_embed&acf_format=standard`
      );
      
      if (propFirms.length === 0) {
        return res.status(404).json({ error: "Prop firm not found" });
      }
      
      res.json(propFirms[0]);
    } catch (error) {
      console.error("Error fetching WordPress prop firm:", error);
      res.status(500).json({ error: "Failed to fetch prop firm" });
    }
  });

  app.get("/api/brokers", async (req, res) => {
    const brokers = await storage.getBrokers();
    res.json(brokers);
  });

  app.get("/api/wordpress/trust-signals", async (req, res) => {
    try {
      // Fetch trust signals from WordPress options
      const signals = await fetchWordPress(
        "https://admin.entrylab.io/wp-json/entrylab/v1/trust-signals"
      );
      res.json(signals);
    } catch (error) {
      console.error("Error fetching trust signals:", error);
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
      const posts = await fetchWordPress(
        `https://admin.entrylab.io/wp-json/wp/v2/posts?slug=${slug}&_embed`
      );
      
      if (posts.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(posts[0]);
    } catch (error) {
      console.error("Error fetching WordPress post:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      const result = await fetchWordPress(
        "https://admin.entrylab.io/wp-json/entrylab/v1/newsletter/subscribe",
        {
          method: 'POST',
          body: { email }
        }
      );
      res.json(result);
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  app.post("/api/reviews/submit", async (req, res) => {
    try {
      const { rating, title, reviewText, name, email, newsletterOptin, brokerId, itemType, recaptchaToken } = req.body;
      
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
        fields: {
          rating,
          review_title: title,
          review_text: reviewText,
          reviewer_name: name,
          reviewer_email: email,
          reviewed_item: brokerId,
          newsletter_optin: newsletterOptin
        }
      };

      const result = await fetchWordPress(
        "https://admin.entrylab.io/wp-json/wp/v2/review",
        {
          method: 'POST',
          body: reviewData
        }
      );

      // If user opted into newsletter, subscribe them
      if (newsletterOptin && email) {
        try {
          await fetchWordPress(
            "https://admin.entrylab.io/wp-json/entrylab/v1/newsletter/subscribe",
            {
              method: 'POST',
              body: { email }
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
      const reviews = await fetchWordPress(
        `https://admin.entrylab.io/wp-json/wp/v2/review?status=publish&acf_format=standard&per_page=100&_embed`
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
      
      res.json(filteredReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
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

  const httpServer = createServer(app);

  return httpServer;
}
