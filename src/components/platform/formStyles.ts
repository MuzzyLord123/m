/**
 * The elite field recipe, shared. The auth pages established it; every
 * platform form uses these exact classes instead of re-inventing inputs.
 * Labels always visible, validation inline, errors say how to fix.
 */
export const FIELD =
  'h-10 rounded-xl border-border/60 bg-foreground/[0.03] text-[14px] shadow-none transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-foreground/[0.05]';

export const FIELD_LABEL =
  'font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground';

export const FIELD_ERROR = 'mt-1 text-xs text-risk';

export const FIELD_HELP = 'mt-1 text-xs text-muted-foreground';

/** Selectable chip states (filters, account types, tags). */
export const CHIP_ON = 'border-primary bg-primary text-primary-foreground';
export const CHIP_OFF = 'border-border/60 text-foreground hover:border-primary/50';
