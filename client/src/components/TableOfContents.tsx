import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface TOCItem {
  id: string;
  text: string;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const h2Elements = doc.querySelectorAll("h2");
    
    const items: TOCItem[] = Array.from(h2Elements).map((h2, index) => {
      const text = h2.textContent || "";
      const id = `section-${index}`;
      h2.id = id;
      return { id, text };
    });
    
    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -80% 0px",
        threshold: 0
      }
    );

    const actualH2s = document.querySelectorAll("h2[id^='section-']");
    actualH2s.forEach((h2) => observer.observe(h2));

    return () => {
      actualH2s.forEach((h2) => observer.unobserve(h2));
    };
  }, [content]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  if (headings.length === 0) return null;

  return (
    <Card className="p-4 bg-card/50 border-border/50">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        On This Page
      </h3>
      <nav className="space-y-1">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => scrollToSection(heading.id)}
            className={`w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
              activeId === heading.id
                ? "text-primary font-semibold bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            data-testid={`toc-${heading.id}`}
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </Card>
  );
}
