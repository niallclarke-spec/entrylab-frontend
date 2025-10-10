import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function BrokerCardSkeleton() {
  return (
    <Card className="overflow-hidden hover-elevate" data-testid="skeleton-broker-card">
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          <Skeleton className="w-16 h-16 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </Card>
  );
}

export function BrokerCardSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <BrokerCardSkeleton key={i} />
      ))}
    </>
  );
}
