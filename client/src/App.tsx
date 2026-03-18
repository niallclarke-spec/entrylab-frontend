import { lazy, Suspense, useEffect } from "react";
import { Switch, Route } from "wouter";
import AdminLogin from "@/pages/admin/AdminLogin";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { autoPrefetchRoutes } from "@/lib/prefetch";
import { CookieConsent } from "@/components/CookieConsent";
import { captureUTMParams } from "@/lib/utm";

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
const Compare = lazy(() => import("@/pages/Compare"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Admin pages (AdminLogin imported directly above for reliability)
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminFirmsList = lazy(() => import("@/pages/admin/AdminFirmsList"));
const AdminFirmEditor = lazy(() => import("@/pages/admin/AdminFirmEditor"));
const AdminReviews = lazy(() => import("@/pages/admin/AdminReviews"));
const AdminArticles = lazy(() => import("@/pages/admin/AdminArticles"));
const AdminPages = lazy(() => import("@/pages/admin/AdminPages"));
const AdminArticleEditor = lazy(() => import("@/pages/admin/AdminArticleEditor"));
const AdminPlaceholder = lazy(() => import("@/pages/admin/AdminPlaceholder"));
const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));
const AdminEmailLeads = lazy(() => import("@/pages/admin/AdminEmailLeads"));
const AdminComparisons = lazy(() => import("@/pages/admin/AdminComparisons"));
const AdminSEO = lazy(() => import("@/pages/admin/AdminSEO"));
const ComparisonPage = lazy(() => import("@/pages/ComparisonPage"));
const ComparisonBrokerHub = lazy(() => import("@/pages/ComparisonBrokerHub"));
const ComparisonPropFirmHub = lazy(() => import("@/pages/ComparisonPropFirmHub"));

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

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>;
}

function Router() {
  return (
    <Switch>
      {/* ── Admin routes first — must come before wildcard paths ── */}
      <Route path="/admin/login" component={AdminLogin} />

      <Route path="/admin/prop-firms/new">
        <S><AdminFirmEditor type="prop_firm" /></S>
      </Route>
      <Route path="/admin/prop-firms/:slug">
        <S><AdminFirmEditor type="prop_firm" /></S>
      </Route>
      <Route path="/admin/prop-firms">
        <S><AdminFirmsList type="prop_firm" /></S>
      </Route>
      <Route path="/admin/prop-firm-reviews">
        <S><AdminReviews type="prop-firm-reviews" /></S>
      </Route>

      <Route path="/admin/brokers/new">
        <S><AdminFirmEditor type="broker" /></S>
      </Route>
      <Route path="/admin/brokers/:slug">
        <S><AdminFirmEditor type="broker" /></S>
      </Route>
      <Route path="/admin/brokers">
        <S><AdminFirmsList type="broker" /></S>
      </Route>
      <Route path="/admin/broker-reviews">
        <S><AdminReviews type="broker-reviews" /></S>
      </Route>

      <Route path="/admin/email-leads"><S><AdminEmailLeads /></S></Route>

      <Route path="/admin/pages"><S><AdminPages /></S></Route>
      <Route path="/admin/posts/new"><S><AdminArticleEditor /></S></Route>
      <Route path="/admin/posts/:id/edit"><S><AdminArticleEditor /></S></Route>
      <Route path="/admin/posts"><S><AdminArticles /></S></Route>

      <Route path="/admin/articles/new"><S><AdminArticleEditor /></S></Route>
      <Route path="/admin/articles/:id/edit"><S><AdminArticleEditor /></S></Route>
      <Route path="/admin/articles"><S><AdminArticles /></S></Route>

      <Route path="/admin/comparisons">
        <S><AdminComparisons /></S>
      </Route>
      <Route path="/admin/categories"><S><AdminCategories /></S></Route>
      <Route path="/admin/tags">
        <S><AdminPlaceholder title="Tags & Categories" description="Manage firm tags like 'beginner-friendly', 'instant-funding', 'us-traders' and assign them to firms." /></S>
      </Route>
      <Route path="/admin/countries">
        <S><AdminPlaceholder title="Countries" description="Manage accepted and restricted country lists for each firm. Drives the country filter on listing pages." /></S>
      </Route>
      <Route path="/admin/platforms">
        <S><AdminPlaceholder title="Platforms" description="Reference data for MT4, MT5, cTrader, TradingView, and proprietary platforms used by brokers and prop firms." /></S>
      </Route>
      <Route path="/admin/regulators">
        <S><AdminPlaceholder title="Regulators" description="Master list of regulatory bodies, their tier classifications, and the countries they operate in." /></S>
      </Route>
      <Route path="/admin/payments">
        <S><AdminPlaceholder title="Payment Methods" description="Master list of deposit and withdrawal methods — cards, e-wallets, crypto, and bank wire transfers." /></S>
      </Route>
      <Route path="/admin/affiliates">
        <S><AdminPlaceholder title="Affiliate Links" description="Manage affiliate URLs, discount codes, and click tracking for all brokers and prop firms." /></S>
      </Route>
      <Route path="/admin/seo"><S><AdminSEO /></S></Route>
      <Route path="/admin/users">
        <S><AdminPlaceholder title="Team / Users" description="Manage admin users, roles, and access permissions for the EntryLab content team." /></S>
      </Route>
      <Route path="/admin"><S><AdminDashboard /></S></Route>

      {/* ── Public routes ── */}
      <Route path="/brokers"><S><Brokers /></S></Route>
      <Route path="/broker-categories/:slug"><S><BrokerCategoryArchive /></S></Route>
      <Route path="/broker/:slug"><S><BrokerReview /></S></Route>
      <Route path="/prop-firms/:category?"><S><PropFirms /></S></Route>
      <Route path="/prop-firm/:slug"><S><PropFirmReview /></S></Route>
      <Route path="/signals"><S><SignalsLanding /></S></Route>
      <Route path="/subscribe"><S><Subscribe /></S></Route>
      <Route path="/success"><S><Success /></S></Route>
      <Route path="/free-access"><S><FreeAccess /></S></Route>
      <Route path="/dashboard"><S><Dashboard /></S></Route>
      <Route path="/terms"><S><TermsConditions /></S></Route>
      <Route path="/compare/broker/:slug"><S><ComparisonPage /></S></Route>
      <Route path="/compare/prop-firm/:slug"><S><ComparisonPage /></S></Route>
      <Route path="/compare/broker"><S><ComparisonBrokerHub /></S></Route>
      <Route path="/compare/prop-firm"><S><ComparisonPropFirmHub /></S></Route>
      <Route path="/compare"><S><Compare /></S></Route>
      <Route path="/top-cfd-brokers"><S><BrokerCategoryArchive /></S></Route>
      <Route path="/top-3-cfd-brokers"><S><BrokerCategoryArchive /></S></Route>
      <Route path="/best-verified-propfirms"><S><PropFirmCategoryArchive /></S></Route>
      <Route path="/:category/:slug"><S><Article /></S></Route>
      <Route path="/:slug"><S><CategoryArchive /></S></Route>
      <Route path="/"><S><Home /></S></Route>
      <Route><S><NotFound /></S></Route>
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Remove SSR-injected crawler content once React has hydrated — prevents
    // the content appearing twice (once in #ssr-content, once from React render)
    const ssrEl = document.getElementById('ssr-content');
    if (ssrEl) ssrEl.remove();

    captureUTMParams();
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
              <CookieConsent />
            </TooltipProvider>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
