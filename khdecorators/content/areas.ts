/**
 * Where Kenny works — home page §06, and the `areaServed` in the structured data.
 *
 * NOT CONFIRMED, and this is the most valuable ten minutes of the whole handover
 * call.
 *
 * The old site says "the north west of England" and names no place at all across
 * six pages. That single omission is doing two kinds of damage: Google has nothing
 * to match a local search against, and every Ads click from outside his real patch
 * is money spent on a job he would turn down. Naming the towns fixes both.
 *
 * What is needed is a base town and then the places he would genuinely drive to on
 * a Tuesday — not an aspirational list of every town in the north west. A list
 * that claims Manchester and Carlisle in the same breath is worse than a short
 * honest one: it reads as a franchise, and it drags in enquiries he cannot serve.
 *
 * Fill `towns` and the section, the schema `areaServed` and the contact page all
 * populate together. `npm run check:launch` fails while it is empty.
 */

export const areas = {
  /**
   * The towns, nearest first. EMPTY ON PURPOSE — see above. Do not seed this with
   * guesses off a map; his old Yell listing points at the Chester area but a
   * listing is a hint, not a service area.
   */
  towns: [] as string[],

  /** How far he will travel, and on what terms. Also needs confirming. */
  radius: '{{TRAVEL_RADIUS}}',

  body: [
    'I am based in {town} and I work across the north west. Most of my jobs are within half an hour of home, which is deliberate — it means I can call in the evening if a customer has a question, and it means I am not spending your money sitting on the M56.',
    'If you are further out, ring me anyway. Spray work is worth a longer drive than a single room repaint, and I would rather tell you honestly on the phone than have you wait in for a quote I was never going to be able to price competitively.',
  ],

  /** Shown as a plain note beneath the list. */
  note: 'If your town is not on the list it is worth a phone call rather than an assumption.',
}
