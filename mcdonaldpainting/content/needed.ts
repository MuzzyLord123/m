import data from './needed.json';

/**
 * Every open question about this business, in one place.
 *
 * The questions live in needed.json so that the site, the capability statement
 * and scripts/check-content.mjs all read the same list, and CONTENT-NEEDED.md is
 * generated from it rather than kept in step by hand.
 *
 * The registry does three jobs:
 *   1. `<Confirm id="…" />` renders a visibly marked placeholder on the page
 *      wherever a fact is missing, so nothing is quietly invented to fill it.
 *   2. `npm run check:content` prints what is outstanding, worst first.
 *   3. `npm run check:launch` fails while anything marked blocksLaunch is still
 *      open. That is the gate in front of switching the WordPress site off.
 *
 * When Sean answers one: put the fact in the file named in `where`, then delete
 * the entry from needed.json. The placeholder disappears from the page and the
 * question disappears from CONTENT-NEEDED.md.
 */

export type Needed = {
  id: string;
  /** 1 = ask on the first call. 3 = ask when there is a spare minute. */
  priority: 1 | 2 | 3;
  /** Written the way you would actually ask it, out loud, on the phone. */
  question: string;
  /** What it unblocks — for whoever is doing the asking, and for Sean. */
  why: string;
  /** Where the answer goes once it arrives. */
  where: string;
  /** The WordPress site does not get switched off while this is open. */
  blocksLaunch: boolean;
};

export const NEEDED = data as readonly Needed[];

export function neededById(id: string): Needed | undefined {
  return NEEDED.find((n) => n.id === id);
}

/** Blocking first, then priority, then alphabetical — the order to ask in. */
export function neededInOrder(): readonly Needed[] {
  return [...NEEDED].sort(
    (a, b) =>
      Number(b.blocksLaunch) - Number(a.blocksLaunch) ||
      a.priority - b.priority ||
      a.id.localeCompare(b.id),
  );
}
