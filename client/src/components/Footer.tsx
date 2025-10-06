import { SiX, SiFacebook, SiLinkedin, SiYoutube } from "react-icons/si";

export function Footer() {
  const footerSections = {
    About: ["Our Mission", "Team", "Contact Us", "Advertise"],
    Categories: ["Forex News", "Broker Reviews", "Prop Firms", "Market Analysis", "Education"],
    Resources: ["Trading Guides", "Glossary", "FAQ", "Tools"],
    Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Disclaimer"],
  };

  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {Object.entries(footerSections).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-foreground mb-4" data-testid={`text-footer-${title.toLowerCase()}`}>
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`link-${link.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
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
