/**
 * Signature interaction 7 — scroll paint level.
 *
 * A 3px band of accent laid across the top of the viewport as the page is read.
 * Driven by a CSS scroll-driven animation (`animation-timeline: scroll()`), so
 * it costs no JavaScript at all: no component state, no scroll listener, and
 * nothing on the main thread while scrolling. See `.scroll-level` in
 * globals.css. A server component — it ships zero bytes of JS.
 */
export function ScrollPaintLevel() {
  return <div aria-hidden="true" className="scroll-level fixed inset-x-0 top-0 z-[70] h-[3px] bg-accent" />;
}
