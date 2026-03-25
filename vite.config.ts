import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    // In dev mode, prevent the browser from permanently caching pre-bundled
    // dep chunks. Vite sets Cache-Control: max-age=31536000,immutable on these
    // files. When dep hashes change (re-optimisation), source files cached at
    // old hashes still reference old dep URLs — creating a React/react-dom
    // version mismatch that crashes the app. Stripping immutable caching in
    // development ensures every dep is always fetched fresh.
    ...(process.env.NODE_ENV !== "production"
      ? [
          {
            name: "no-immutable-cache-in-dev",
            configureServer(server: any) {
              server.middlewares.use((_req: any, res: any, next: any) => {
                const orig = res.setHeader.bind(res);
                res.setHeader = (name: string, value: any) => {
                  if (
                    name.toLowerCase() === "cache-control" &&
                    String(value).includes("immutable")
                  ) {
                    return orig(name, "no-store");
                  }
                  return orig(name, value);
                };
                next();
              });
            },
          },
        ]
      : []),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
    ...(process.env.NODE_ENV === "production"
      ? [
          await import("vite-plugin-compression2").then(({ compression }) =>
            compression({
              algorithms: ["gzip", "brotliCompress"],
              include: /\.(js|css|html|svg|json|txt|xml|woff2)$/,
              threshold: 1024,
            })
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — cached separately, rarely changes
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'react';
          }
          // React Query — separate chunk
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          // Radix UI primitives — shared across many pages
          if (id.includes('@radix-ui/')) {
            return 'radix';
          }
          // Lucide icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
