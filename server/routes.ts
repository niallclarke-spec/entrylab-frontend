import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/wordpress/posts", async (req, res) => {
    try {
      const { category } = req.query;
      let url = "https://admin.entrylab.io/wp-json/wp/v2/posts?_embed&per_page=10&orderby=date&order=desc";
      
      if (category) {
        url += `&categories=${category}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.statusText}`);
      }
      
      const posts = await response.json();
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
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.statusText}`);
      }
      
      const categories = await response.json();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching WordPress categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/wordpress/brokers", async (req, res) => {
    try {
      const response = await fetch(
        "https://admin.entrylab.io/wp-json/wp/v2/popular_broker?_embed&per_page=100&acf_format=standard"
      );
      
      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.statusText}`);
      }
      
      const brokers = await response.json();
      res.json(brokers);
    } catch (error) {
      console.error("Error fetching WordPress brokers:", error);
      res.status(500).json({ error: "Failed to fetch brokers" });
    }
  });

  app.get("/api/wordpress/prop-firms", async (req, res) => {
    try {
      const response = await fetch(
        "https://admin.entrylab.io/wp-json/wp/v2/popular_prop_firm?_embed&per_page=100&acf_format=standard"
      );
      
      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.statusText}`);
      }
      
      const propFirms = await response.json();
      res.json(propFirms);
    } catch (error) {
      console.error("Error fetching WordPress prop firms:", error);
      res.status(500).json({ error: "Failed to fetch prop firms" });
    }
  });

  app.get("/api/brokers", async (req, res) => {
    const brokers = await storage.getBrokers();
    res.json(brokers);
  });

  app.get("/api/wordpress/trust-signals", async (req, res) => {
    try {
      // Fetch trust signals from WordPress options
      const response = await fetch(
        "https://admin.entrylab.io/wp-json/entrylab/v1/trust-signals"
      );
      
      if (!response.ok) {
        // Return default values if endpoint doesn't exist yet
        return res.json([
          { icon: "users", value: "50,000+", label: "Active Traders" },
          { icon: "trending", value: "$2.5B+", label: "Trading Volume" },
          { icon: "award", value: "100+", label: "Verified Brokers" },
          { icon: "shield", value: "2020", label: "Trusted Since" },
        ]);
      }
      
      const signals = await response.json();
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
      const response = await fetch(
        `https://admin.entrylab.io/wp-json/wp/v2/posts?slug=${slug}&_embed`
      );
      
      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.statusText}`);
      }
      
      const posts = await response.json();
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

      const response = await fetch(
        "https://admin.entrylab.io/wp-json/entrylab/v1/newsletter/subscribe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.statusText}`);
      }

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ error: "Failed to subscribe" });
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
