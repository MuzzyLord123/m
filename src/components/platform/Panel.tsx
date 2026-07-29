import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The platform's workhorse surface: hairline border, raised tone, quiet
 * radius. Elevation is expressed by surface tone, never by shadow.
 */
export function Panel({
  children,
  className,
  as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article' | 'aside';
}) {
  return (
    <Tag className={cn('rounded-[10px] border border-border/60 bg-card', className)}>
      {children}
    </Tag>
  );
}

/** Mono kicker + optional actions. One primary action per view, maximum. */
export function PanelHeader({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex min-h-[44px] items-center gap-3 border-b border-border/60 px-4 py-2',
        className,
      )}
    >
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </header>
  );
}

/**
 * A ledger row: leading slot (status dot, avatar), title + meta, trailing
 * value. Interactive when `onClick` is provided — full keyboard support
 * comes from rendering a real button.
 */
export function PanelRow({
  leading,
  title,
  meta,
  trailing,
  onClick,
  className,
}: {
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const inner = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-[450] text-foreground">{title}</span>
        {meta && (
          <span className="block truncate text-[11.5px] text-muted-foreground">{meta}</span>
        )}
      </span>
      {trailing}
    </>
  );
  const base = cn(
    'flex w-full items-center gap-3 border-t border-border/60 px-4 py-2.5 text-left first:border-t-0',
    onClick &&
      'transition-colors duration-150 hover:bg-foreground/[0.025] focus-visible:bg-foreground/[0.03]',
    className,
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={base}>
        {inner}
      </button>
    );
  }
  return <div className={base}>{inner}</div>;
}

/** Page-level section heading for ledgers that sit on the page wash. */
export function SectionHeader({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 pb-2.5', className)}>
      <h2 className="text-[13.5px] font-[550] tracking-[-0.01em] text-foreground">{title}</h2>
      {children}
    </div>
  );
}
