import localFont from 'next/font/local'

/**
 * One family: Archivo, variable, self-hosted from this repository.
 *
 * ## Why Archivo
 *
 * A late-nineteenth-century grotesque, drawn with a WIDTH axis from 62 to 125 —
 * and the width is the whole design. Headings are set wide, the way a
 * signwriter letters a shop fascia; the small labels wider still and tracked
 * out; body copy at the normal width; the big process numerals in the
 * narrowest cut. One file does the job a second and third family would, and
 * the design reads as lettering rather than as a template's font pairing.
 * Deliberately NOT a serif: the sibling decorator site in this portfolio is
 * Fraunces on near-black, and two black-and-gold sites sharing a display serif
 * would look like one studio built both.
 *
 * ## Why self-hosted, and subset
 *
 * Google's `latin` file of Archivo with both axes is 87KB, and it is on the
 * critical path: the hero headline is the LCP element on every page, and it
 * is set wider than any fallback can imitate, so the page is not finished
 * painting until this file has arrived. Measured on a Lighthouse mobile run,
 * the full file put the home page's LCP at 2.84s.
 *
 * `src/fonts/archivo-kh.woff2` is the same font cut down to what the site uses:
 *
 *   - every character that appears in the built pages, plus all of ASCII, the
 *     typographic quotes and dashes, arrows, £ € × and é — 136 glyphs;
 *   - the weight axis limited to 400–800, the range the CSS actually asks for;
 *   - the width axis kept whole, 62–125.
 *
 * 47KB. A character outside the set (a town with a circumflex, say) is still
 * shown — the browser takes that one glyph from the fallback font — so adding
 * content can never break the page; regenerate the file when it happens, with
 * `python3 scripts/subset-font.py` (instructions at the top of that script).
 *
 * `font-stretch: 62% 125%` in the @font-face is what lets `font-stretch: 118%`
 * in the CSS reach the width axis. Without it the browser treats the face as
 * normal width only.
 */
export const archivo = localFont({
  src: [{ path: '../fonts/archivo-kh.woff2', weight: '400 800', style: 'normal' }],
  variable: '--font-archivo',
  display: 'swap',
  preload: true,
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
  // A metric-matched fallback, which is what holds CLS at zero during the swap.
  adjustFontFallback: 'Arial',
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
})
