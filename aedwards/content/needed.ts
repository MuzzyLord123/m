import data from './needed.json'

/**
 * Every open question, in one place.
 *
 * The questions live in needed.json so that the site, scripts/check-content.mjs
 * and CONTENT-NEEDED.md all read the same list instead of being kept in step by
 * hand. Written the way you would actually ask them on the phone, because
 * that is how they get answered.
 *
 * When Andy answers one: put the fact in the file named in `where`, then delete
 * the entry from needed.json.
 */

export type Needed = {
  id: string
  /** 1 = ask on the first call. */
  priority: number
  question: string
  /** What it unblocks, for whoever is doing the asking. */
  why: string
  /** Where the answer goes. */
  where: string
  /** The site should not go live with this still open. */
  blocksLaunch: boolean
}

export const NEEDED: readonly Needed[] = data

export function neededById(id: string): Needed | undefined {
  return NEEDED.find((n) => n.id === id)
}
