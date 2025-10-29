import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { List } from "lucide-react";

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
    const headingElements = doc.querySelectorAll("h2, h3, h4");
    
    const items: TOCItem[] = Array.from(headingElements).map((heading, index) => {
      const text = heading.textContent || "";
      const id = `section-${index}`;
      heading.id = id;
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

    const actualHeadings = document.querySelectorAll("h2[id^='section-'], h3[id^='section-'], h4[id^='section-']");
    actualHeadings.forEach((heading) => observer.observe(heading));

    return () => {
      actualHeadings.forEach((heading) => observer.unobserve(heading));
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
      <div className="flex items-center gap-2 mb-3">
        <List className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">
          Table of Contents
        </h3>
      </div>
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
