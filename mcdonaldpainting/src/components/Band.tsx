/**
 * A band is a full-width section with a declared ground.
 *
 * `paper` and `mist` carry most of the site; `graphite` and `steel` are navy
 * bands used for emphasis, roughly one in three. That ratio is the difference
 * between a contractor's website and a design studio's: light grounds read as
 * a company with a reception desk, and an all-dark site reads as a portfolio.
 *
 * The change between grounds is a hard cut — no fade, no gradient. Two colours
 * meeting on a straight line is the separation system, alongside rules. There
 * are no cards, no shadows and no rounded corners doing the job instead.
 */
export function Band({
  ground,
  id,
  className = '',
  children,
  label,
}: {
  ground: 'paper' | 'mist' | 'graphite' | 'steel' | 'concrete';
  id?: string;
  className?: string;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <section
      id={id}
      data-ground={ground}
      aria-label={label}
      className={`py-[var(--spacing-band)] ${className}`}
    >
      <div className="shell">{children}</div>
    </section>
  );
}

/**
 * A section head: an optional numbered label, a display-type title and an
 * optional standfirst in the 8 of an 8/4 split.
 */
export function SectionHead({
  number,
  title,
  standfirst,
  children,
}: {
  number?: string;
  title: string;
  standfirst?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid12 gap-y-6">
      <div className="col-span-12 lg:col-span-8">
        {number ? <p className="t-label mb-5">{number}</p> : null}
        <h2 className="t-section" data-reveal>
          <span className="reveal-type">{title}</span>
        </h2>
        {standfirst ? (
          <p className="t-lead mt-6 max-w-[60ch] text-[var(--muted)]">{standfirst}</p>
        ) : null}
      </div>
      {children ? (
        <div className="col-span-12 lg:col-span-4 lg:col-start-9 lg:self-end">{children}</div>
      ) : null}
    </div>
  );
}

/** A numbered item: 01 / title / body, in an 8/4 or 3/9 split. */
export function NumberedItem({
  number,
  title,
  children,
  headingLevel = 'h3',
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  /**
   * h3 under a section heading, h2 where these items are the page's own
   * top-level structure — as on /privacy, which has no section heading above
   * them. Jumping from h1 straight to h3 is a real navigation problem for
   * anyone moving through the page by heading.
   */
  headingLevel?: 'h2' | 'h3';
}) {
  const Heading = headingLevel;
  return (
    <div className="grid12 gap-y-4 border-t border-[var(--rule)] py-8" data-reveal>
      <div className="col-span-12 lg:col-span-3">
        <p className="t-figure text-[clamp(1.5rem,2.4vw,2.25rem)]">{number}</p>
        <Heading className="t-sub mt-3">{title}</Heading>
      </div>
      <div className="col-span-12 lg:col-span-8 lg:col-start-5">{children}</div>
    </div>
  );
}
