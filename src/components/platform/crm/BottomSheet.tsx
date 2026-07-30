import { type ReactNode } from 'react';
import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';

/**
 * The mobile-first sheet: slides from the bottom with a grab handle on
 * phones; the same API renders a centred modal feel on desktop via
 * max-width. Built on vaul (already a dependency), which handles focus
 * trapping and drag-to-dismiss.
 */
export function BottomSheet({
  open,
  onOpenChange,
  kicker,
  title,
  children,
  footer,
  tall = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kicker?: string;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  tall?: boolean;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-lg flex-col rounded-t-2xl border border-b-0 border-border/60 bg-card outline-none',
            tall ? 'max-h-[92dvh]' : 'max-h-[80dvh]',
          )}
        >
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-border" />
          <header className="border-b border-border/60 px-5 pb-3 pt-3">
            {kicker && (
              <span className="block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {kicker}
              </span>
            )}
            <Drawer.Title className="mt-0.5 text-[15px] font-semibold tracking-[-0.01em]">
              {title}
            </Drawer.Title>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            {children}
          </div>
          {footer && (
            <footer className="border-t border-border/60 px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              {footer}
            </footer>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/** Tag chips over an existing array field (e.g. relationship_type). */
export function TagChips({
  tags,
  active = [],
  onToggle,
  className,
}: {
  tags: string[];
  active?: string[];
  onToggle?: (tag: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {tags.map((t) => {
        const on = active.includes(t);
        return (
          <button
            key={t}
            type="button"
            disabled={!onToggle}
            onClick={onToggle ? () => onToggle(t) : undefined}
            className={cn(
              'h-6 rounded-md border px-2 text-[11px] capitalize transition-colors duration-150',
              on
                ? 'border-primary/50 bg-primary/[0.08] text-primary'
                : 'border-border/60 text-muted-foreground',
              onToggle && !on && 'hover:border-primary/40 hover:text-foreground',
            )}
          >
            {t.replace(/[_-]+/g, ' ')}
          </button>
        );
      })}
    </div>
  );
}
