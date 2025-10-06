import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/wordpress/posts", async (req, res) => {
    try {
      const { category } = req.query;
      let url = "https://entrylab.io/wp-json/wp/v2/posts?_embed&per_page=10&orderby=date&order=desc";
      
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
      let url = "https://entrylab.io/wp-json/wp/v2/categories";
      
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
        "https://entrylab.io/wp-json/wp/v2/popular_broker?_embed&per_page=100&acf_format=standard"
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

  app.get("/api/brokers", async (req, res) => {
    const brokers = await storage.getBrokers();
    res.json(brokers);
  });

  app.get("/api/wordpress/trust-signals", async (req, res) => {
    try {
      // Fetch trust signals from WordPress options
      const response = await fetch(
        "https://entrylab.io/wp-json/entrylab/v1/trust-signals"
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

  const httpServer = createServer(app);

  return httpServer;
}
