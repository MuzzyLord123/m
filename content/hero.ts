import { emptyPhoto } from './types'

export const hero = {
  /** Masking-tape label. 1 of 4 tape labels on the page. */
  tape: 'Wrexham · Coedpoeth',
  /** The single h1. States the trade and the place, plainly. */
  heading: 'Painter & decorator in Wrexham.',
  /** Two clauses. No more. */
  sub: 'Interiors, exteriors and woodwork — prepared properly, then painted.',
  callLabel: 'Ring me',
  secondary: 'See recent work',
  photo: emptyPhoto(
    'The hero shot: the best finished room you have, taken wide and level from the doorway in daylight. Landscape, as big a file as your phone will give.',
  ),
} as const

export const contact = {
  eyebrow: 'Contact',
  heading: 'Ring me and tell me what needs painting.',
  body: 'Quickest way to get a price is a phone call. If I am up a ladder I will ring you back.',
  formHeading: 'Or leave your details',
  formNote:
    'A photo of the room or the wall speeds a price up more than anything else you can send — take one on your phone when you ring.',
  successHeading: 'Got it.',
  successBody: 'I will come back to you. If it is urgent, ring instead:',
  fields: {
    name: 'Your name',
    phone: 'Phone number',
    work: 'What needs painting',
    timescale: 'Rough timescale',
  },
  workPlaceholder: 'e.g. two bedrooms and the landing, walls and woodwork',
  timescalePlaceholder: 'e.g. sometime in the next couple of months',
} as const
