/**
 * The success mark: a disc of colour laid down, then a tick brushed through it
 * in one stroke. Runs once, on arrival, from CSS keyframes — a server component
 * with no JavaScript behind it. See `.paint-tick-*` in globals.css.
 */
export function PaintTick() {
  return (
    <svg viewBox="0 0 64 64" className="size-16" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="var(--color-accent)" className="paint-tick-disc" />
      <path
        pathLength={1}
        d="M19 33.5 28 42l17-19"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="paint-tick-mark"
      />
    </svg>
  );
}
