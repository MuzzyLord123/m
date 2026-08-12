/**
 * Rewrites the line under the wordmark in the client's logo.
 *
 *   node scripts/make-logo-subtitle.mjs ["Bold part" "italic part"]
 *
 * The logo arrived as a flattened PNG — swoosh, wordmark and strapline baked
 * into one raster with no layers and no vector source. So changing the
 * strapline means erasing those pixels and drawing new ones.
 *
 * IT IS THE SITE'S OWN HEADLINE, SET THE SITE'S OWN WAY. The strapline is
 * "Decorating, done properly." in the two faces the hero uses for exactly that
 * sentence: Bricolage Grotesque semibold for "Decorating," and Instrument Serif
 * Italic for "done properly." — the same pairing, the same weights, the same
 * optical corrections. It reads as the lockup and the page saying one thing in
 * one voice rather than a logo with a caption.
 *
 * The italic carries the three corrections globals.css applies wherever this
 * pair appears, and they are not optional here either:
 *   - 1.06em, because Instrument Serif runs visibly smaller than Bricolage at
 *     the same pixel size
 *   - weight 400, hard. It ships ONE weight, and asking for 600 gets a
 *     synthesised faux-bold, which is the most obviously wrong thing this
 *     typeface can do
 *   - tracking relaxed to -0.005em against the display's -0.035em, because a
 *     serif italic wants air between the strokes that a grotesque does not
 *
 * WHAT MAKES THE ERASE SAFE. The old strapline sat in its own clear rectangle:
 * x 186–584, y 148–192 held 3,954 opaque pixels and ZERO saturated-orange ones,
 * measured before anything was touched. Nothing of the swoosh or the wordmark
 * passes through it. If the artwork is ever replaced, re-measure before
 * trusting these numbers.
 *
 * IDEMPOTENT, AND REVERSIBLE. It always reads logo-original.png — created from
 * logo.png on first run and never written to again — so running it twice, or
 * with different text, gives the same result as running it once. Delete
 * logo.png and re-run to get back to a known state; keep logo-original.png to
 * get the client's untouched artwork back.
 *
 * The metallic fade is sampled off the original strapline: #ceced2 at ~96%
 * alpha down to white at ~50%, brighter and thinner towards the baseline, which
 * is what reads as brushed metal.
 */
import sharp from "sharp";
import fs from "node:fs";
import { launchBrowser } from "./browser.mjs";

const BOLD = process.argv[2] ?? "Decorating,";
const ITALIC = process.argv[3] ?? "done properly.";

const SRC = "public/brand/logo-original.png";
const OUT = "public/brand/logo.png";

/* The clear rectangle, and the type metrics, both measured off the original.
   The box runs to y=204 rather than the 192 the all-caps line needed. That is
   not a guess: x 186-584 was sampled row by row and holds ZERO opaque pixels
   from y=186 all the way past y=210, so the descenders of a mixed-case line
   have room and nothing of the artwork is at risk. The wordmark's lowest orange
   pixel in this column is y=141, which is what sets the ceiling. */
const ERASE = { left: 186, top: 148, width: 399, height: 56 };
/**
 * Cap height, in px, of the bold half — the same 22 the original strapline
 * used, so the lockup keeps its proportions.
 *
 * It was briefly dropped to 19 out of caution about the descenders on a
 * mixed-case line, which cost about a fifth of the strapline's size for no
 * reason: measuring the artwork showed the space below is empty for another
 * twenty pixels. Worth stating because the strapline is rendered at roughly
 * 2.5mm tall in the site header, where every pixel of cap height is the
 * difference between a legible line and a grey smudge.
 */
const CAP_HEIGHT = 22;
const BASELINE = 180;
const CENTRE = 385;
const MAX_WIDTH = 396; // keeps the line inside the cleared box, x 186-584
const SS = 4; // supersample, then downscale — the ink is under 20px tall

if (!fs.existsSync(SRC)) {
  fs.copyFileSync(OUT, SRC);
  console.log(`kept the untouched artwork as ${SRC}`);
}

/* The site's own subset faces, not the upstream packages — so the logo cannot
   drift onto a different cut of the typeface from the one the page renders. */
const FACES = {
  display: "src/fonts/display-normal.woff2",
  italic: "src/fonts/display-italic.woff2",
};
for (const [name, path] of Object.entries(FACES)) {
  if (!fs.existsSync(path)) {
    throw new Error(`font not found: ${path} — run "npm run build" to generate the subsets`);
  }
  FACES[name] = fs.readFileSync(path).toString("base64");
}

const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 2200, height: 400 }, deviceScaleFactor: 1 });

await page.setContent(`<!doctype html><html><head><style>
  @font-face { font-family: D; src: url(data:font/woff2;base64,${FACES.display}) format('woff2'); font-weight: 200 800; font-display: block }
  @font-face { font-family: I; src: url(data:font/woff2;base64,${FACES.italic}) format('woff2'); font-weight: 400; font-style: italic; font-display: block }
  html, body { margin: 0; background: transparent }
  #line { position: absolute; left: 0; top: 0; white-space: pre; color: #fff; font-family: D; font-weight: 600; letter-spacing: -0.035em }
  /* The three corrections, matching globals.css. */
  #line i { font-family: I; font-style: italic; font-weight: 400; font-size: 1.06em; letter-spacing: -0.005em }
</style></head><body><div id="line"><b id="bold"></b> <i id="ital"></i></div></body></html>`);

await page.evaluate(
  ({ bold, italic }) => {
    document.getElementById("bold").textContent = bold;
    document.getElementById("ital").textContent = italic;
  },
  { bold: BOLD, italic: ITALIC },
);
await page.evaluate(async () => {
  await Promise.all([document.fonts.load("600 100px D"), document.fonts.load("italic 400 100px I")]);
  await document.fonts.ready;
});

/**
 * Ink width of the whole line, and cap height measured off a real capital in
 * the display face — the cap-height-to-em ratio differs per typeface, and
 * deriving it from the font size is the difference between a lockup and a near
 * miss.
 */
async function measure(size) {
  return page.evaluate((px) => {
    const line = document.getElementById("line");
    line.style.fontSize = px + "px";
    const width = line.getBoundingClientRect().width;
    const c = document.createElement("canvas");
    c.width = c.height = Math.ceil(px * 3);
    const g = c.getContext("2d");
    g.font = `600 ${px}px D`;
    g.textBaseline = "alphabetic";
    g.fillStyle = "#fff";
    g.fillText("D", 5, px * 2);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let top = -1, bottom = -1;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        if (d[(y * c.width + x) * 4 + 3] > 20) {
          if (top < 0) top = y;
          bottom = y;
          break;
        }
      }
    }
    return { width, capHeight: bottom - top + 1 };
  }, size);
}

/* Size to the cap height first, then shrink only if the line is too wide.
   Tracking is not a fitting lever here: both halves carry the tracking their
   face needs, and squeezing either would stop it matching the hero. */
let size = 26;
for (let i = 0; i < 14; i++) {
  const m = await measure(size);
  const err = CAP_HEIGHT / m.capHeight;
  if (Math.abs(1 - err) < 0.005) break;
  size *= err;
}
for (let i = 0; i < 30; i++) {
  const m = await measure(size);
  if (m.width <= MAX_WIDTH) break;
  size *= Math.max(0.97, MAX_WIDTH / m.width);
}
const fitted = await measure(size);
console.log(
  `fitted: ${size.toFixed(2)}px -> ${fitted.width.toFixed(1)}px wide, ` +
    `cap height ${fitted.capHeight}px (target ${CAP_HEIGHT}, max width ${MAX_WIDTH})`,
);
if (fitted.width > MAX_WIDTH + 1) {
  console.log(`WARNING: ${Math.round(fitted.width)}px is wider than the lockup allows`);
}

/* Paint at 4x with the metallic fade. background-clip: text so the gradient is
   the ink itself rather than a box behind it; on the container, so the two
   faces share one continuous fade instead of restarting at the italic. */
await page.evaluate(
  ({ px, ss }) => {
    const line = document.getElementById("line");
    line.style.fontSize = px * ss + "px";
    Object.assign(line.style, {
      backgroundImage:
        "linear-gradient(to bottom, rgba(206,206,210,0.97) 0%, rgba(214,214,219,0.92) 45%," +
        " rgba(236,234,240,0.72) 74%, rgba(255,255,255,0.5) 100%)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      lineHeight: "1.35",
    });
  },
  { px: size, ss: SS },
);

const shot = await page.locator("#line").screenshot({ omitBackground: true });
await browser.close();

/* Trim to the ink so placement is driven by the glyphs, not by whatever leading
   the line box happened to carry. */
const trimmed = await sharp(shot).trim({ threshold: 1 }).toBuffer();
const meta = await sharp(trimmed).metadata();
const targetW = Math.round(meta.width / SS);
const targetH = Math.round(meta.height / SS);
const line = await sharp(trimmed)
  .resize(targetW, targetH, { fit: "fill", kernel: "lanczos3" })
  .toBuffer();

/* The trimmed strip starts at the tallest ink — the capital D — so its top sits
   CAP_HEIGHT above the baseline. */
const left = Math.round(CENTRE - targetW / 2);
const top = Math.round(BASELINE - CAP_HEIGHT);

/* Clear the old line, then lay the new one in. `dest-out` with a solid rect
   punches the rectangle to transparent without touching anything outside it. */
const cleared = await sharp(SRC)
  .ensureAlpha()
  .composite([
    {
      input: {
        create: { width: ERASE.width, height: ERASE.height, channels: 4, background: "#000" },
      },
      left: ERASE.left,
      top: ERASE.top,
      blend: "dest-out",
    },
  ])
  .png()
  .toBuffer();

await sharp(cleared)
  .composite([{ input: line, left, top }])
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`"${BOLD} ${ITALIC}"  ->  ${OUT}`);
console.log(
  `   placed ${targetW}x${targetH}px at x=${left}, y=${top} ` +
    `(baseline ${BASELINE}, centre ${CENTRE}, bottom of ink y=${top + targetH})`,
);
if (top + targetH > ERASE.top + ERASE.height) {
  console.log(`   WARNING: ink reaches y=${top + targetH}, past the cleared box at y=${ERASE.top + ERASE.height}`);
}
