import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Designed empty, error and loading states. An empty state orients and
 * offers at most one action; an error state says what happened and how to
 * recover; loading is a skeleton that matches the final layout so nothing
 * shifts when data lands.
 */

export function EmptyState({
  title,
  body,
  action,
  compact = false,
  className,
}: {
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 text-center',
        compact ? 'py-8' : 'py-16',
        className,
      )}
    >
      <span aria-hidden className="mb-4 block h-px w-8 bg-primary" />
      <p
        className={cn(
          'font-display font-semibold tracking-[-0.02em] text-foreground',
          compact ? 'text-[15px]' : 'text-lg',
        )}
      >
        {title}
      </p>
      {body && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      )}
      {action && (
        <Button size="sm" className="mt-4 h-8 rounded-lg px-3 text-xs" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "This didn't load",
  body = 'Check your connection and try again. If it keeps happening, message the studio.',
  onRetry,
  compact = false,
  className,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center px-6 text-center',
        compact ? 'py-8' : 'py-16',
        className,
      )}
    >
      <span aria-hidden className="mb-4 block h-px w-8 bg-risk" />
      <p className="text-[15px] font-[550] text-foreground">{title}</p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          className="mt-4 h-8 rounded-lg px-3 text-xs"
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </div>
  );
}

/* ── Skeletons: layout-matched, zero shift ─────────────────────────── */

function Bone({ className }: { className?: string }) {
  return <span className={cn('block animate-pulse rounded bg-foreground/[0.06]', className)} />;
}

export function SkeletonLedger({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={className} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0"
        >
          <Bone className="h-1.5 w-1.5 rounded-full" />
          <span className="min-w-0 flex-1 space-y-1.5">
            <Bone className="h-3 w-[45%]" />
            <Bone className="h-2.5 w-[28%]" />
          </span>
          <Bone className="h-2.5 w-14" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({
  cols = 4,
  rows = 6,
  className,
}: {
  cols?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={className} aria-hidden>
      <div className="flex gap-4 border-b border-border/60 bg-sunken px-3 py-2.5">
        {Array.from({ length: cols }, (_, i) => (
          <Bone key={i} className="h-2.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-4 border-b border-border/60 px-3 py-3">
          {Array.from({ length: cols }, (_, c) => (
            <Bone key={c} className={cn('h-3 flex-1', c === 0 && 'max-w-[40%]')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <Bone className={cn('h-24 w-full', className)} />;
}

export function SkeletonForm({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn('space-y-4', className)} aria-hidden>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <Bone className="h-2.5 w-20" />
          <Bone className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
