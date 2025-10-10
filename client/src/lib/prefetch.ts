// Route prefetching utilities for faster navigation

const prefetchedRoutes = new Set<string>();

// Prefetch route components before they're needed
export function prefetchRoute(route: string) {
  // Avoid prefetching the same route twice
  if (prefetchedRoutes.has(route)) {
    return;
  }

  prefetchedRoutes.add(route);

  // Dynamically import the route component
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
    case '/broker':
      import('@/pages/BrokerReview');
      break;
    case '/prop-firm':
      import('@/pages/PropFirmReview');
      break;
  }
}

// Auto-prefetch high-traffic routes after initial load
export function autoPrefetchRoutes(delay: number = 2000) {
  setTimeout(() => {
    // Prefetch most common routes in order of priority
    prefetchRoute('/brokers');
    prefetchRoute('/archive');
    prefetchRoute('/article');
    prefetchRoute('/prop-firms');
  }, delay);
}
