/**
 * The palette, and the rule that governs it.
 *
 * The whole visual system is six colours and two typefaces. Every section of
 * the site is a full-bleed field of one of these colours, and the page
 * interpolates between them as you scroll. There are no cards, no borders and
 * no images holding the design up, so if a colour pairing is wrong there is
 * nothing to hide behind.
 *
 * Hence `assertContrast` below, which runs at module load — that is, at build
 * time. A field whose text does not clear 7:1 (WCAG AAA for body text) fails
 * the build rather than shipping. This is not decoration: the brief lists
 * "a field whose text fails 7:1 against its background" as an outright reject,
 * and a palette this saturated is exactly where that failure hides.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE DELIBERATE DEPARTURE FROM THE BRIEF'S HEX VALUES
 *
 * The brief specifies `--f6: #B4462C` for the burnt red field. That colour
 * cannot carry 7:1 text in either permitted foreground:
 *
 *     #B4462C on bone  #F2EFE7  →  4.74:1   fails
 *     #B4462C on ink   #14171A  →  3.30:1   fails
 *
 * There is no foreground that rescues it, so the field itself had to move.
 * #872C14 is the same burnt-red hue taken down until bone clears the bar with
 * margin (7.61:1). It is still the loudest field on the site, which is what
 * field 7 is for. Every other colour in the brief is used exactly as given.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** The only two foregrounds on the site. Never a third. */
export const INK = '#14171A'
export const BONE = '#F2EFE7'

/** WCAG AAA for body text. The floor, not the target. */
export const MIN_CONTRAST = 7

/* ---------------------------------------------------------------- maths --- */

function channel(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/**
 * Accepts "#1e3a34" or "rgb(30, 58, 52)". The second form matters because
 * Repaint asks this about a colour that is halfway between two fields, and a
 * mid-interpolation colour only exists as rgb().
 */
function rgb(colour: string): [number, number, number] {
  const hex = /^#([0-9a-f]{6})$/i.exec(colour)
  if (hex) {
    const n = parseInt(hex[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }

  const parts = colour.match(/[\d.]+/g)
  if (parts && parts.length >= 3) {
    return [Number(parts[0]), Number(parts[1]), Number(parts[2])]
  }

  throw new Error(`Expected a six-digit hex or rgb() colour, got: ${colour}`)
}

/** WCAG relative luminance. */
export function luminance(colour: string): number {
  const [r, g, b] = rgb(colour)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio, 1–21. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

/**
 * Ink or bone, whichever reads better on this ground.
 *
 * Used twice, and the second use is the important one. At rest it decides each
 * field's foreground here at build time. On scroll, Repaint asks it about the
 * background as it is *mid-interpolation*, every frame, so the text is always
 * whichever of the two colours is legible on whatever the page currently is.
 *
 * That is not a detail. Crossfading the text colour alongside the background —
 * which is the obvious reading of "the text colour crosses over with it" —
 * sends both through the same mid-tone at the same moment, and the words
 * vanish completely: measured at 1.01:1 halfway through every transition.
 * Picking the better of two fixed foregrounds instead means the text flips at
 * the crossover point and the worst instant of any transition is the best
 * contrast available at that instant.
 */
export function bestForeground(bg: string): string {
  return contrast(bg, BONE) >= contrast(bg, INK) ? BONE : INK
}

/* --------------------------------------------------------------- fields --- */

export type FieldColour = {
  /** The token name used in the brief and in @theme. */
  key: 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6'
  /** Plain descriptive name. Never a trademarked paint name. */
  name: string
  bg: string
  fg: string
  /** Contrast of fg on bg, recorded so it shows up in a diff. */
  ratio: number
}

function field(key: FieldColour['key'], name: string, bg: string): FieldColour {
  const fg = bestForeground(bg)
  const ratio = contrast(bg, fg)
  if (ratio < MIN_CONTRAST) {
    throw new Error(
      `Field "${name}" (${bg}) reaches only ${ratio.toFixed(2)}:1 against its ` +
        `best foreground ${fg}. The floor is ${MIN_CONTRAST}:1. Darken or lighten ` +
        `the field until it clears — do not lower the floor.`,
    )
  }
  return { key, name, bg, fg, ratio: Math.round(ratio * 100) / 100 }
}

export const PALETTE = {
  f1: field('f1', 'deep green', '#1E3A34'),
  f2: field('f2', 'stone', '#E8E2D4'),
  f3: field('f3', 'aubergine', '#3B2E3E'),
  f4: field('f4', 'pale duck egg', '#C3D3CE'),
  f5: field('f5', 'near black', '#14171A'),
  // See the note at the top of this file before changing this value back.
  f6: field('f6', 'burnt red', '#872C14'),
} as const

export const PALETTE_ORDER: readonly FieldColour[] = [
  PALETTE.f1,
  PALETTE.f2,
  PALETTE.f3,
  PALETTE.f4,
  PALETTE.f5,
  PALETTE.f6,
]
