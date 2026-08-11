import Image from 'next/image'
import type { Callout, Photo } from '@content/types'
import { Drawn } from './Drawn'

/**
 * The signature device of this site: a photograph carrying technical annotations.
 *
 * A small square marker sits on a detail in the photograph, a 1px signal-blue leader
 * line runs from it to the edge of the frame, and a short label in the annotation
 * register sits just outside. It says "spray-applied, two coats" against the thing
 * that was sprayed, which is a more persuasive argument than any sentence about
 * quality, and it is the reason this site does not look like the other three
 * decorators' sites in the portfolio.
 *
 * ## Positioning
 *
 * `x` and `y` are percentages of the image box, so a marker stays on the detail it is
 * pointing at from 360px to 2560px wide. Keep them off the subject — a label across
 * the middle of a sprayed door is both a worse photograph and a worse annotation.
 *
 * ## Why container queries, not breakpoints
 *
 * The outside labels need roughly 130px of gutter on each side they are used. Whether
 * that room exists depends on how wide THIS FIGURE is, not on how wide the window is:
 * the same component sits in a five-column hero slot and in a ten-column figure on
 * /spraying, and at 1440px one of those has room and the other does not. Keyed to
 * viewport breakpoints, the narrow one collapses to a 185px-wide image with three
 * labels stacked on top of each other — which is exactly what happened before this was
 * written as a container query.
 *
 * So the figure is a container, the labels appear at `@[34rem]` and up, and only the
 * sides actually carrying a label get a gutter reserved. Below that the callouts become
 * a numbered list beneath the image with matching numbers on the markers, so the list
 * and the photograph still refer to each other. That collapse is a requirement rather
 * than a fallback — annotations that overlap the subject or vanish on a phone are
 * grounds for rejection in the brief, and most of this site's traffic is a phone.
 *
 * ## Motion
 *
 * The line draws from the marker outward by retracting its dash offset, and the label
 * fades in as the line lands, 220ms behind it. Once, at 40% in view. The dash length is
 * a fixed overestimate rather than a measured length, because the line is specified in
 * percentages and its pixel length changes with the viewport — 2000 covers any line
 * this component can produce at any width.
 *
 * ## Empty slots
 *
 * There are no photographs yet: the live site's images are Google-hosted resized copies
 * and hotlinking them is out, so the originals have to come off Kenny's phone. Until
 * then a slot renders as a ruled frame carrying the brief for the shot, which is honest
 * and keeps the layout intact. Never a stock photograph, never an AI-generated interior.
 */
export function Annotated({
  photo,
  callouts = [],
  /** `sizes` for next/image. Set it per layout — it decides how much is downloaded. */
  sizes = '(min-width: 1024px) 60vw, 100vw',
  priority = false,
  /** Aspect ratio for the empty state, so the layout does not move once it is filled. */
  ratio = '3 / 2',
  className,
}: {
  photo: Photo
  /** `readonly` so content declared with `as const` can be passed straight in. */
  callouts?: readonly Callout[]
  sizes?: string
  priority?: boolean
  ratio?: string
  className?: string
}) {
  const hasImage = Boolean(photo.src && photo.width && photo.height)
  const numbered = callouts.map((c, i) => ({ ...c, n: i + 1 }))

  // Only reserve a gutter on a side that actually carries a label. A figure with all
  // its callouts on the right keeps the other 130px for the photograph.
  const usesLeft = numbered.some((c) => c.side === 'left')
  const usesRight = numbered.some((c) => c.side === 'right')
  const gutters = !hasImage
    ? '' // Nothing goes in the gutters until there is a photograph. See below.
    : [usesLeft ? '@[34rem]:pl-[8.5rem]' : '', usesRight ? '@[34rem]:pr-[8.5rem]' : '']
        .filter(Boolean)
        .join(' ')

  /*
   * Markers, leader lines and outside labels only exist once there is a photograph.
   *
   * An annotation with no subject is decoration, and worse, it collides with the text
   * of the shot brief — a marker at 72% down lands squarely in the middle of it. So an
   * empty slot shows the frame, the brief, and the intended annotations as a plain
   * numbered list. Drop a real photograph in and the whole device appears against it.
   */
  const annotate = hasImage && numbered.length > 0

  return (
    <Drawn threshold={0.4} className={className}>
      <figure className="@container">
        <div className={gutters}>
          {/*
            No `overflow-hidden` here, however tempting: the callout labels are
            absolutely positioned children of this box and deliberately sit OUTSIDE it
            at `left:100%` / `right:100%`. Clipping the frame clips every label. The
            empty-slot text does its own clipping instead.
          */}
          <div
            className={`kh-frame relative ${hasImage ? '' : 'kh-frame--empty'}`}
            style={{ aspectRatio: hasImage ? undefined : ratio }}
          >
            {hasImage ? (
              <Image
                src={photo.src as string}
                alt={photo.alt ?? ''}
                width={photo.width as number}
                height={photo.height as number}
                sizes={sizes}
                priority={priority}
                className="block h-auto w-full"
              />
            ) : (
              <EmptySlot brief={photo.brief} />
            )}

            {/* --- Leader lines. Only where the labels are shown. ------------ */}
            {annotate ? (
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 hidden h-full w-full @[34rem]:block"
              >
                {numbered.map((c) => (
                  <line
                    key={c.n}
                    className="callout-line"
                    x1={`${c.x}%`}
                    y1={`${c.y}%`}
                    x2={c.side === 'left' ? '0%' : '100%'}
                    y2={`${c.y}%`}
                    stroke="var(--color-gold)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                    style={
                      {
                        '--line-length': 2000,
                        '--callout-delay': `${(c.n - 1) * 120}ms`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </svg>
            ) : null}

            {/* --- Markers, on the photograph. ------------------------------ */}
            {(annotate ? numbered : []).map((c) => (
              <span
                key={c.n}
                aria-hidden="true"
                className="callout-dot pointer-events-none absolute flex items-center gap-1.5"
                style={
                  {
                    left: `${c.x}%`,
                    top: `${c.y}%`,
                    transform: 'translate(-50%, -50%)',
                    '--callout-delay': `${(c.n - 1) * 120}ms`,
                  } as React.CSSProperties
                }
              >
                {/* A square, not a circle. Nothing on this site has a radius, and a
                    tick mark is what an engineering drawing would use anyway. */}
                <span className="block size-[7px] shrink-0 border border-matt bg-gold" />
                {/* The number is only needed while the label is not adjacent. */}
                <span className="annotation bg-matt px-1 text-gold @[34rem]:hidden">{c.n}</span>
              </span>
            ))}

            {/* --- Labels, outside the frame. ------------------------------- */}
            {(annotate ? numbered : []).map((c) => (
              <span
                key={c.n}
                className="callout-label annotation absolute hidden w-[7.5rem] leading-snug text-paper @[34rem]:block"
                style={
                  {
                    top: `${c.y}%`,
                    transform: 'translateY(-50%)',
                    [c.side === 'left' ? 'right' : 'left']: '100%',
                    [c.side === 'left' ? 'paddingRight' : 'paddingLeft']: '0.75rem',
                    textAlign: c.side === 'left' ? 'right' : 'left',
                    '--callout-delay': `${(c.n - 1) * 120}ms`,
                  } as React.CSSProperties
                }
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* --- The collapsed list. -----------------------------------------
            Shown below `34rem`, where there are no gutters for outside labels, and
            shown always while the slot is empty, because then it is the only place
            the intended annotations appear at all. -------------------------- */}
        {numbered.length > 0 ? (
          <ol className={`mt-4 space-y-2 ${annotate ? '@[34rem]:hidden' : ''}`}>
            {numbered.map((c) => (
              <li key={c.n} className="flex gap-3">
                <span className="annotation shrink-0 pt-0.5 text-gold">{c.n}</span>
                <span className="annotation">{c.label}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {/* The alt text carries the description for screen readers; a caption would
            only repeat it. The brief for a missing shot is shown inside the frame. */}
      </figure>
    </Drawn>
  )
}

/**
 * An unfilled photograph slot: a panel masked off and waiting for a spray pass.
 *
 * These frames are large and there are a lot of them, because Kenny's photographs
 * have not arrived yet. So the empty state has to be composed rather than merely
 * labelled — the content is centred as a small plate on the masking film, which
 * reads as a deliberate placeholder in a schedule of works. Pinned to the bottom
 * corner of a 1200×520 rectangle, the same words read as a void with a caption.
 *
 * The brief is clamped: some of these frames are only a couple of hundred pixels
 * wide, and text spilling out of the bottom of its own border looks like a fault.
 */
function EmptySlot({ brief }: { brief: string }) {
  return (
    // Clipping happens here rather than on the frame, so the callout labels outside
    // the frame survive. See the note above.
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-5 md:p-8">
      <div className="kh-well max-w-[34rem] border border-edge px-5 py-4 text-center">
        <p className="annotation text-gold">Photograph to come</p>
        <div className="mx-auto mt-3 h-px w-8 bg-gold-deep" />
        <p className="mt-3 line-clamp-3 text-sm text-paper-dim @[26rem]:line-clamp-4 @[40rem]:line-clamp-none">
          {brief}
        </p>
      </div>
    </div>
  )
}
