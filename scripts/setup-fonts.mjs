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
 * An existing file is never overwritten — drop a licensed face into `src/fonts`
 * under one of these filenames and this script leaves it alone.
 *
 * DELETE src/fonts/*.woff2 AND RE-RUN after changing anything below, or the
 * old faces survive the change and nothing appears to happen.
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
    from: "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
  },
  {
    /* Bricolage Grotesque has no italic, and it should not have one: the
       emphasised words on this site are a DIFFERENT VOICE, not a slanted
       version of the same one. Instrument Serif's italic is a high-contrast
       serif — the single face on the page that says the build was art
       directed rather than assembled. It is a static 400 weight, which is all
       an emphasis face needs. */
    target: "display-italic.woff2",
    from: "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2",
  },
  {
    target: "body-normal.woff2",
    from: "@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2",
  },
  {
    target: "body-italic.woff2",
    from: "@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-italic.woff2",
  },
  {
    /* Eyebrows, indices, tabular figures and every uppercase label. A mono in
       those slots is what separates a designed interface from a styled one —
       it makes the numbers line up and the labels read as instrumentation. */
    target: "mono-normal.woff2",
    from: "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
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
