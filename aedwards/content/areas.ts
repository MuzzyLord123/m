/**
 * Where he works.
 *
 * His listing says "North Wales and the Chester area", which is his own wording
 * and is published as-is. The specific towns are not published until he
 * confirms them, one at a time.
 *
 * This matters more than it looks. Naming towns a sole trader does not actually
 * cover is how a small honest local site turns into the same spam as everyone
 * else's — and it is also how you end up driving to Llandudno for a hall,
 * stairs and landing. Towns go in this list only after Andy has said the name
 * out loud. See content/needed.json#service-towns.
 *
 * The plausible list, for the phone call, is: Flint, Deeside, Connah's Quay,
 * Holywell, Mold, Buckley, Chester. Ask about each. Do not paste it in here.
 */

export type Town = {
  name: string
  /** Andy said yes to this one, by name. */
  confirmed: boolean
}

export const towns: readonly Town[] = []

export const confirmedTowns = towns.filter((t) => t.confirmed)
