import { SiX, SiFacebook, SiLinkedin, SiYoutube } from "react-icons/si";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-2xl font-bold text-foreground">EntryLab</p>
            <p className="text-sm text-muted-foreground">Unbiased Reviews Since 2020</p>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-twitter">
              <SiX className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-facebook">
              <SiFacebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-linkedin">
              <SiLinkedin className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-youtube">
              <SiYoutube className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EntryLab. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
