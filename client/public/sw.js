// Service worker: prevents stale Vite pre-bundled dep chunks from being
// served from the browser's HTTP cache. Vite marks these files with
// Cache-Control: immutable, so once the browser caches them they are never
// revalidated — even when Vite's dep hash changes on the next server start.
// When the hash changes the source files (App.tsx, etc.) reference new dep
// URLs, but other already-cached source files still reference old dep URLs,
// creating a React / react-dom version mismatch that crashes the app.
//
// This SW intercepts every request for a Vite dep chunk and forces a fresh
// network fetch (cache:'reload'), bypassing the browser HTTP cache entirely.
// Production builds are not affected because they don't use the dev server.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  // Target: Vite pre-bundled dep files served from the .vite/deps/ path.
  // These are the only files that get the immutable cache header.
  if (
    url.includes("/node_modules/.vite/deps/") ||
    (url.includes("/@fs/") && url.includes("?v="))
  ) {
    event.respondWith(
      fetch(event.request, { cache: "reload" }).catch(() =>
        fetch(event.request)
      )
    );
  }
});
