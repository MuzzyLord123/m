import type { ReactNode } from 'react'
import { Drawn } from './Drawn'
import { BrushDivider } from './icons'

/**
 * A band of the page.
 *
 * This replaces the numbered `Section` from the previous build. The difference is
 * the point: that one printed `03` in a swatch chip against a 12-column hairline
 * grid, which read as a specification document. A customer looking for a
 * decorator does not need the parts of the page numbered — they need a heading
 * they can scan.
 *
 * So: a small gold eyebrow, a heading, an optional standfirst, and the content.
 * Centred where the band is a lead-in, left-aligned where it carries body copy.
 */
export function Band({
  id,
  /** Small gold label above the heading. Four words at most. */
  eyebrow,
  title,
  standfirst,
  children,
  /** A recessed background, to separate this band from its neighbours. */
  tone = 'plain',
  /** A brush-stroke rule above the band. */
  divider = false,
  align = 'left',
  className,
}: {
  id?: string
  eyebrow?: string
  title?: string
  standfirst?: string
  children: ReactNode
  tone?: 'plain' | 'well'
  divider?: boolean
  align?: 'left' | 'centre'
  className?: string
}) {
  const centred = align === 'centre'

  return (
    <section
      id={id}
      className={`scroll-mt-24 ${tone === 'well' ? 'kh-well' : ''} ${className ?? ''}`}
    >
      {divider ? (
        <div className="mx-auto max-w-[78rem] px-5 md:px-8">
          <BrushDivider />
        </div>
      ) : null}

      <Drawn className="mx-auto max-w-[78rem] px-5 py-16 md:px-8 md:py-24">
        {title ? (
          <header className={`kh-reveal ${centred ? 'mx-auto max-w-[46rem] text-center' : ''}`}>
            {eyebrow ? <p className="annotation text-gold">{eyebrow}</p> : null}
            <h2 className="display-sm mt-3">{title}</h2>
            {standfirst ? (
              <p
                className={`mt-5 text-lg leading-relaxed text-paper-dim ${centred ? '' : 'measure'}`}
              >
                {standfirst}
              </p>
            ) : null}
          </header>
        ) : null}

        <div className={`kh-reveal ${title ? 'mt-12' : ''}`}>{children}</div>
      </Drawn>
    </section>
  )
}
