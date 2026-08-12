import { Archivo } from 'next/font/google'

/**
 * One family: Archivo, variable, latin subset, self-hosted by next/font.
 *
 * ## Why Archivo
 *
 * Sturdy and slightly industrial — the register of proper trade signage and a van
 * livery, rather than a luxury brand. Deliberately NOT a serif: the sibling
 * decorator site in this portfolio is Fraunces on near-black, and two
 * black-and-gold sites sharing a display serif would look like the same studio
 * built both. Not condensed either, for the same reason.
 *
 * It is a text-and-display design, so it carries 600 at 68px for the headings and
 * 400 at 17px for body copy without either end looking borrowed.
 *
 * ## Why ONE family, when the design wanted two
 *
 * This started as Archivo for display plus IBM Plex Sans for body. That is four
 * font files — one variable plus three static weights — and the cost was measured,
 * not guessed:
 *
 *   two families, display not preloaded:  home LCP 2.0s, /spraying CLS 0.019
 *   two families, display preloaded:      home LCP 2.6s, CLS 0.000
 *   one variable family, preloaded:       see LAUNCH.md §7 for the figures
 *
 * Both two-family options failed something. Without the preload the display face
 * swapped in late and reflowed every heading on a long page, which put CLS at
 * 0.019 against a 0.02 ceiling — passing with no margin at all, which is not
 * passing. With the preload, four files competed for bandwidth in the window that
 * decides LCP and the landing page went over its 2.0s budget.
 *
 * One variable file is one request, preloadable without competing with itself, and
 * it holds both numbers comfortably. Hierarchy comes from weight, size and the
 * gold — which on this design there is plenty of.
 *
 * `tabular-nums` is applied in globals.css for the specification tables. Archivo
 * carries proper tabular figures, so the numbers line up down a column.
 */
export const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
  preload: true,
  // A metric-matched fallback, which is what holds CLS at zero during the swap.
  adjustFontFallback: true,
})
