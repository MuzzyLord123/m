/**
 * Places the client's photographs at the filenames the site expects.
 *
 * Each entry is `[source, destination, ratio]`. The source is cropped to the
 * declared ratio from its centre and resized to a sensible ceiling — the
 * originals are phone photographs at 720–1600px and there is nothing to gain
 * from shipping them larger than the biggest slot that renders them.
 *
 * Run: node scripts/place-photos.mjs <source-directory>
 *
 * Unlike generate-placeholders.mjs this DOES overwrite, because its whole job
 * is to replace the stand-ins. It prints the sampled average colour of every
 * file it writes so the `tone` values in src/data/projects.ts can be updated to
 * match — the blur-up must resolve to the photograph's own colour or the page
 * flashes on load.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) {
  console.error("usage: node scripts/place-photos.mjs <source-directory>");
  process.exit(1);
}

const RATIOS = { "3:4": [1200, 1600], "4:3": [1600, 1200], "3:2": [1800, 1200], "4:5": [1200, 1500], "16:9": [1600, 900], "1:1": [1200, 1200] };

/** [source id, destination, ratio] */
const MAP = [
  // Kitchen extension — bare shell through to finished, one property
  ["026", "work/kitchen-extension-01.jpg", "3:4"],
  ["027", "work/kitchen-extension-02.jpg", "3:4"],
  ["029", "work/kitchen-extension-03.jpg", "4:3"],
  ["030", "work/kitchen-extension-04.jpg", "3:4"],
  ["062", "work/kitchen-extension-05.jpg", "4:3"],
  ["064", "work/kitchen-extension-06.jpg", "4:3"],

  // A second extension — bifolds rather than sliders
  ["060", "work/open-plan-kitchen-01.jpg", "4:3"],

  // Alcove joinery, before and after
  ["031", "work/alcove-joinery-01.jpg", "4:3"],
  ["032", "work/alcove-joinery-02.jpg", "4:3"],

  // New staircase
  ["033", "work/new-staircase-01.jpg", "3:4"],
  ["034", "work/new-staircase-02.jpg", "3:4"],
  ["037", "work/new-staircase-03.jpg", "3:4"],

  // Landing balustrade, before and after
  ["040", "work/landing-balustrade-01.jpg", "3:4"],
  ["039", "work/landing-balustrade-02.jpg", "3:4"],

  // Panelled hallway
  ["038", "work/panelled-hallway-01.jpg", "3:4"],
  ["036", "work/panelled-hallway-02.jpg", "3:4"],
  ["056", "work/panelled-hallway-03.jpg", "3:4"],

  // Staircases in colour
  ["047", "work/stairs-colour-01.jpg", "3:4"],
  ["049", "work/stairs-colour-02.jpg", "3:4"],
  ["050", "work/stairs-colour-03.jpg", "3:4"],
  ["052", "work/stairs-colour-04.jpg", "3:4"],
  ["059", "work/stairs-colour-05.jpg", "3:4"],

  // Halls, stairs and landings
  ["028", "work/halls-01.jpg", "3:4"],
  ["043", "work/halls-02.jpg", "3:4"],
  ["042", "work/halls-03.jpg", "3:4"],
  ["053", "work/halls-04.jpg", "4:3"],
  ["057", "work/halls-05.jpg", "4:3"],
  ["058", "work/halls-06.jpg", "3:4"],
  ["061", "work/halls-07.jpg", "3:4"],

  // Exteriors
  ["041", "work/exterior-01.jpg", "3:4"],
  ["045", "work/exterior-02.jpg", "4:3"],
  ["048", "work/exterior-03.jpg", "4:3"],
  ["054", "work/exterior-04.jpg", "3:4"],
  ["055", "work/exterior-05.jpg", "4:3"],

  // Commercial
  ["063", "work/commercial-01.jpg", "4:3"],

  // Feature walls
  ["035", "work/feature-01.jpg", "3:4"],
  ["044", "work/feature-02.jpg", "4:3"],
  ["046", "work/feature-03.jpg", "3:4"],

  // Derived from the above — different crops of the strongest frames
  ["064", "work/hero.jpg", "3:2"],
  ["038", "work/about-portrait.jpg", "4:5"],
  ["060", "work/video-poster.jpg", "16:9"],

  // Social cards
  ["026", "social/post-1.jpg", "1:1"],
  ["038", "social/post-2.jpg", "1:1"],
  ["040", "social/post-3.jpg", "1:1"],
  ["050", "social/post-4.jpg", "1:1"],
  ["045", "social/post-5.jpg", "1:1"],
  ["031", "social/post-6.jpg", "1:1"],
];

const sources = new Map();
for (const f of fs.readdirSync(SRC)) {
  const m = /^(\d{3})-/.exec(f);
  if (m) sources.set(m[1], path.join(SRC, f));
}

const tones = {};
let written = 0;
const missing = [];

for (const [id, dest, ratio] of MAP) {
  const from = sources.get(id);
  if (!from) {
    missing.push(`${id} -> ${dest}`);
    continue;
  }
  const [w, h] = RATIOS[ratio];
  const out = path.join("public", dest);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const buf = await sharp(from)
    .rotate() // honour EXIF orientation before cropping
    .resize(w, h, { fit: "cover", position: "attention" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(out, buf);
  written++;

  /* The channel MEAN, not sharp's `dominant`. Dominant returns the most
     common colour, which on an interior shot is whatever large dark object
     happens to be in frame — a leather sofa reads #282828 for a room that is
     overwhelmingly pale grey. A blur-up wants the overall cast, so that the
     placeholder and the photograph are the same brightness and the swap is
     invisible. */
  const { channels } = await sharp(buf).stats();
  const hex =
    "#" +
    channels
      .slice(0, 3)
      .map((c) => Math.round(c.mean).toString(16).padStart(2, "0"))
      .join("");
  tones["/" + dest] = hex;
}

fs.writeFileSync("scripts/.tones.json", JSON.stringify(tones, null, 2));

console.log(`wrote ${written} files`);
if (missing.length) console.log("MISSING sources:\n  " + missing.join("\n  "));
console.log("tones written to scripts/.tones.json");
