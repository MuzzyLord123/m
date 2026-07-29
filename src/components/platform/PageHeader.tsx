import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Two headers, one system. GreetingHeader is a home screen's single
 * display moment; PageHeader is every other screen's quiet top line.
 */
export function GreetingHeader({
  salutation,
  line,
  meta,
  className,
}: {
  salutation: string;
  /** The one contextual line from composePortalGreeting / composeOfficeBriefing. */
  line?: string;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        <h1 className="font-display text-[23px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[27px]">
          {salutation}
        </h1>
        {/* Reserved height: the line renders with the data it depends on, nothing shifts. */}
        <p className="mt-1 min-h-[21px] text-sm text-ink-2">{line ?? ''}</p>
      </div>
      {meta && <div className="flex shrink-0 gap-4 sm:flex-col sm:text-right">{meta}</div>}
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
  className,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {kicker && (
          <span className="mb-1 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {kicker}
          </span>
        )}
        <h1 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">{title}</h1>
        {description && (
          <p className="mt-0.5 max-w-xl text-[13px] text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
