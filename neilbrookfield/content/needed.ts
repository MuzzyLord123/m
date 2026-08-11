import data from './needed.json';

/**
 * Every open question, in one place.
 *
 * The questions themselves live in needed.json so that the site and
 * scripts/check-content.mjs read exactly the same list — CONTENT-NEEDED.md is
 * generated from it rather than kept in step by hand.
 *
 * This registry does three jobs:
 *   1. `<Needed id="…" />` renders a labelled frame on the page where a fact is
 *      missing, so nothing is quietly invented to fill the gap.
 *   2. `npm run check:content` lists what is outstanding.
 *   3. `npm run check:launch` fails while anything marked blocksLaunch is still
 *      open. That is the gate before the Wix site is switched off.
 *
 * When Neil answers a question: put the fact in the file named in `where`, then
 * delete the entry from needed.json.
 */

export type Needed = {
  id: string;
  /** 1 = ask first on the call. */
  priority: number;
  /** Asked the way you would actually ask it on the phone. */
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
