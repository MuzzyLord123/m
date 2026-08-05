/**
 * Places the self-hosted variable font files into `src/fonts` before a build,
 * subset to the characters this site actually renders.
 *
 * The fonts are pinned npm dependencies rather than committed binaries, so the
 * exact same woff2 files land in every environment (local, CI, the Docker
 * image) without a runtime request to any font CDN. `next/font/local` then
 * hashes, preloads and serves them from our own origin.
 *
 * Subsetting matters here: all four faces are preloaded, which puts them on
 * the critical path ahead of the hero image. Full-latin variable faces cost
 * ~171KB together; cut to the glyphs a British decorator's website uses, they
 * cost ~89KB, and the LCP image gets the bandwidth back.
 *
 * An existing file is never overwritten. To use the real Clash Display and
 * General Sans from Fontshare, drop them into `src/fonts` under these four
 * filenames and this script leaves them alone.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "src", "fonts");

const FONTS = [
  {
    target: "display-normal.woff2",
    from: "@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2",
  },
  {
    target: "display-italic.woff2",
    from: "@fontsource-variable/archivo/files/archivo-latin-wght-italic.woff2",
  },
  {
    target: "body-normal.woff2",
    from: "@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2",
  },
  {
    target: "body-italic.woff2",
    from: "@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-italic.woff2",
  },
];

/**
 * Every character the site can render: basic latin, the pound sign, the
 * separators and quotation marks used in the copy, and é for the odd name.
 */
const CHARACTERS =
  Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCodePoint(0x20 + i)).join("") +
  " £·×é–—‘’“”•";

mkdirSync(out, { recursive: true });

for (const font of FONTS) {
  const dest = join(out, font.target);
  if (existsSync(dest)) continue;

  const src = join(root, "node_modules", font.from);
  if (!existsSync(src)) {
    console.error(
      `[fonts] Missing ${font.from}. Run "npm install" — the font packages are devDependencies.`,
    );
    process.exit(1);
  }

  try {
    const subset = await subsetFont(readFileSync(src), CHARACTERS, {
      targetFormat: "woff2",
      // Keep the variable axes: the design uses the full weight range.
      variationAxes: undefined,
    });
    writeFileSync(dest, subset);
    const saved = Math.round((1 - statSync(dest).size / statSync(src).size) * 100);
    console.log(`[fonts] ${font.target} (${saved}% smaller after subsetting)`);
  } catch (error) {
    // Never fail a build over an optimisation: ship the full face instead.
    console.warn(`[fonts] Could not subset ${font.target}, using the full face.`, error);
    copyFileSync(src, dest);
  }
}
