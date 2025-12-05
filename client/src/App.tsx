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
const BrokerCategoryArchive = lazy(() => import("@/pages/BrokerCategoryArchive"));
const PropFirms = lazy(() => import("@/pages/PropFirms"));
const PropFirmCategoryArchive = lazy(() => import("@/pages/PropFirmCategoryArchive"));
const BrokerReview = lazy(() => import("@/pages/BrokerReview"));
const PropFirmReview = lazy(() => import("@/pages/PropFirmReview"));
const SignalsLanding = lazy(() => import("@/pages/SignalsLanding"));
const Subscribe = lazy(() => import("@/pages/Subscribe"));
const Success = lazy(() => import("@/pages/Success"));
const FreeAccess = lazy(() => import("@/pages/FreeAccess"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const TermsConditions = lazy(() => import("@/pages/TermsConditions"));
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
      <Route path="/brokers">
        <Suspense fallback={<PageLoadingFallback />}>
          <Brokers />
        </Suspense>
      </Route>
      <Route path="/broker-categories/:slug">
        <Suspense fallback={<PageLoadingFallback />}>
          <BrokerCategoryArchive />
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
      <Route path="/signals">
        <Suspense fallback={<PageLoadingFallback />}>
          <SignalsLanding />
        </Suspense>
      </Route>
      <Route path="/subscribe">
        <Suspense fallback={<PageLoadingFallback />}>
          <Subscribe />
        </Suspense>
      </Route>
      <Route path="/success">
        <Suspense fallback={<PageLoadingFallback />}>
          <Success />
        </Suspense>
      </Route>
      <Route path="/free-access">
        <Suspense fallback={<PageLoadingFallback />}>
          <FreeAccess />
        </Suspense>
      </Route>
      <Route path="/dashboard">
        <Suspense fallback={<PageLoadingFallback />}>
          <Dashboard />
        </Suspense>
      </Route>
      <Route path="/terms">
        <Suspense fallback={<PageLoadingFallback />}>
          <TermsConditions />
        </Suspense>
      </Route>
      {/* Article route must come BEFORE category archive to match 2-segment URLs first */}
      <Route path="/:category/:slug">
        <Suspense fallback={<PageLoadingFallback />}>
          <Article />
        </Suspense>
      </Route>
      {/* Broker category archives - specific slugs for broker categories */}
      <Route path="/top-cfd-brokers">
        <Suspense fallback={<PageLoadingFallback />}>
          <BrokerCategoryArchive />
        </Suspense>
      </Route>
      <Route path="/top-3-cfd-brokers">
        <Suspense fallback={<PageLoadingFallback />}>
          <BrokerCategoryArchive />
        </Suspense>
      </Route>
      {/* Prop firm category archives - specific slugs for prop firm categories */}
      <Route path="/best-verified-propfirms">
        <Suspense fallback={<PageLoadingFallback />}>
          <PropFirmCategoryArchive />
        </Suspense>
      </Route>
      {/* Combined route for /news and category archives - single Suspense boundary prevents remounting */}
      <Route path="/:slug">
        <Suspense fallback={<PageLoadingFallback />}>
          <CategoryArchive />
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
