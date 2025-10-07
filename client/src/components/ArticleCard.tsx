import { Clock, User, BookOpen } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface ArticleCardProps {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  link: string;
  imageUrl?: string;
}

export function ArticleCard({ title, excerpt, author, date, category, link, imageUrl }: ArticleCardProps) {
  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  // Calculate reading time (average 200 words per minute)
  const calculateReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return minutes;
  };

  const cleanExcerpt = stripHtml(excerpt);
  const readingTime = calculateReadingTime(cleanExcerpt);

  return (
    <Card className="hover-elevate active-elevate-2 transition-all h-full flex flex-col group" data-testid={`card-article-${title.substring(0, 20)}`}>
      <Link href={link} className="flex flex-col h-full">
        {imageUrl && (
          <div className="w-full h-40 overflow-hidden rounded-t-md bg-muted">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              data-testid="img-article-thumbnail"
            />
          </div>
        )}
        <CardHeader className="gap-2 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="w-fit" data-testid="badge-category">
              {category}
            </Badge>
            <Badge variant="outline" className="w-fit gap-1 border-primary/30 text-primary" data-testid="badge-reading-time">
              <BookOpen className="h-3 w-3" />
              {readingTime} min read
            </Badge>
          </div>
          <h3 className="text-xl font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors" data-testid="text-article-title">
            {stripHtml(title)}
          </h3>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-article-excerpt">
            {cleanExcerpt}
          </p>
        </CardContent>
        <CardFooter className="flex items-center gap-3 text-xs text-muted-foreground pt-3 border-t bg-muted/20">
          <div className="flex items-center gap-1.5" data-testid="text-author">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{author}</span>
          </div>
          <div className="flex items-center gap-1.5" data-testid="text-date">
            <Clock className="h-3.5 w-3.5" />
            <span>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
