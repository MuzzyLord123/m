/**
 * Finishes explainer. Real information — this is the page a homeowner
 * searches for before they ring anyone.
 */

export type Finish = {
  name: string
  /** Approximate sheen, as measured at 60 degrees. */
  sheen: string
  sheenPercent: number
  suits: string
  wears: string
}

export const finishes: Finish[] = [
  {
    name: 'Eggshell',
    sheen: 'Low',
    sheenPercent: 15,
    suits: 'Doors, skirting and trim in bedrooms and living rooms, where you want the woodwork quiet rather than shiny. Also used on walls in kitchens and bathrooms when a wipeable finish helps.',
    wears: 'Hides bumps, old repairs and uneven timber better than anything shinier. Wipes clean, but scuffs show sooner than they would on gloss. The easiest of the three to patch or recoat later.',
  },
  {
    name: 'Satin',
    sheen: 'Mid',
    sheenPercent: 35,
    suits: 'Skirting, architrave, doors and stairs in family houses and hallways. The usual choice for woodwork in most homes now, and the safe answer if you are not sure.',
    wears: 'Takes knocks and washing well. Shows fewer brush marks than gloss and fewer dents than eggshell — it sits in the middle on both counts, which is why it gets specified so often.',
  },
  {
    name: 'Gloss',
    sheen: 'High',
    sheenPercent: 80,
    suits: 'Front doors, handrails, radiators and traditional trim, where a hard shine is what you are after. Common in older properties and on anything that gets handled daily.',
    wears: 'The hardest surface of the three and the easiest to wash down. Also the least forgiving: every dent, ripple and sanding scratch underneath it will catch the light. It needs the best preparation of the lot.',
  },
]

export const finishesNote = {
  heading: 'Water-based or oil-based',
  body: 'Water-based satin and eggshell dry quickly, smell far less, and stay the colour you chose. Oil-based gloss is harder and flows out smoother off the brush, but it ambers over time — noticeably so on white woodwork in rooms that do not get much daylight. On a north-facing hallway that matters more than most people expect.',
} as const
