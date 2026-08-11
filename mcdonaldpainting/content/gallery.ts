/**
 * The gallery.
 *
 * Plates, numbered, in the order they are listed here. Not a masonry wall of
 * thumbnails — every photograph declares how wide it sits and what shape it is,
 * so the page has a rhythm somebody chose rather than one a script fell into.
 *
 * ── Adding a photograph ────────────────────────────────────────────────────
 *
 *   1. Put the file in `public/photographs/gallery/`.
 *   2. Add an entry below.
 *   3. That is all. No code changes, no dimensions to measure.
 *
 * A plate whose file is not there yet renders as a labelled empty frame saying
 * what belongs in it — the same way the site records do. That means you can
 * list fifty photographs now and upload them over a week, and the page is
 * honest at every point in between rather than broken.
 *
 * ── The two kinds ──────────────────────────────────────────────────────────
 *
 *   kind: 'single'      one photograph.
 *   kind: 'comparison'  before and after, with a divider the reader drags.
 *                       Both files must be shot from the same position and
 *                       cropped to the same shape or the comparison lies.
 *
 * ── span and ratio ─────────────────────────────────────────────────────────
 *
 *   span   how many of twelve columns the plate takes at desktop: 4, 6, 8, 12.
 *          On a phone every plate is full width regardless.
 *   ratio  the shape the plate is cropped to. Match it to the photograph —
 *          '3/4' for an upright, '4/3' or '3/2' for a landscape, '16/9' for
 *          something wide. Getting this right is what stops a gallery looking
 *          like a contact sheet.
 *
 * `alt` is not optional and it is not decoration. It describes **the work
 * shown** — it is what a blind visitor hears and what Google Images reads.
 * "Blown render cut out and made good" is alt text. "House" is not.
 */

import { SECTOR_SLUGS } from './sectors';

export type PlateRatio = '1/1' | '3/4' | '4/3' | '3/2' | '16/9' | '21/9';
export type PlateSpan = 4 | 6 | 8 | 12;

type Shared = {
  /** Stable, and used in the address bar when the viewer is open. */
  id: string;
  /** Must be a slug from content/sectors.ts. Drives the filter. */
  sector: (typeof SECTOR_SLUGS)[number];
  /** One line under the plate. What the job was, not what the photo is. */
  caption: string;
  /** Optional second line: where, when, what was applied. */
  detail?: string;
  span: PlateSpan;
  ratio: PlateRatio;
  /** Where a client or a third party supplied the photograph. */
  credit?: string;
};

export type Plate =
  | (Shared & {
      kind: 'single';
      /** Path under /public. */
      src: string;
      alt: string;
    })
  | (Shared & {
      kind: 'comparison';
      before: { src: string; alt: string };
      after: { src: string; alt: string };
    });

/**
 * The five photographs Sean sent through are all residential — the render
 * repair and the fitted bedroom are both houses. They are good photographs and
 * they belong here, but they are worth being clear about: they are not the
 * commercial evidence. A facilities manager wants the assembly hall, the
 * factory and the warehouse, and those are still the ones missing. See
 * CONTENT-NEEDED.md.
 */
export const PLATES: readonly Plate[] = [
  {
    id: 'render-repair-bungalow',
    kind: 'comparison',
    sector: 'residential',
    caption: 'Blown render cut out, made good and repainted',
    detail:
      'Failed render taken back to sound material, patched, and the whole elevation brought back to one colour. Brickwork, bargeboards and window reveals cut in by hand.',
    span: 12,
    ratio: '4/3',
    before: {
      src: '/photographs/gallery/render-repair-before.jpg',
      alt: 'Bungalow gable with large areas of render blown and patched, bare grey patches across the white elevation, dust sheets over the beds below.',
    },
    after: {
      src: '/photographs/gallery/render-repair-after.jpg',
      alt: 'The same bungalow gable after repair, the render even and one colour, with the brick plinth and brown window frames cut in cleanly.',
    },
  },
  {
    id: 'fitted-bedroom',
    kind: 'comparison',
    sector: 'residential',
    caption: 'Fitted bedroom furniture, bare plaster to finished',
    detail:
      'Alcove wardrobe, overhead cupboards and dressing table. Plaster sealed and made good, then the units painted and the oak top left clear.',
    span: 8,
    ratio: '3/4',
    before: {
      src: '/photographs/gallery/fitted-bedroom-before.jpg',
      alt: 'Bedroom alcove stripped back to patched plaster, an unpainted cupboard carcass in place and dust sheets over the floor.',
    },
    after: {
      src: '/photographs/gallery/fitted-bedroom-after.jpg',
      alt: 'The finished alcove: painted wardrobe and overhead cupboards either side of a dressing table with an oak top and a mirror.',
    },
  },
  {
    id: 'dormer-cladding',
    kind: 'single',
    sector: 'residential',
    caption: 'Dormer cladding, fascias and rainwater goods',
    detail:
      'Cladding and trims coated, guttering and downpipe renewed and painted, brickwork left clean.',
    span: 4,
    ratio: '3/4',
    src: '/photographs/gallery/dormer-cladding.jpg',
    alt: 'A white-clad dormer with dark grey windows above a red brick elevation, new white guttering along the eaves.',
  },
];

/** Sectors that actually have plates behind them, for the filter. */
export function gallerySectors(): string[] {
  return [...new Set(PLATES.map((p) => p.sector))];
}
