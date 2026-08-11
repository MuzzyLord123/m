/**
 * WCAG contrast checker for the palette.
 *
 *   node scripts/contrast.mjs
 *
 * The point of this file is that the palette's contrast ratios are COMPUTED, not
 * asserted. A dark theme with a gold accent is exactly where accessibility goes
 * wrong: mid-gold on near-black lands around 3-4:1, which looks fine and fails.
 * Every pair the design uses is listed below with the use it is allowed for, and
 * the script fails if any pair does not clear the threshold for that use.
 *
 * Thresholds (WCAG 2.2 AA):
 *   body      4.5:1  — text below 24px, or below 19px bold
 *   large     3.0:1  — text 24px+, or 19px+ bold
 *   ui        3.0:1  — borders and graphics that carry meaning (1.4.11)
 *   decor     none   — decorative only, must never be the sole carrier of meaning
 */

/* ------------------------------------------------------------------ *
 * The palette
 * ------------------------------------------------------------------ */

export const PALETTE = {
  // Surfaces — the sheen ladder: matt wall, satin panel, recessed well.
  matt: '#12100E',
  satin: '#1F1C18',
  satinHot: '#2B2519',
  well: '#0A0908',

  // Text — three tiers.
  paper: '#EFEAE2',
  paperDim: '#ADA79D',
  paperFaint: '#948D82',

  // Gold — signwriter's brass, four steps.
  gold: '#C9A227',
  goldLift: '#E2C55F',
  goldPress: '#A07D18',
  goldDeep: '#8C6D14',

  // Lines.
  edge: '#787166',
  rule: '#2C2823',

  // One status colour.
  alert: '#F47962',
}

/* ------------------------------------------------------------------ *
 * WCAG maths
 * ------------------------------------------------------------------ */

const srgbToLinear = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

export function luminance(hex) {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

export function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Truncate rather than round: 4.47 must read as 4.4, never as 4.5. */
const show = (n) => (Math.floor(n * 10) / 10).toFixed(1)

const THRESHOLD = { body: 4.5, large: 3, ui: 3, decor: 0 }

/* ------------------------------------------------------------------ *
 * Every pair the design uses, and what it is allowed to do
 * ------------------------------------------------------------------ */

const P = PALETTE

const PAIRS = [
  // --- Body copy ---------------------------------------------------
  [P.paper, P.matt, 'body', 'Body copy and headings on the page ground'],
  [P.paper, P.satin, 'body', 'Body copy on a raised panel'],
  [P.paper, P.well, 'body', 'Input text, callout chip labels, footer links'],
  [P.paper, P.satinHot, 'body', 'Text in a hovered table row'],

  [P.paperDim, P.matt, 'body', 'Secondary copy, nav links'],
  [P.paperDim, P.satin, 'body', 'Spec-table labels, review attribution'],
  [P.paperDim, P.well, 'body', 'Placeholders, footer links'],
  [P.paperDim, P.satinHot, 'body', 'Secondary text in a hovered row'],

  [P.paperFaint, P.matt, 'body', 'Micro-labels, 14px floor'],
  [P.paperFaint, P.satin, 'body', 'Micro-labels on a panel'],
  [P.paperFaint, P.well, 'body', 'Empty-frame text, the to-confirm chip'],
  [P.paperFaint, P.satinHot, 'body', 'Micro-labels in a hovered row'],

  // --- Gold as text (headings, numerals, links) --------------------
  [P.gold, P.matt, 'body', 'Section numerals, small gold labels, inline links'],
  [P.gold, P.satin, 'body', 'Gold labels on a panel'],
  [P.gold, P.well, 'body', 'Spec-table head labels, footer headings'],
  [P.gold, P.satinHot, 'body', 'Gold numerals in a hovered row'],

  [P.goldLift, P.matt, 'body', 'Hover text'],
  [P.goldLift, P.satin, 'body', 'Hover text on a panel'],
  [P.goldLift, P.well, 'body', 'Hover text in a well'],

  // --- Gold as a fill, with ink on top ----------------------------
  [P.matt, P.gold, 'body', 'Primary button label at rest'],
  [P.matt, P.goldLift, 'body', 'Primary button label on hover'],
  [P.matt, P.goldPress, 'body', 'Primary button label while pressed'],

  // --- Meaningful borders and graphics (1.4.11) -------------------
  [P.edge, P.matt, 'ui', 'Frame and table borders on the page ground'],
  [P.edge, P.satin, 'ui', 'Borders on a raised panel'],
  [P.edge, P.well, 'ui', 'Input field borders'],
  [P.edge, P.satinHot, 'ui', 'Borders inside a hovered row'],
  [P.gold, P.matt, 'ui', 'Leader lines, focus ring, active indicators'],
  [P.goldLift, P.matt, 'ui', 'Focus ring'],
  [P.goldLift, P.satin, 'ui', 'Focus ring on a panel'],
  [P.goldLift, P.well, 'ui', 'Focus ring on an input'],
  [P.goldDeep, P.matt, 'ui', 'The gold edge under the header'],
  [P.goldDeep, P.well, 'ui', 'The gold edge above the footer'],

  // --- Large text only -------------------------------------------
  [P.goldDeep, P.matt, 'large', 'Display headings 24px+ only'],

  // --- Status ----------------------------------------------------
  [P.alert, P.matt, 'body', 'Error text'],
  [P.alert, P.satin, 'body', 'Error text on a panel'],
  [P.alert, P.well, 'body', 'Inline field error'],

  // --- Decorative, declared so it is on the record ---------------
  [P.rule, P.matt, 'decor', 'The exposed grid. Never the sole carrier of meaning.'],
  [P.rule, P.satin, 'decor', 'Internal table row rules'],
  [P.satin, P.matt, 'decor', 'Surface separation — reinforced by an edge, never fill alone'],
  [P.well, P.matt, 'decor', 'Surface separation — reinforced by an edge'],
]

/**
 * Pairs that MUST fail at body size, and are therefore prohibited in the build.
 *
 * Listing them keeps the prohibition true rather than remembered: if a future
 * palette tweak accidentally makes one pass, the script says so instead of leaving
 * a restriction in place that no longer has a reason behind it. That is not
 * hypothetical — the first draft of this palette carried two prohibitions that
 * turned out to be unnecessary once the arithmetic was actually run.
 */
const PROHIBITED = [
  [P.matt, P.goldDeep, 'The darkest gold as a fill under a label — the gold-gradient trap.'],
  [P.goldDeep, P.satin, 'The darkest gold as small text on a panel. Large text only.'],
  [P.goldDeep, P.satinHot, 'The darkest gold as small text in a hovered row.'],
]

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const hexName = Object.fromEntries(Object.entries(P).map(([k, v]) => [v.toLowerCase(), k]))
const label = (hex) => `${hexName[hex.toLowerCase()] ?? '?'} ${hex}`

/*
 * Only print and exit when run directly. check-content.mjs imports `PALETTE` and
 * `ratio` from here so there is one contrast checker rather than two that can
 * disagree — and an import must not dump 40 rows into that script's output or call
 * process.exit() underneath it.
 */
const runDirectly = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href

if (!runDirectly) {
  // Exported above; nothing else to do.
} else {
  report()
}

function report() {
  let failures = 0
  const line = '─'.repeat(94)

  console.log(`\n${line}\nPalette contrast — computed, not asserted\n${line}`)
  console.log(
    `${'foreground'.padEnd(20)}${'background'.padEnd(20)}${'ratio'.padStart(7)}  ${'need'.padStart(5)}  use`,
  )
  console.log('─'.repeat(94))

  for (const [fg, bg, kind, use] of PAIRS) {
    const r = ratio(fg, bg)
    const need = THRESHOLD[kind]
    const ok = r >= need
    if (!ok) failures++
    const mark = kind === 'decor' ? '·' : ok ? '✓' : '✗'
    console.log(
      `${mark} ${label(fg).padEnd(18)}${label(bg).padEnd(20)}${show(r).padStart(7)}  ${
        need ? String(need).padStart(5) : '    —'
      }  ${use}`,
    )
  }

  console.log(`\n${line}\nProhibited pairs — these are expected to fail\n${line}`)
  for (const [fg, bg, why] of PROHIBITED) {
    const r = ratio(fg, bg)
    const stillFails = r < 4.5
    console.log(
      `${stillFails ? '✓' : '!'} ${label(fg).padEnd(18)}${label(bg).padEnd(20)}${show(r).padStart(7)}  ${why}`,
    )
  }

  console.log(`\n${line}`)
  if (failures === 0) {
    console.log('Every permitted pair clears its threshold.\n')
    process.exit(0)
  }
  console.log(`${failures} pair(s) below threshold. Fix the palette, not the threshold.\n`)
  process.exit(1)
}
