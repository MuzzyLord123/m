import { type ReactNode } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/**
 * Detail views open in a side drawer, not a modal — the list stays in
 * sight and Esc returns to it. Focus is trapped by the underlying Radix
 * dialog. Modals remain only for focused decisions (see ConfirmDialog).
 */
export function DetailDrawer({
  open,
  onOpenChange,
  kicker,
  title,
  description,
  footer,
  children,
  wide = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'flex w-full flex-col gap-0 border-l border-border/60 bg-card p-0 sm:max-w-md',
          wide && 'sm:max-w-2xl',
        )}
      >
        <header className="border-b border-border/60 px-5 py-4">
          {kicker && (
            <span className="mb-1 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {kicker}
            </span>
          )}
          <SheetTitle className="text-[15px] font-semibold tracking-[-0.01em]">
            {title}
          </SheetTitle>
          {description ? (
            <SheetDescription className="mt-0.5 text-[12.5px] text-muted-foreground">
              {description}
            </SheetDescription>
          ) : (
            <SheetDescription className="sr-only">Detail view</SheetDescription>
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-border/60 px-5 py-3">
            {footer}
          </footer>
        )}
      </SheetContent>
    </Sheet>
  );
}
