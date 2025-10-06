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
        "https://entrylab.io/wp-json/wp/v2/popular_broker?_embed&per_page=100"
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

  const httpServer = createServer(app);

  return httpServer;
}
