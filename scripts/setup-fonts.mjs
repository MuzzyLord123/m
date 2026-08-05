/**
 * Places the self-hosted variable font files into `src/fonts` before a build.
 *
 * The fonts are pinned npm dependencies rather than committed binaries, so the
 * exact same woff2 files land in every environment (local, CI, the Docker
 * image) without a runtime request to any font CDN. `next/font/local` then
 * hashes, preloads and serves them from our own origin.
 *
 * An existing file is never overwritten. To use the real Clash Display and
 * General Sans from Fontshare, drop them into `src/fonts` under these four
 * filenames and this script leaves them alone.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
  copyFileSync(src, dest);
  console.log(`[fonts] ${font.target}`);
}
