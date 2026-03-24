import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f6f9f6 0%, #f8faf8 50%, #f5f8f5 100%)" }}>
      <SEO
        title="Page Not Found | EntryLab"
        description="The page you're looking for doesn't exist or has been moved. Browse our forex broker reviews, prop firm evaluations, and trading news."
        url="https://entrylab.io/404"
        noindex
      />
      <Navigation />
      <div className="flex-1 flex items-center justify-center px-4">
        <div
          className="w-full max-w-md p-8 rounded-2xl text-center"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.70)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertCircle className="h-8 w-8" style={{ color: "#dc2626" }} />
            <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>404 — Page Not Found</h1>
          </div>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/">
            <Button style={{ background: "#2bb32a", color: "#fff" }} data-testid="button-go-home">
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
