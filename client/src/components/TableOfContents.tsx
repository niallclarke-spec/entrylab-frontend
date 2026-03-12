import { useEffect, useState, useRef } from "react";
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
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Extract H2 headings from the processed content
    // IDs are already added by processArticleContent in transforms.ts
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const headingElements = doc.querySelectorAll("h2[id^='section-']");
    
    const items: TOCItem[] = Array.from(headingElements).map((heading) => ({
      id: heading.id,
      text: heading.textContent || ""
    }));
    
    setHeadings(items);

    // Set up intersection observer for scroll tracking
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
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

    // Wait a tick for content to render, then observe headings
    setTimeout(() => {
      const renderedHeadings = document.querySelectorAll("h2[id^='section-']");
      renderedHeadings.forEach((heading) => observerRef.current?.observe(heading));
    }, 0);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
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
    <Card className="p-4" style={{ background: "#ffffff", border: "1px solid #e8edea" }}>
      <div className="flex items-center gap-2 mb-3">
        <List className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold" style={{ color: "#111827" }}>
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
                : "hover:bg-black/5"
            }`}
            style={activeId !== heading.id ? { color: "#6b7280" } : undefined}
            data-testid={`toc-${heading.id}`}
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </Card>
  );
}
