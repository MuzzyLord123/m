import data from './needed.json';

/**
 * Every open question, in one place.
 *
 * The questions live in needed.json so that the site and
 * scripts/check-content.mjs read the same list, and CONTENT-NEEDED.md is
 * generated from it rather than kept in step by hand.
 *
 * Three jobs:
 *   1. `<Pending id="…" />` renders a labelled frame where a fact or a
 *      photograph is missing, so nothing gets quietly invented to fill it.
 *   2. `npm run check:content` prints what is outstanding.
 *   3. `npm run check:launch` exits non-zero while anything marked
 *      blocksLaunch is still open. That is the gate before the WordPress site
 *      is switched off.
 *
 * When Ted answers one: put the fact in the file named in `where`, then delete
 * the entry from needed.json.
 */

export type Needed = {
  id: string;
  /** 1 = ask on the first call. */
  priority: number;
  /** Written the way you would actually ask it. */
  question: string;
  /** What it unblocks, for whoever is doing the asking. */
  why: string;
  /** Where the answer goes. */
  where: string;
  /** The site should not go live with this still open. */
  blocksLaunch: boolean;
};

export const NEEDED: readonly Needed[] = data;

export function neededById(id: string): Needed | undefined {
  return NEEDED.find((n) => n.id === id);
}
