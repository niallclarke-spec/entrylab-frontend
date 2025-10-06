import { Clock, User } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  return (
    <Card className="hover-elevate transition-all h-full flex flex-col" data-testid={`card-article-${title.substring(0, 20)}`}>
      <a href={link} target="_blank" rel="noopener noreferrer" className="flex flex-col h-full">
        {imageUrl && (
          <div className="w-full h-48 overflow-hidden rounded-t-md bg-muted">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              data-testid="img-article-thumbnail"
            />
          </div>
        )}
        <CardHeader className="gap-2 pb-4">
          <Badge variant="secondary" className="w-fit" data-testid="badge-category">
            {category}
          </Badge>
          <h3 className="text-xl font-semibold text-foreground leading-tight line-clamp-2" data-testid="text-article-title">
            {stripHtml(title)}
          </h3>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-muted-foreground line-clamp-3" data-testid="text-article-excerpt">
            {stripHtml(excerpt)}
          </p>
        </CardContent>
        <CardFooter className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-2" data-testid="text-author">
            <User className="h-4 w-4" />
            <span>{author}</span>
          </div>
          <div className="flex items-center gap-2" data-testid="text-date">
            <Clock className="h-4 w-4" />
            <span>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        </CardFooter>
      </a>
    </Card>
  );
}
