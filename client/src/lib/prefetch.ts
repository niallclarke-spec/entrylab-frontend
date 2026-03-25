import { queryClient } from "@/lib/queryClient";

// Route prefetching utilities for faster navigation.
// Two layers: (1) JS chunk prefetch, (2) API data prefetch via React Query.
// Both fire on hover so by the time the user clicks, the page renders instantly.

const prefetchedRoutes = new Set<string>();

// Prefetch both the route JS chunk AND the underlying API data
export function prefetchRoute(route: string) {
  if (prefetchedRoutes.has(route)) return;
  prefetchedRoutes.add(route);

  // Layer 1 — lazy-load the page JS chunk so it's in browser cache
  switch (route) {
    case '/':
      import('@/pages/Home');
      break;
    case '/brokers':
      import('@/pages/Brokers');
      break;
    case '/prop-firms':
      import('@/pages/PropFirms');
      break;
    case '/archive':
      import('@/pages/Archive');
      break;
    case '/article':
      import('@/pages/Article');
      break;
    case '/brokers/compare':
      import('@/pages/ComparisonBrokerHub');
      break;
    case '/prop-firms/compare':
      import('@/pages/ComparisonPropFirmHub');
      break;
    case '/signals':
      import('@/pages/SignalsLanding');
      break;
    case '/compare':
      import('@/pages/Compare');
      break;
  }

  // Layer 2 — prime the React Query cache so the page has data ready immediately
  switch (route) {
    case '/brokers':
      queryClient.prefetchQuery({
        queryKey: ['/api/brokers'],
        staleTime: 5 * 60 * 1000,
      });
      break;
    case '/prop-firms':
      queryClient.prefetchQuery({
        queryKey: ['/api/prop-firms'],
        staleTime: 5 * 60 * 1000,
      });
      break;
    case '/compare':
    case '/brokers/compare':
      queryClient.prefetchQuery({ queryKey: ['/api/brokers'], staleTime: 5 * 60 * 1000 });
      break;
    case '/prop-firms/compare':
      queryClient.prefetchQuery({ queryKey: ['/api/prop-firms'], staleTime: 5 * 60 * 1000 });
      break;
    case '/':
    case '/archive':
      queryClient.prefetchQuery({ queryKey: ['/api/articles'], staleTime: 5 * 60 * 1000 });
      queryClient.prefetchQuery({ queryKey: ['/api/categories'], staleTime: 10 * 60 * 1000 });
      break;
  }
}

// Prefetch a specific article's data by slug so the article page renders
// instantly when the user clicks a card. Called from ArticleCard on hover.
// Key must match the queryKey used in Article.tsx: ["/api/articles", slug]
export function prefetchArticle(slug: string) {
  const queryKey = ['/api/articles', slug];
  if (queryClient.getQueryData(queryKey)) return;
  queryClient.prefetchQuery({ queryKey, staleTime: 5 * 60 * 1000 });
}

// Auto-prefetch high-traffic routes after initial load settles
export function autoPrefetchRoutes(delay: number = 2000) {
  setTimeout(() => {
    prefetchRoute('/brokers');
    prefetchRoute('/prop-firms');
    prefetchRoute('/archive');
    prefetchRoute('/article');
    prefetchRoute('/compare');
    prefetchRoute('/signals');
  }, delay);
}
