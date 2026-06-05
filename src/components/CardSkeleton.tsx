import { cn } from '../lib/utils';

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export const CardSkeleton = ({ count = 6, className }: CardSkeletonProps) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-700/50 animate-pulse"
        >
          <div className="aspect-[16/9] bg-zinc-700" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-zinc-700 rounded w-3/4" />
            <div className="h-4 bg-zinc-700 rounded w-full" />
            <div className="h-4 bg-zinc-700 rounded w-2/3" />
            <div className="flex gap-2">
              <div className="h-5 bg-zinc-700 rounded w-16" />
              <div className="h-5 bg-zinc-700 rounded w-16" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-4 bg-zinc-700 rounded w-12" />
              <div className="flex gap-4">
                <div className="h-3 bg-zinc-700 rounded w-16" />
                <div className="h-3 bg-zinc-700 rounded w-12" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
