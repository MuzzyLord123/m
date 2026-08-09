/**
 * The loaded-brush mask, shared by the hero headline and the splash screen.
 *
 * It was defined inside HeroHeadline. The splash paints the logo on with the
 * same gesture, and two hand-copied SVG paths that have to stay identical is a
 * divergence waiting to happen — so it lives here and both import it.
 *
 * MASK GEOMETRY, which has to be exact. The mask is 220 units wide and is
 * stretched to 220% of the element, so the element's box shows image units
 * 0–100 at `--wipe: 0%` and units 120–220 at `--wipe: 100%`. Therefore:
 *
 *   • everything left of unit 100 must be fully TRANSPARENT — nothing shows at
 *     the start;
 *   • everything right of unit 120 must be fully OPAQUE — nothing is clipped at
 *     the end;
 *   • the bristled edge lives in the 20-unit corridor between them.
 *
 * Change the path and check both ends, or the reveal starts with a sliver
 * showing or finishes with a corner missing.
 */
const BRUSH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="100" preserveAspectRatio="none">
    <path fill="#fff" d="M220 0H115.5c-4.6 2.9-6.1 5.6-4.2 8.2 2.1 2.8 3.2 5.5 1.1 8.3-2.3 3-7.4 4.6-8.6 7.7-1.1 3 1.9 6 2.4 9 .5 3.1-2.4 5.9-3.1 8.9-.7 3 2.6 6 2.9 9 .3 3-2.6 5.9-2.4 8.9.2 3 3.4 5.9 3.2 8.9-.2 3-3.6 5.9-3.4 8.9.2 3 3.8 5.9 3.4 8.8-.4 2.9-4.4 5.7-4 8.6.3 2.1 2.4 3.4 4.4 4.8H220Z"/>
    <path fill="#fff" opacity=".85" d="M112.4 3.5c1.4 3.4.4 6.6-1.9 9.4-2 2.4-4.6 4.4-4.4 7.2.2 2.9 2.9 5.4 2.4 8.3-.4 2.8-3.4 5-3.6 7.9-.2 2.9 2.4 5.6 2.1 8.5-.3 2.9-3.2 5.2-3.2 8.1 0 2.9 2.7 5.5 2.5 8.4-.2 2.9-3.1 5.3-3 8.2.1 2.9 2.9 5.5 2.6 8.4-.3 2.9-3.3 5.2-3.2 8.1.1 2.4 2 4.2 3.6 6.2l3.1-.7c-1.5-2-3.3-3.7-3.3-6 0-2.8 2.9-5.1 3.2-8 .3-2.9-2.5-5.5-2.6-8.4-.1-2.9 2.8-5.3 3-8.2.2-2.9-2.5-5.5-2.5-8.4 0-2.9 2.9-5.2 3.2-8.1.3-2.9-2.3-5.6-2.1-8.5.2-2.9 3.2-5.1 3.6-7.9.5-2.9-2.2-5.4-2.4-8.3-.2-2.8 2.4-4.8 4.4-7.2 1.7-2.1 2.7-4.4 2.4-7l-3.9-2Z"/>
  </svg>`;

/** Ready to drop straight into a `--brush-mask` custom property. */
export const BRUSH_MASK_URL = `url("data:image/svg+xml,${encodeURIComponent(BRUSH_SVG)}")`;

/**
 * The same brush, flipped — opaque on the LEFT, bristles at 100–120,
 * transparent to the right.
 *
 * WHICH WAY THE PAINT GOES. With the upright mask, sliding `--wipe` 0% -> 100%
 * uncovers the element from the RIGHT edge leftwards: the opaque part of the
 * mask enters the window from its right side. That is fine for the headline,
 * where the words simply arrive. It is wrong for a brush laying a logo down,
 * because a stroke painted right to left reads backwards.
 *
 * Mirroring the artwork and running `--wipe` 100% -> 0% uncovers from the left
 * instead. Same bristled edge, same geometry, opposite hand.
 *
 * Done with a transform on a group rather than by rewriting the path data, so
 * there is exactly one set of coordinates to maintain.
 */
const BRUSH_SVG_MIRRORED = BRUSH_SVG.replace(
  /(<svg[^>]*>)/,
  '$1<g transform="translate(220,0) scale(-1,1)">',
).replace("</svg>", "</g></svg>");

export const BRUSH_MASK_URL_MIRRORED = `url("data:image/svg+xml,${encodeURIComponent(
  BRUSH_SVG_MIRRORED,
)}")`;
