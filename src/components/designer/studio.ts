/**
 * The Workshop studio vocabulary.
 *
 * Every surface in the builder is assembled from these, so a row in the
 * component library and a row in the layers tree are the same object at the
 * same height with the same hover. That consistency is the whole difference
 * between a tool that feels made and one that feels assembled: the previous
 * version had each panel inventing its own greys, its own radii and its own
 * blue, and no amount of polish on any single panel could fix that.
 *
 * Tokens live in index.css under `.studio`. Nothing here invents a colour.
 */

/* ── planes ───────────────────────────────────────────────── */
export const PANEL = 'bg-[hsl(var(--studio-panel))]';
export const RAISED = 'bg-[hsl(var(--studio-raised))]';
export const SUNKEN = 'bg-[hsl(var(--studio-sunken))]';

/* ── ink ──────────────────────────────────────────────────── */
export const INK = 'text-[hsl(var(--studio-ink))]';
export const INK_2 = 'text-[hsl(var(--studio-ink-2))]';
export const INK_3 = 'text-[hsl(var(--studio-ink-3))]';

/* ── hairlines ────────────────────────────────────────────── */
export const HAIR = 'border-[hsl(var(--studio-line))]';
export const HAIR_STRONG = 'border-[hsl(var(--studio-line-strong))]';

/**
 * A row. The single most repeated object in the builder - component list,
 * layers tree, pages list, asset list. 30px, one hover, no card chrome.
 */
export const ROW = [
  'group flex w-full items-center gap-2.5 rounded-[5px] px-2 text-left',
  'h-[30px] text-[12.5px] leading-none',
  'text-[hsl(var(--studio-ink-2))]',
  'transition-colors duration-100',
  'hover:bg-[hsl(var(--studio-hover))] hover:text-[hsl(var(--studio-ink))]',
].join(' ');

export const ROW_ON = 'bg-[hsl(var(--studio-hover))] text-[hsl(var(--studio-ink))]';

/**
 * A glyph beside a row. Deliberately monochrome: the old build gave every
 * component category its own hue, which turned the library into a rainbow
 * and told the eye nothing - twelve colours cannot be a hierarchy.
 */
export const GLYPH = 'h-3.5 w-3.5 shrink-0 text-[hsl(var(--studio-ink-3))] group-hover:text-[hsl(var(--studio-ink-2))]';

/* ── controls ─────────────────────────────────────────────── */
export const BTN = [
  'inline-flex items-center justify-center gap-1.5 rounded-[6px]',
  'h-7 px-2.5 text-[12px] font-medium leading-none',
  'text-[hsl(var(--studio-ink-2))]',
  'transition-colors duration-100',
  'hover:bg-[hsl(var(--studio-hover))] hover:text-[hsl(var(--studio-ink))]',
  'disabled:pointer-events-none disabled:opacity-40',
].join(' ');

export const BTN_ON = 'bg-[hsl(var(--studio-hover))] text-[hsl(var(--studio-ink))]';

/** The one filled action per surface. There should rarely be two on screen. */
export const BTN_PRIMARY = [
  'inline-flex items-center justify-center gap-1.5 rounded-[6px]',
  'h-7 px-3 text-[12px] font-semibold leading-none',
  'bg-[hsl(var(--studio-accent))] text-[hsl(var(--studio-accent-ink))]',
  'transition-[filter] duration-100 hover:brightness-110',
  'disabled:pointer-events-none disabled:opacity-40',
].join(' ');

export const ICON_BTN = [
  'inline-flex items-center justify-center rounded-[6px]',
  'h-7 w-7 shrink-0',
  'text-[hsl(var(--studio-ink-3))]',
  'transition-colors duration-100',
  'hover:bg-[hsl(var(--studio-hover))] hover:text-[hsl(var(--studio-ink))]',
  'disabled:pointer-events-none disabled:opacity-40',
].join(' ');

export const INPUT = [
  'h-7 w-full rounded-[6px] px-2 text-[12.5px]',
  'bg-[hsl(var(--studio-sunken))] text-[hsl(var(--studio-ink))]',
  'border border-[hsl(var(--studio-line))]',
  'placeholder:text-[hsl(var(--studio-ink-3))]',
  'focus:border-[hsl(var(--studio-accent)/0.6)] focus:outline-none',
].join(' ');

/**
 * A segmented control. Used for viewport, for panel tabs, for anything with
 * two to four exclusive choices - so the builder only ever teaches it once.
 */
export const SEG_WRAP = 'inline-flex items-center gap-0.5 rounded-[7px] bg-[hsl(var(--studio-sunken))] p-0.5';
export const SEG = [
  'inline-flex items-center justify-center gap-1.5 rounded-[5px]',
  'h-6 px-2.5 text-[11.5px] font-medium leading-none',
  'text-[hsl(var(--studio-ink-3))]',
  'transition-colors duration-100',
  'hover:text-[hsl(var(--studio-ink-2))]',
].join(' ');
export const SEG_ON = 'bg-[hsl(var(--studio-raised))] text-[hsl(var(--studio-ink))] shadow-[0_1px_0_hsl(0_0%_0%/0.4)]';

/** Section heading inside a panel. */
export const GROUP_HEAD = [
  'flex w-full items-center gap-1.5 px-2 py-1.5',
  'text-[10px] font-medium uppercase tracking-[0.09em]',
  'text-[hsl(var(--studio-ink-3))]',
  'transition-colors duration-100 hover:text-[hsl(var(--studio-ink-2))]',
].join(' ');

/** A count or badge sitting at the end of a row. Never coloured for decoration. */
export const COUNT = 'ml-auto shrink-0 text-[10.5px] tabular-nums text-[hsl(var(--studio-ink-3))]';

/** Panel chrome: the bar at the top of a docked panel. */
export const PANEL_BAR = [
  'flex h-9 shrink-0 items-center gap-2 px-2.5',
  'border-b border-[hsl(var(--studio-line))]',
].join(' ');

/* ── state hues, for meaning only ─────────────────────────── */
export const OK = 'text-[hsl(var(--studio-ok))]';
export const WARN = 'text-[hsl(var(--studio-warn))]';
export const RISK = 'text-[hsl(var(--studio-risk))]';
export const SELECT = 'text-[hsl(var(--studio-select))]';
