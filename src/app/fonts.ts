import localFont from "next/font/local";

/**
 * Fonts are self-hosted variable woff2 files committed to `src/fonts`.
 * There is no Google Fonts <link> and no runtime request to a font CDN.
 *
 * SWAPPING TO CLASH DISPLAY / GENERAL SANS
 * ---------------------------------------
 * The brand specifies Clash Display (display) and General Sans (body) from
 * Fontshare. Fontshare could not be reached from the build environment, so the
 * closest free variable equivalents are shipped instead:
 *   display -> Archivo Variable          (wght 100–900 + true italic)
 *   body    -> Schibsted Grotesk Variable (wght 400–700 + true italic)
 *
 * To swap: download the Clash Display and General Sans variable woff2 files
 * from fontshare.com, drop them into `src/fonts` with the same four filenames
 * (display-normal / display-italic / body-normal / body-italic), and adjust the
 * `weight` ranges below to match the axes those files expose. Nothing else in
 * the codebase references a font by name.
 */

export const display = localFont({
  src: [
    { path: "../fonts/display-normal.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/display-italic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--ff-display",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica Neue", "sans-serif"],
});

export const body = localFont({
  src: [
    { path: "../fonts/body-normal.woff2", weight: "400 700", style: "normal" },
    { path: "../fonts/body-italic.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--ff-body",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica Neue", "sans-serif"],
});
