import type { ReactNode } from 'react'
import { Drawn } from './Drawn'
import { GridRules } from './GridRules'

/**
 * A numbered part of the document. Every block on every page is one of these.
 *
 * The number sits top-left with a rule beneath it, the heading and content run in the
 * remaining ten columns, and the exposed 12-column grid runs the full height of the
 * block, drawing downward as it comes into view. Together they are what makes the site
 * read as a specification with parts rather than as a page with paragraphs.
 *
 * One component rather than one per page, so the grid, the reveal and the part marker
 * cannot drift apart between the home page and the inner pages — which they had, before
 * this was pulled out.
 */
export function Section({
  number,
  id,
  title,
  standfirst,
  /** `annotation` for a short technical aside, `body` for a sentence of prose. */
  standfirstTone = 'body',
  /** `h1` on a single-service landing page, where this block IS the page. */
  headingLevel = 'h2',
  children,
  /** Set on the first block of a page, where the rule above would be redundant. */
  flush = false,
  /** Suppress the column overlay on blocks that carry a full-width figure. */
  grid = true,
}: {
  number: string
  id?: string
  title: string
  standfirst?: string
  standfirstTone?: 'annotation' | 'body'
  headingLevel?: 'h1' | 'h2'
  children: ReactNode
  flush?: boolean
  grid?: boolean
}) {
  const Heading = headingLevel

  return (
    <Drawn
      id={id}
      className={`relative scroll-mt-28 ${flush ? '' : 'border-t border-rule'} py-14 md:py-20`}
    >
      {grid ? <GridRules /> : null}

      <div className="relative md:grid md:grid-cols-12 md:gap-x-6">
        {/*
          The part marker: a fan-deck swatch chip carrying the numeral, then a
          snapped chalk line — the setting-out a decorator does before starting.
        */}
        <div className="md:col-span-2">
          <span className="kh-chip annotation-lg">{number}</span>
          <div className="kh-chalk mt-4 w-10 md:w-full" />
        </div>

        <div className="mt-5 md:col-span-10 md:mt-0">
          <Heading className="display-sm">{title}</Heading>

          {standfirst ? (
            standfirstTone === 'annotation' ? (
              <p className="annotation mt-3 max-w-[62ch] leading-relaxed normal-case tracking-normal">
                {standfirst}
              </p>
            ) : (
              <p className="measure mt-5 text-paper-dim">{standfirst}</p>
            )
          ) : null}

          <div className={standfirst && standfirstTone === 'body' ? 'mt-10' : 'mt-8'}>
            {children}
          </div>
        </div>
      </div>
    </Drawn>
  )
}
