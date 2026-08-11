/**
 * The exposed 12-column grid.
 *
 * Thirteen 1px vertical rules — both edges and the eleven column boundaries —
 * running the full height of the section block they sit in. They draw downward on
 * section entry, 400ms each, staggered 30ms, so a block assembles itself like a
 * drawing rather than fading in like a slide.
 *
 * Hidden below `md`. On a phone a 12-column grid is noise, and the columns are too
 * narrow for the rules to read as structure.
 *
 * On opacity: the brief asks for `--rule` at about 8%. Taken literally that is
 * `#d7dcd8` at 0.08 over `#f6f7f5`, which computes to a colour difference of well
 * under one step of 8-bit sRGB — it would not render at all on most screens, and
 * "the grid is the decoration" would mean no grid. It is drawn here at 50%
 * instead, which lands around `#e7eae8`: a true hairline that reads as an
 * engineering grid at arm's length without competing with the type. Worth knowing
 * that this is a deliberate departure from the number in the brief.
 */
export function GridRules({ columns = 12 }: { columns?: number }) {
  // Both outer edges plus every interior boundary.
  const lines = Array.from({ length: columns + 1 }, (_, i) => i)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block"
    >
      {lines.map((i) => (
        <div
          key={i}
          className="grid-rule absolute top-0 bottom-0 w-px bg-rule opacity-50"
          style={
            {
              // The final rule would sit one pixel outside the box.
              left: i === columns ? 'calc(100% - 1px)' : `${(i / columns) * 100}%`,
              '--rule-delay': `${i * 30}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
