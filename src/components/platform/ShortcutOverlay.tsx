import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

/**
 * The `?` overlay: every global key, honestly listed — nothing here that
 * isn't actually bound.
 */
const SHORTCUTS: { keys: string[]; does: string }[] = [
  { keys: ['⌘', 'K'], does: 'Open the command palette' },
  { keys: ['?'], does: 'Show this overlay' },
  { keys: ['Esc'], does: 'Close dialogs and drawers' },
  { keys: ['Tab'], does: 'Move through controls; every control shows a focus ring' },
];

export function ShortcutOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-xl border-border/60 bg-card p-0">
        <header className="border-b border-border/60 px-5 py-4">
          <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">
            Keyboard
          </DialogTitle>
          <DialogDescription className="sr-only">Keyboard shortcuts</DialogDescription>
        </header>
        <ul className="px-5 py-3">
          {SHORTCUTS.map((s) => (
            <li
              key={s.does}
              className="flex items-center justify-between gap-6 border-t border-border/60 py-2.5 first:border-t-0"
            >
              <span className="text-[13px] text-ink-2">{s.does}</span>
              <span className="flex shrink-0 items-center gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded-md border border-border bg-sunken px-1.5 py-0.5 font-mono text-[10.5px] text-ink-2"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
