/**
 * The data strip.
 *
 * A full-width band carrying three or four figures in display-size numerals,
 * with a label under each and rules between. On entry the rule draws across and
 * the figure appears in place.
 *
 * There are no counters. A number that animates from zero is a number nobody
 * has checked, and on a site whose whole argument is that its facts are
 * checkable it would be the wrong sort of clever. Every figure here is either
 * confirmed or it is not on the strip.
 *
 * On the markup: a description list, and a strict one. `dl` will only accept
 * `dt`, `dd` and a single `div` wrapping each group — so the drawn rule is a
 * pseudo-element on the group rather than a fifth element inside it, and the
 * visual order (figure, then label, then note) is set with `order` rather than
 * by putting the `dd` before its `dt`. Both are in `.data-cell` in globals.css.
 */

export type Figure = {
  /** Short. Set in display type, so it has to survive being 4rem tall. */
  figure: string;
  label: string;
  note?: string;
};

export function DataStrip({
  figures,
  ground = 'graphite',
}: {
  figures: readonly Figure[];
  ground?: 'paper' | 'mist' | 'graphite' | 'steel';
}) {
  return (
    <section
      data-ground={ground}
      className="py-[var(--spacing-band)]"
      aria-label="Company facts"
    >
      <div className="shell">
        <dl className="grid grid-cols-1 gap-x-[var(--spacing-gutter)] gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {figures.map((f, i) => (
            <div
              key={f.label}
              data-reveal
              className="data-cell flex flex-col"
              style={{ '--stagger': `${i * 90}ms` } as React.CSSProperties}
            >
              <dt className="t-label order-2 mt-4">{f.label}</dt>
              <dd className="t-figure order-1 mt-5 text-[var(--ink)]">{f.figure}</dd>
              {f.note ? (
                <dd className="order-3 mt-3 max-w-[34ch] text-[15px] leading-[1.5] text-[var(--muted)]">
                  {f.note}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
