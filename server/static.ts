import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files with custom cache headers
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      // Normalize path to forward slashes for cross-platform regex matching
      const relativePath = filePath.replace(distPath, '').replace(/\\/g, '/');
      
      // Hashed assets (JS, CSS with Vite hash) - cache for 1 year
      // Vite builds to /assets/ with base36 hashes: /assets/index-DI8C41yW.js
      if (/\/assets\/[^/]*-[a-z0-9]{8,}\.(js|css)$/i.test(relativePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Images - cache for 30 days
      else if (/\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(relativePath)) {
        res.setHeader('Cache-Control', 'public, max-age=2592000');
      }
      // Fonts - cache for 1 year (including otf)
      else if (/\.(woff|woff2|ttf|eot|otf)$/i.test(relativePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // HTML files - cache for 10 min, allow stale-while-revalidate for better SEO
      else if (/\.html$/i.test(relativePath)) {
        res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=86400');
      }
      // Default for other static assets - 1 day cache
      else {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  // NOTE: Using res.send instead of res.sendFile to allow SSR middleware to inject structured data
  app.use("*", (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=86400');
    const htmlPath = path.resolve(distPath, "index.html");
    const html = fs.readFileSync(htmlPath, 'utf-8');
    res.type('html').send(html);
  });
}
