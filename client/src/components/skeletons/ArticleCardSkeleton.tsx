import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ArticleCardSkeleton() {
  return (
    <Card className="overflow-hidden hover-elevate" data-testid="skeleton-article-card">
      <div className="relative">
        <Skeleton className="w-full h-48" />
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </Card>
  );
}

export function ArticleCardSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </>
  );
}
