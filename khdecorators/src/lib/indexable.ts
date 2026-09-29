import { town } from '@content/site'
import { areas } from '@content/areas'
import { reviews } from '@content/reviews'
import { isPlaceholder } from '@content/types'

/**
 * Is this build finished enough to be found in a search engine?
 *
 * The site gets deployed before it is finished — that is normal and useful, it is
 * how the client sees it and fills in the gaps. What is NOT acceptable is Google
 * indexing a page whose title reads "Painters & decorators in {{TOWN}}".
 *
 * Getting that indexed is worse than it sounds on a site with an existing
 * presence: the placeholder pages compete with the real ones, the snippet a
 * customer sees in a search result is visibly broken, and it takes weeks to clear.
 *
 * So indexing is tied to the content being finished rather than to somebody
 * remembering to flip a switch. While the town is unconfirmed, the site serves
 * `noindex` and a robots.txt that disallows everything. Fill in the town and
 * indexing turns itself on — the same condition `npm run check:launch` gates on.
 *
 * `SITE_NOINDEX=1` forces it off regardless, for a staging copy of a finished
 * site. There is deliberately no variable that forces it ON: the only way to be
 * indexed is to actually be ready.
 */
export function isIndexable(): boolean {
  if (process.env.SITE_NOINDEX === '1') return false

  // The town is in every page title and in the first sentence of the home page.
  if (isPlaceholder(town)) return false

  // No service area means no local search to be found for anyway.
  if (areas.towns.length === 0) return false

  // Reviews are not a ranking requirement, so they do not gate indexing — but
  // they are listed here as the remaining launch blocker for anyone reading.
  void reviews

  return true
}
