import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { HelmetProvider } from "react-helmet-async";
import Home from "@/pages/Home";
import Article from "@/pages/Article";
import Archive from "@/pages/Archive";
import Brokers from "@/pages/Brokers";
import PropFirms from "@/pages/PropFirms";
import BrokerReview from "@/pages/BrokerReview";
import PropFirmReview from "@/pages/PropFirmReview";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/article/:slug" component={Article} />
      <Route path="/archive" component={Archive} />
      <Route path="/brokers" component={Brokers} />
      <Route path="/broker/:slug" component={BrokerReview} />
      <Route path="/prop-firms/:category?" component={PropFirms} />
      <Route path="/prop-firm/:slug" component={PropFirmReview} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
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
  );
}

export default App;
