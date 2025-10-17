import { lazy, Suspense, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { autoPrefetchRoutes } from "@/lib/prefetch";

const Home = lazy(() => import("@/pages/Home"));
const Article = lazy(() => import("@/pages/Article"));
const Archive = lazy(() => import("@/pages/Archive"));
const CategoryArchive = lazy(() => import("@/pages/CategoryArchive"));
const Brokers = lazy(() => import("@/pages/Brokers"));
const PropFirms = lazy(() => import("@/pages/PropFirms"));
const BrokerReview = lazy(() => import("@/pages/BrokerReview"));
const PropFirmReview = lazy(() => import("@/pages/PropFirmReview"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-full max-w-4xl mx-auto px-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-5/6" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Suspense fallback={<PageLoadingFallback />}>
          <Home />
        </Suspense>
      </Route>
      <Route path="/news">
        <Suspense fallback={<PageLoadingFallback />}>
          <CategoryArchive />
        </Suspense>
      </Route>
      <Route path="/brokers">
        <Suspense fallback={<PageLoadingFallback />}>
          <Brokers />
        </Suspense>
      </Route>
      <Route path="/broker/:slug">
        <Suspense fallback={<PageLoadingFallback />}>
          <BrokerReview />
        </Suspense>
      </Route>
      <Route path="/prop-firms/:category?">
        <Suspense fallback={<PageLoadingFallback />}>
          <PropFirms />
        </Suspense>
      </Route>
      <Route path="/prop-firm/:slug">
        <Suspense fallback={<PageLoadingFallback />}>
          <PropFirmReview />
        </Suspense>
      </Route>
      {/* Dynamic category archive route - catches single-segment URLs like /broker-news */}
      {/* Must come after specific routes (/brokers, /archive) but before article route */}
      <Route path="/:slug">
        <Suspense fallback={<PageLoadingFallback />}>
          <CategoryArchive />
        </Suspense>
      </Route>
      <Route path="/:category/:slug">
        <Suspense fallback={<PageLoadingFallback />}>
          <Article />
        </Suspense>
      </Route>
      <Route>
        <Suspense fallback={<PageLoadingFallback />}>
          <NotFound />
        </Suspense>
      </Route>
    </Switch>
  );
}

function App() {
  // Auto-prefetch high-traffic routes after 2 seconds
  useEffect(() => {
    autoPrefetchRoutes(2000);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ThemeProvider defaultTheme="dark">
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
