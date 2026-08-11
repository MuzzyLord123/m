import type { SwatchKey } from '@/content/types'

/**
 * Service swatch colours. Kept here as hex as well as in @theme because the
 * roller-wipe covers and the SVG fills need a literal value, not a utility
 * class.
 *
 * These are DECORATIVE block colours. Body text never sits on them — captions
 * live underneath on the paper base, where contrast is 8:1 or better.
 */
export const swatchHex: Record<SwatchKey, string> = {
  blue: '#5B7C99',
  clay: '#B9714F',
  sage: '#7C8B6A',
  black: '#2A2723',
}
