import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <Skeleton className="h-4 w-[40%]" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
