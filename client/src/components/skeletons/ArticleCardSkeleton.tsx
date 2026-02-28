import { Skeleton } from "@/components/ui/skeleton";

export function ArticleCardSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#ffffff", border: "1px solid #e8edea", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
      data-testid="skeleton-article-card"
    >
      <Skeleton className="w-full h-44" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex items-center gap-3 pt-2 mt-2" style={{ borderTop: "1px solid #f0f2f1" }}>
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
    </div>
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
