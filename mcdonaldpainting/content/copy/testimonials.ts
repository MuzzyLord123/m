/**
 * Testimonials.
 *
 * There are none here, and that is deliberate.
 *
 * The current site has a testimonials page. Nobody involved in this build has
 * been able to read it — the live site is not reachable from the environment it
 * was built in — and a quote is the one thing on a website that must be
 * verbatim. So the two slots render as marked questions rather than as words
 * somebody wrote on the client's behalf.
 *
 * The rules when they are filled in:
 *   - Verbatim. Not tidied, not shortened past 30 words, not improved.
 *   - Attributed as published. A first name and a role is enough; "a happy
 *     customer" is not, and reads as written in-house.
 *   - Commercial first. One facilities manager outweighs six householders on
 *     this site, because of who is reading it.
 *   - No aggregateRating in the structured data unless it comes from reviews on
 *     the company's own verified profile. Marking up third-party aggregates is
 *     against Google's structured data policy and is a manual action risk.
 */

export type Testimonial = {
  /** Verbatim, 30 words or fewer. */
  quote: string;
  /** As published: name, or name and role. */
  attribution: string;
  /** Organisation type, where it is known and permitted. */
  context?: string;
  /** Where it was published, so it can be checked. */
  source?: string;
  sector?: string;
};

export const TESTIMONIALS: readonly Testimonial[] = [];

/** Shown in each empty slot, so the gap states its own brief. */
export const TESTIMONIAL_SLOTS = [
  {
    want: 'A commercial client — a facilities manager, an estates officer or a school business manager.',
    needed: 'testimonials',
  },
  {
    want: 'A second commercial client, ideally from a different sector to the first.',
    needed: 'testimonials',
  },
] as const;
