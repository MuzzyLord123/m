import localFont from "next/font/local";

/**
 * Fonts are self-hosted variable woff2 files, subset by scripts/setup-fonts.mjs
 * to the characters this site renders. There is no Google Fonts <link> and no
 * runtime request to a font CDN.
 *
 * THE TYPE SYSTEM
 * ---------------
 * Three voices, and each one is doing a different job:
 *
 *   display  Bricolage Grotesque  — the headline face. A contemporary
 *            grotesque with genuinely odd, drawn details (the flat-sided
 *            bowls, the cut terminals) that survive at 5rem and read as
 *            drawn-for-this rather than picked-from-a-list.
 *
 *   emphasis Instrument Serif Italic — the emphasised words inside headlines
 *            ("done properly.", "not", "decorator"). Deliberately NOT an
 *            italic of the display face. A slanted grotesque is the same voice
 *            leaning over; a high-contrast serif italic beside a grotesque is
 *            two voices in conversation, and it is the single cue that most
 *            reliably separates an art-directed page from a styled one.
 *
 *   body     Instrument Sans — quiet, high legibility, a real italic. Sits
 *            under the display without competing with it.
 *
 *   mono     JetBrains Mono — every eyebrow, index, count and tabular figure.
 *            Monospace in those slots is what makes the numbers line up and
 *            the labels read as instrumentation rather than small text.
 *
 * These replace Archivo + Schibsted Grotesk, which were competent and
 * completely anonymous: two neutral grotesques, one slightly tighter than the
 * other, doing the same job in the same voice at two sizes.
 *
 * WHAT IS PRELOADED, AND WHY
 * --------------------------
 * next/font preloads every file in a family. Preloading all five put ~130KB
 * ahead of the hero image on the critical path. Only the two faces that paint
 * immediately — the display upright and the body upright — are preloaded. The
 * italics are a handful of emphasised words and the mono is short labels; both
 * can arrive a moment later without anything moving, because every one of them
 * carries a size-adjusted fallback.
 */

export const display = localFont({
  src: [{ path: "../fonts/display-normal.woff2", weight: "200 800", style: "normal" }],
  variable: "--ff-display",
  display: "swap",
  // Generates a size-adjusted fallback so the swap from system text to the real
  // face barely moves anything. Without it, making the hero text paint
  // immediately (rather than fading in after hydration) exposed the reflow and
  // pushed CLS from 0.019 to 0.041.
  adjustFontFallback: "Arial",
  preload: true,
  // next/font is statically analysed, so this list is inlined per call.
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica Neue", "sans-serif"],
});

export const displayItalic = localFont({
  /* Instrument Serif ships one weight, and an emphasis face needs exactly one.
     Declared 400-only rather than a range so the browser never synthesises a
     bold from it — a faux-bold high-contrast serif is unmistakably wrong. */
  src: [{ path: "../fonts/display-italic.woff2", weight: "400", style: "italic" }],
  variable: "--ff-display-italic",
  display: "swap",
  // A serif fallback, because this face IS a serif — falling back to Arial
  // italic would swap in a slanted grotesque and then jump to a serif, which
  // is the most visible font swap on the page.
  adjustFontFallback: "Times New Roman",
  // Not preloaded. Preloading it costs ~0.7s of LCP on a throttled mobile
  // connection and buys back 0.019 of CLS — a bad trade when the budget is
  // 0.1. The hero's italic line swaps in a moment after the uprights.
  preload: false,
  // next/font is statically analysed, so this list is inlined per call.
  fallback: ["ui-serif", "Georgia", "Times New Roman", "serif"],
});

export const body = localFont({
  src: [{ path: "../fonts/body-normal.woff2", weight: "400 700", style: "normal" }],
  variable: "--ff-body",
  display: "swap",
  // Generates a size-adjusted fallback so the swap from system text to the real
  // face barely moves anything. Without it, making the hero text paint
  // immediately (rather than fading in after hydration) exposed the reflow and
  // pushed CLS from 0.019 to 0.041.
  adjustFontFallback: "Arial",
  preload: true,
  // next/font is statically analysed, so this list is inlined per call.
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica Neue", "sans-serif"],
});

export const bodyItalic = localFont({
  src: [{ path: "../fonts/body-italic.woff2", weight: "400 700", style: "italic" }],
  variable: "--ff-body-italic",
  display: "swap",
  // Generates a size-adjusted fallback so the swap from system text to the real
  // face barely moves anything. Without it, making the hero text paint
  // immediately (rather than fading in after hydration) exposed the reflow and
  // pushed CLS from 0.019 to 0.041.
  adjustFontFallback: "Arial",
  // Not preloaded: body italics are a handful of emphasised words, all below
  // the fold, so this face can arrive whenever it is first needed.
  preload: false,
  // next/font is statically analysed, so this list is inlined per call.
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica Neue", "sans-serif"],
});

export const mono = localFont({
  src: [{ path: "../fonts/mono-normal.woff2", weight: "400 700", style: "normal" }],
  variable: "--ff-mono",
  display: "swap",
  // Generates a size-adjusted fallback so the swap from system text to the real
  // face barely moves anything. The eyebrow above the hero headline is the
  // first mono on the page and it is above the fold.
  adjustFontFallback: "Arial",
  // Not preloaded: every use is a short label at small size, and the
  // size-adjusted fallback holds the space until it lands.
  preload: false,
  // next/font is statically analysed, so this list is inlined per call.
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});
