/**
 * Where he works.
 *
 * `confirmed` came from the client. `toConfirm` is a suggested list of places
 * inside a sensible radius — HE MUST CONFIRM EACH ONE BEFORE THE SITE GOES
 * LIVE. They are rendered in a visibly separate, unpublished state until
 * `confirmed: true` is set on each. See CONTENT-NEEDED.md.
 */

export type Area = {
  name: string
  confirmed: boolean
}

/** Supplied by the client — safe to publish. */
export const confirmedAreas: Area[] = [
  { name: 'Wrexham', confirmed: true },
  { name: 'Coedpoeth', confirmed: true },
]

/** CONFIRM: suggested surrounding villages. Flip `confirmed` to true once he says yes. */
export const suggestedAreas: Area[] = [
  { name: 'Rhos', confirmed: false },
  { name: 'Brymbo', confirmed: false },
  { name: 'Minera', confirmed: false },
  { name: 'Gresford', confirmed: false },
  { name: 'Llay', confirmed: false },
  { name: 'Marford', confirmed: false },
  { name: 'Rossett', confirmed: false },
  { name: 'Ruabon', confirmed: false },
  { name: 'Chirk', confirmed: false },
  { name: 'Wrexham Industrial Estate', confirmed: false },
]

export const areasCopy = {
  eyebrow: 'Where I work',
  heading: 'Wrexham, Coedpoeth and the surrounding area.',
  body: 'Based in Wrexham and working across the town and the villages around it. If you are not sure whether you are in range, ring and ask — it is a short conversation and I would rather tell you straight than have you guess.',
} as const

/** Everything currently publishable, in one list. */
export const publishedAreas = [...confirmedAreas, ...suggestedAreas.filter((a) => a.confirmed)]
