import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/wordpress/posts", async (req, res) => {
    try {
      const response = await fetch(
        "https://entrylab.io/wp-json/wp/v2/posts?_embed&per_page=10&orderby=date&order=desc"
      );
      
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

  app.get("/api/brokers", async (req, res) => {
    const brokers = await storage.getBrokers();
    res.json(brokers);
  });

  const httpServer = createServer(app);

  return httpServer;
}
