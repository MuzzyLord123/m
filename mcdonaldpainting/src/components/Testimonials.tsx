import { TESTIMONIALS, TESTIMONIAL_SLOTS } from '@content/copy/testimonials';
import { Confirm } from '@/components/Confirm';

/**
 * Two quotes, set in the page and attributed. Not a carousel, not a wall.
 *
 * There are none yet. The current site has a testimonials page, nobody involved
 * in this build has been able to read it, and a quote is the one thing on a
 * website that has to be verbatim — so the slots render as questions rather than
 * as words written on the client's behalf.
 *
 * Once they are filled in: commercial first, thirty words or fewer, attributed
 * as published. And no aggregateRating in the structured data, ever, unless it
 * comes from the company's own verified Business Profile.
 */
export function Testimonials({ ground = 'mist' }: { ground?: 'paper' | 'mist' | 'graphite' }) {
  if (TESTIMONIALS.length) {
    return (
      <div className="grid gap-x-[var(--spacing-gutter)] gap-y-10 md:grid-cols-2">
        {TESTIMONIALS.slice(0, 2).map((t) => (
          <figure key={t.quote} className="border-t border-[var(--rule)] pt-6">
            <blockquote className="t-lead max-w-[36ch]">“{t.quote}”</blockquote>
            <figcaption className="mt-5">
              <p className="t-label">{t.attribution}</p>
              {t.context ? <p className="t-label mt-1">{t.context}</p> : null}
              {t.source ? <p className="t-label mt-1">{t.source}</p> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-x-[var(--spacing-gutter)] gap-y-10 md:grid-cols-2" data-ground={ground}>
      {TESTIMONIAL_SLOTS.map((slot, i) => (
        <div key={i} className="border-t border-[var(--rule)] pt-6">
          <p className="t-label">Quote {i + 1} of 2</p>
          {/* The label colour, not the body colour at 70% — an opacity that
              looks "quieter" on a dark ground drops under 4.5:1 on a light one,
              which is exactly what happened when this site went light. */}
          <p className="t-lead mt-4 max-w-[36ch] text-[var(--label)]">{slot.want}</p>
          <Confirm
            id={slot.needed}
            className="mt-6"
            note="Where the quotes on the current testimonials page came from, and whether they can be attributed — a first name and a role is enough. Commercial ones first."
          />
        </div>
      ))}
    </div>
  );
}
