import { emptyPhoto, type Photo, type SpecRow } from './types'

/**
 * /dustless-sanding — the second differentiator.
 *
 * On the old site this was a phrase in a paragraph. It is the thing that decides
 * whether a customer can carry on living in the house while the work happens, and
 * it is worth a page of its own because it is the answer to the objection that
 * stops people booking decorating at all: "we can't face the mess".
 */

export const dustless = {
  question: 'What does dustless sanding actually mean?',

  lede: 'The sander is connected to an extractor, and the dust is pulled off the surface through the abrasive itself, at the moment it is made. It goes into a filtered vacuum instead of into the air, the carpet, the curtains and everything else you own.',

  what: [
    'An ordinary sander throws dust. It gets everywhere, and "everywhere" in a house means the top of the picture frames, inside the wardrobe, on the skirting in the next room and through the whole first floor. It carries on landing for days after the sanding stopped.',
    'The system I use extracts at the pad. The abrasive disc is perforated, the backing pad is perforated behind it, and the hose runs to an extractor with filtration fine enough to hold the dust it collects rather than blowing the fine fraction back out of the exhaust — which is what an ordinary workshop vacuum does.',
    'The practical result is that I can sand a whole staircase, or fill and flat an entire ceiling, in a house you are still living in, and at the end of it there is no grey film over the room. You will not need to wash everything down. That is the whole point of it.',
  ],

  whyItMatters: [
    {
      title: 'You can stay in the house',
      body: 'This is the one that matters. Most decorating dust is made during sanding, and most of the disruption people dread is that dust. Take it out at the source and a repaint stops being something you have to move out for.',
    },
    {
      title: 'Old paint should not be sanded loose',
      body: 'Paint from the middle of the last century may well contain lead, and on older houses in this part of the country there is usually a layer of it somewhere down the stack. Dry-sanding that into the air of a house with children in it is genuinely a bad idea. Extracted at the pad, it goes into the machine.',
    },
    {
      title: 'A dust-free surface takes paint better',
      body: 'Airborne dust has to land somewhere, and if the next thing you do is apply wet paint, it lands in that. Extracting as I sand means the surface I am coating is clean, so the finish is smoother — this is a quality argument as much as a cleanliness one.',
    },
    {
      title: 'It makes the job quicker',
      body: 'Less masking beforehand and far less cleaning afterwards. A day not spent wiping down a house is a day off the job, and that comes off the price rather than going onto it.',
    },
  ],

  spec: [
    { label: 'Extraction', value: 'At the abrasive pad, as the dust is made' },
    { label: 'Filtration', value: 'Fine-filtered extractor, retained not recirculated' },
    { label: 'Used for', value: 'Walls, ceilings, filler, woodwork, staircases' },
    { label: 'Suitable with you in the house', value: 'Yes — that is what it is for' },
    { label: 'Older paint layers', value: 'Captured rather than put into the air' },
    { label: 'Extra cost to you', value: 'None. It is how I work.' },
    { label: 'Equipment', value: '{{DUSTLESS_SYSTEM}}' },
  ] satisfies SpecRow[],

  limits: [
    '"Dustless" is the trade word for it and it overstates the case. It captures the great majority of the dust at the point it is made. It is not a sealed laboratory, and anyone who tells you their sanding produces literally none of it is selling.',
    'Internal corners, mouldings, spindles and beading still need hand-sanding, and a sanding block cannot be connected to an extractor. Those bits make dust, so those bits get sheeted and cleaned as normal.',
    'Dust sheets still go down. The extraction deals with airborne dust, not with a dropped tin.',
    'It does not make a sanding job silent. An extractor running alongside a sander is noisy, and if someone is working from home upstairs it is worth planning which room I am in and when.',
  ],

  photo: emptyPhoto(
    'The sander with the hose and extractor connected, mid-sand on a wall or a staircase, with the room around it obviously still lived in — furniture in place, no grey film. That contrast is the entire argument.',
  ),

  callouts: [
    { x: 34, y: 42, side: 'left' as const, label: 'Extraction at the pad' },
    { x: 66, y: 62, side: 'right' as const, label: 'Fine dust retained, not recirculated' },
    { x: 46, y: 84, side: 'right' as const, label: 'Room still in use' },
  ],
} satisfies {
  question: string
  lede: string
  what: string[]
  whyItMatters: { title: string; body: string }[]
  spec: SpecRow[]
  limits: string[]
  photo: Photo
  callouts: { x: number; y: number; side: 'left' | 'right'; label: string }[]
}
