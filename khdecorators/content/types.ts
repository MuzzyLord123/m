/**
 * Shared content types.
 *
 * Every word displayed on this site comes from a file in /content. Nothing is
 * written inside a component. Two reasons: the copy can be changed without
 * touching code, and it is possible to read the whole site's text in one sitting
 * and check that none of it was carried over from the old Google Sites pages.
 */

/* ------------------------------------------------------------------ *
 * Placeholders
 * ------------------------------------------------------------------ */

/**
 * The marker for a fact Kenny has not confirmed yet.
 *
 * Anything containing `{{` is an open question, listed in CONTENT-NEEDED.md and
 * caught by `npm run check:launch`, which exits non-zero while any of them are
 * still in place. Nothing about this business is invented to fill a gap — a
 * visible `{{TOWN}}` in a heading is embarrassing for ten minutes, whereas a
 * made-up town in a title tag is a lie to a customer and a wrong answer to
 * Google.
 */
export const isPlaceholder = (value: string): boolean => value.includes('{{')

/* ------------------------------------------------------------------ *
 * Photography
 * ------------------------------------------------------------------ */

/**
 * A photograph slot.
 *
 * While `src` is null the slot renders as an empty 1px-ruled frame carrying
 * `brief` — the description of the shot we need — and, where callouts are
 * attached, the annotation labels as a plain list. No stock photography, no
 * AI-generated interiors, and never a hotlink to `lh3.googleusercontent.com`:
 * those are Google's resized copies of Kenny's photos and they break.
 *
 * To fill a slot: put the file in /public/work, then set `src`, `alt` and the
 * real pixel `width`/`height` (they hold the layout still while it loads —
 * getting them wrong is a CLS failure, and CLS is in the budget).
 */
export type Photo = {
  src: string | null
  /** Describes the work, for screen readers and Google Images. Not "painting". */
  alt: string | null
  width: number | null
  height: number | null
  /** Plain-English brief for the shot. Also listed in CONTENT-NEEDED.md. */
  brief: string
}

export const emptyPhoto = (brief: string): Photo => ({
  src: null,
  alt: null,
  width: null,
  height: null,
  brief,
})

/**
 * One annotation on a photograph: a dot on the image, a 1px leader line, and a
 * short label sitting outside the frame.
 *
 * `x` and `y` are percentages of the image box, so they hold their position on
 * the subject at every screen width. Keep them off the subject itself — a
 * callout sitting on the middle of a sprayed door is a worse photograph and a
 * worse annotation. Below `md` the callouts collapse to a numbered list beneath
 * the image, with matching numbered dots left on it.
 */
export type Callout = {
  /** Percent from the left edge of the image, 0–100. */
  x: number
  /** Percent from the top edge of the image, 0–100. */
  y: number
  /** Which side the label sits on. Pick the side with the most empty space. */
  side: 'left' | 'right'
  /** Short and technical. "Spray-applied, 2 coats", not "beautiful finish". */
  label: string
}

/* ------------------------------------------------------------------ *
 * Specification tables
 * ------------------------------------------------------------------ */

/** One row of a specification table. The site's main way of being informative. */
export type SpecRow = {
  label: string
  value: string
}

/* ------------------------------------------------------------------ *
 * Services
 * ------------------------------------------------------------------ */

/** A row in the service table on the home page, linking to its own page. */
export type ServiceRow = {
  /** Route, e.g. '/spraying'. */
  href: string
  name: string
  /** One line. What it covers, in the fewest words that are still specific. */
  summary: string
  /** Applied by brush and roller, sprayed, or either. Shown as a spec column. */
  application: 'Brush & roller' | 'Spray' | 'Brush, roller or spray'
}

/**
 * A sprayable service.
 *
 * `/spraying` is built by mapping over these, so adding `/upvc-spraying` or
 * `/garage-door-spraying` as their own ad-group landing pages later needs a new
 * route file and nothing else — no new components, no copy written in JSX. Each
 * entry already carries its own title, description, h1 and lede for exactly that
 * purpose. See ADS-MIGRATION.md §7.
 */
export type SprayService = {
  /** URL fragment and anchor id, e.g. 'upvc'. */
  slug: string
  /** Section heading on /spraying. */
  name: string
  /** The number shown against the section, e.g. '01'. Assigned in order. */
  question: string
  /**
   * The answer, first paragraph. Someone who clicked an ad for "UPVC spraying"
   * reads this before scrolling. It answers the question rather than selling.
   */
  answer: string
  /** What this covers — the specific items, named as a customer would name them. */
  covers: string[]
  /** Why spraying beats brushwork here. Concrete, not adjectives. */
  whySpray: string[]
  /** Preparation and masking, in the order it happens. */
  preparation: string[]
  /** Specification table: coating, coats, drying, guarantee. */
  spec: SpecRow[]
  /** Honest limits. Weather, temperature, what is not suitable. */
  limits: string[]
  photo: Photo
  callouts: Callout[]
  /** Metadata for a future dedicated landing page for this one service. */
  landing: {
    /** Must contain a service and a place. `{town}` is substituted. */
    title: string
    description: string
    h1: string
  }
}

/**
 * One of the standard service pages — interior, exterior, wallpapering.
 *
 * All three render from the same component, so they are consistent and so a
 * fourth can be added by writing an object rather than a page. `/spraying` and
 * `/dustless-sanding` have their own richer shapes because they carry more
 * detail; these three are the bread-and-butter work and are built to be
 * scannable.
 */
export type ServicePage = {
  slug: string
  /** H1. Names the work, not the benefit. */
  h1: string
  /** Title tag. Must contain a service and a place — `{town}` is substituted. */
  title: string
  description: string
  /** Opening paragraph. Two or three sentences, no throat-clearing. */
  lede: string
  /** What the work covers, itemised the way a customer would describe it. */
  covers: string[]
  /** The method, in the order it happens. This is the part worth reading. */
  method: { title: string; body: string }[]
  spec: SpecRow[]
  limits: string[]
  photo: Photo
  callouts: Callout[]
}

/* ------------------------------------------------------------------ *
 * Reviews
 * ------------------------------------------------------------------ */

/**
 * Where a review came from. `unsourced` is for the quotes on the old site that
 * carry only a first name and an initial: real, most likely, but with nothing to
 * link to and no date. They are shown in their own group, plainly labelled. They
 * are never given an invented date, never linked, and never mixed in with the
 * verifiable ones.
 */
export type ReviewSource = 'Yell' | 'Google' | 'unsourced'

export type Review = {
  /**
   * The reviewer's name exactly as published — including a Yell username that
   * looks like a username. Tidying it up is editing a review.
   */
  name: string
  /**
   * Verbatim, unedited, 30 words or fewer. Trim from the ends with an ellipsis
   * if you must; never reword, never fix the spelling, never join two sentences
   * that were not next to each other.
   */
  quote: string
  source: ReviewSource
  /** As published. ISO where a full date is known, 'YYYY-MM' where only the month is. */
  date: string | null
  /** Link to the review itself, or to the listing that holds it. */
  url: string | null
  /** The job, in our words, for context. Optional and clearly ours, not theirs. */
  context?: string
}
