import { SiX, SiFacebook, SiLinkedin, SiYoutube } from "react-icons/si";
import { Link } from "wouter";
import logoImage from "@assets/logo.png";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <img src={logoImage} alt="EntryLab" className="h-20 w-auto" />
            <p className="text-sm text-muted-foreground">Unbiased Reviews Since 2020</p>
          </div>
          
          {/* Navigation Links */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h3 className="text-sm font-semibold text-foreground">Browse All</h3>
            <Link href="/brokers" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-all-brokers">
              All Brokers
            </Link>
            <Link href="/prop-firms" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-all-prop-firms">
              All Prop Firms
            </Link>
            <Link href="/news" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-news">
              Latest News
            </Link>
          </div>
          
          {/* Social Links */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h3 className="text-sm font-semibold text-foreground">Follow Us</h3>
            <div className="flex items-center gap-6">
              <a href="#" aria-label="Follow us on X (Twitter)" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-twitter">
                <SiX className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Follow us on Facebook" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-facebook">
                <SiFacebook className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Follow us on LinkedIn" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-linkedin">
                <SiLinkedin className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Follow us on YouTube" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-youtube">
                <SiYoutube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EntryLab. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
