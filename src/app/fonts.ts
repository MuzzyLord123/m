import localFont from "next/font/local";

/**
 * Fonts are self-hosted variable woff2 files, subset by scripts/setup-fonts.mjs
 * to the characters this site renders. There is no Google Fonts <link> and no
 * runtime request to a font CDN.
 *
 * The upright and italic faces are declared separately on purpose. next/font
 * preloads every file in a family, and preloading all four put ~107KB ahead of
 * the hero image on the critical path. The uprights are preloaded because they
 * paint immediately; the italics are not, because they are used for a handful
 * of emphasised words and can arrive a moment later. globals.css routes italic
 * text to the right family.
 *
 * SWAPPING TO CLASH DISPLAY / GENERAL SANS
 * ---------------------------------------
 * The brand specifies Clash Display (display) and General Sans (body) from
 * Fontshare, which could not be reached from the build environment, so the
 * closest free variable equivalents ship instead:
 *   display -> Archivo Variable          (wght 100–900 + true italic)
 *   body    -> Schibsted Grotesk Variable (wght 400–700 + true italic)
 *
 * To swap: download the Clash Display and General Sans variable woff2 files
 * from fontshare.com, drop them into `src/fonts` with the same four filenames,
 * and adjust the `weight` ranges below to match the axes those files expose.
 * Nothing else in the codebase references a font by name.
 */

export const display = localFont({
  src: [{ path: "../fonts/display-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--ff-display",
  display: "swap",
  preload: true,
  // next/font is statically analysed, so this list is inlined per call.
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica Neue", "sans-serif"],
});

export const displayItalic = localFont({
  src: [{ path: "../fonts/display-italic.woff2", weight: "100 900", style: "italic" }],
  variable: "--ff-display-italic",
  display: "swap",
  // Not preloaded. Preloading it costs ~0.7s of LCP on a throttled mobile
  // connection and buys back 0.019 of CLS — a bad trade when the budget is
  // 0.1. The hero's italic line swaps in a moment after the uprights.
  preload: false,
  // next/font is statically analysed, so this list is inlined per call.
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica Neue", "sans-serif"],
});

export const body = localFont({
  src: [{ path: "../fonts/body-normal.woff2", weight: "400 700", style: "normal" }],
  variable: "--ff-body",
  display: "swap",
  preload: true,
  // next/font is statically analysed, so this list is inlined per call.
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica Neue", "sans-serif"],
});

export const bodyItalic = localFont({
  src: [{ path: "../fonts/body-italic.woff2", weight: "400 700", style: "italic" }],
  variable: "--ff-body-italic",
  display: "swap",
  // Not preloaded: body italics are a handful of emphasised words, all below
  // the fold, so this face can arrive whenever it is first needed.
  preload: false,
  // next/font is statically analysed, so this list is inlined per call.
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica Neue", "sans-serif"],
});
