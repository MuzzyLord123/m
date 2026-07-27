import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card p-6 space-y-4 animate-pulse", className)}>
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-lg bg-muted" />
        <div className="h-6 w-16 rounded-full bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-8 w-24 rounded bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5, className }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card animate-pulse">
          <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
          <div className="h-6 w-16 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }: SkeletonProps & { rows?: number; cols?: number }) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card overflow-hidden animate-pulse", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border/50 bg-muted/30">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 h-4 rounded bg-muted" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 p-4 border-b border-border/50 last:border-b-0">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className={cn(
                "flex-1 h-4 rounded bg-muted",
                colIndex === 0 && "w-1/4",
                colIndex === cols - 1 && "w-20"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4, className }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonPage({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-6 animate-pulse", className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      
      {/* Stats Grid */}
      <SkeletonStats />
      
      {/* Content Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
          <div className="h-6 w-32 rounded bg-muted" />
          <SkeletonList count={3} className="!space-y-2" />
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
          <div className="h-6 w-32 rounded bg-muted" />
          <SkeletonList count={3} className="!space-y-2" />
        </div>
      </div>
    </div>
  );
}

// Convenience export for flexible usage
interface SkeletonLoadingProps extends SkeletonProps {
  variant?: 'page' | 'list' | 'table' | 'stats' | 'cards' | 'detail';
  count?: number;
  rows?: number;
  cols?: number;
}

export function SkeletonLoading({ 
  variant = 'page', 
  count = 5, 
  rows = 5, 
  cols = 4, 
  className 
}: SkeletonLoadingProps) {
  switch (variant) {
    case 'list':
      return <SkeletonList count={count} className={className} />;
    case 'table':
      return <SkeletonTable rows={rows} cols={cols} className={className} />;
    case 'stats':
      return <SkeletonStats count={count} className={className} />;
    case 'cards':
      return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    case 'detail':
      return (
        <div className={cn("space-y-6 animate-pulse", className)}>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="h-8 w-64 rounded bg-muted" />
              <div className="h-4 w-40 rounded bg-muted" />
            </div>
          </div>
          <div className="h-12 w-full rounded-lg bg-muted" />
          <SkeletonStats />
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border/50 bg-card p-6 h-64" />
            <div className="rounded-xl border border-border/50 bg-card p-6 h-64" />
          </div>
        </div>
      );
    case 'page':
    default:
      return <SkeletonPage className={className} />;
  }
}
