/**
 * Writes stand-in photographs at the exact paths, extensions and aspect ratios
 * the real ones will use, so the layout is honest before a single photo lands
 * and swapping them in is a straight file-for-file replacement.
 *
 * Each stand-in is filled with the tone sampled from the real photograph it
 * replaces, so the page's colour balance is already right.
 *
 *   node scripts/generate-placeholders.mjs
 *
 * Delete a stand-in and drop the real photograph in its place — this script
 * never overwrites a file that already exists.
 */
import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const RATIOS = {
  "3:4": [1200, 1600],
  "4:3": [1600, 1200],
  "3:2": [1600, 1067],
  "16:9": [1600, 900],
  "1:1": [1400, 1400],
  "4:5": [1200, 1500],
};

/**
 * path, aspect ratio, and the tone sampled from the photograph it stands in for.
 * Keep this list in step with src/data/projects.ts.
 */
const IMAGES = [
  ["work/kitchen-extension-01.jpg", "3:4", "#e9e7e2"],
  ["work/kitchen-extension-02.jpg", "3:4", "#efece7"],
  ["work/kitchen-extension-03.jpg", "4:3", "#b9b6ae"],
  ["work/kitchen-extension-04.jpg", "3:4", "#d9cfc0"],
  ["work/alcove-joinery-01.jpg", "4:3", "#a9aca4"],
  ["work/alcove-joinery-02.jpg", "4:3", "#c6a892"],
  ["work/new-staircase-01.jpg", "3:4", "#e3ded7"],
  ["work/new-staircase-02.jpg", "3:4", "#cdb694"],
  ["work/new-staircase-03.jpg", "3:4", "#ded6cb"],
  ["work/landing-balustrade-01.jpg", "3:4", "#4d4b49"],
  ["work/landing-balustrade-02.jpg", "3:4", "#d5c5a7"],
  ["work/panelled-hallway-01.jpg", "3:4", "#dcd7d0"],
  ["work/panelled-hallway-02.jpg", "3:4", "#d9d5cf"],
  ["work/panelled-hallway-03.jpg", "3:4", "#d9d5cf"],
  ["work/stairs-colour-01.jpg", "3:4", "#b4b5b4"],
  ["work/stairs-colour-02.jpg", "3:4", "#4f4d4b"],
  ["work/stairs-colour-03.jpg", "3:4", "#d5d0c8"],
  ["work/stairs-colour-04.jpg", "3:4", "#4a4845"],
  ["work/halls-01.jpg", "3:4", "#cfccc6"],
  ["work/halls-02.jpg", "3:4", "#cdc8c1"],
  ["work/halls-03.jpg", "3:4", "#b7b78f"],
  ["work/halls-04.jpg", "4:3", "#cfc7b8"],
  ["work/exterior-01.jpg", "3:4", "#d6d4d0"],
  ["work/exterior-02.jpg", "4:3", "#e2ded6"],
  ["work/exterior-03.jpg", "4:3", "#dedad3"],
  ["work/exterior-04.jpg", "3:4", "#ddd9d1"],
  ["work/exterior-05.jpg", "4:3", "#e4dfd5"],
  ["work/feature-01.jpg", "3:4", "#c6a334"],
  ["work/feature-02.jpg", "4:3", "#33322f"],
  ["work/feature-03.jpg", "3:4", "#8fae3c"],

  // Hero, about portrait and the video poster
  ["work/hero.jpg", "3:2", "#e9e7e2"],
  ["work/about-portrait.jpg", "4:5", "#d9d5cf"],
  ["work/video-poster.jpg", "16:9", "#dcd7d0"],

  // "Fresh off the brush" social cards
  ["social/post-1.jpg", "1:1", "#a9aca4"],
  ["social/post-2.jpg", "1:1", "#4d4b49"],
  ["social/post-3.jpg", "1:1", "#d6d4d0"],
  ["social/post-4.jpg", "1:1", "#c6a334"],
  ["social/post-5.jpg", "1:1", "#cdb694"],
  ["social/post-6.jpg", "1:1", "#dcd7d0"],
];

function shade(hex, amount) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const clamp = (v) => Math.min(255, Math.max(0, Math.round(v)));
  return { r: clamp(r + amount), g: clamp(g + amount), b: clamp(b + amount) };
}

let written = 0;
let kept = 0;

for (const [path, ratio, tone] of IMAGES) {
  const file = join(root, "public", path);
  if (existsSync(file)) {
    kept += 1;
    continue;
  }
  mkdirSync(dirname(file), { recursive: true });

  const [width, height] = RATIOS[ratio];
  const horizon = Math.round(height * 0.62);

  // A lighter upper band over the sampled tone, so a stand-in reads as a room
  // rather than a flat swatch and the composition is legible at a glance.
  await sharp({
    create: { width, height, channels: 3, background: shade(tone, -10) },
  })
    .composite([
      {
        input: {
          create: { width, height: horizon, channels: 3, background: shade(tone, 14) },
        },
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(file);
  written += 1;
}

console.log(`[placeholders] ${written} written, ${kept} real photographs left alone`);
